/**
 * 預約待辦佇列（appointment_outbox）的執行器。
 *
 * 為什麼需要這支：建預約時只把「進日曆」「通知邱姐」「通知客戶」丟進 appointment_outbox
 * 排隊，本身不做事（這樣客戶按送出不用等 Google 和寄信）。
 * 但一直沒有人把佇列跑掉 —— 結果後台永遠顯示「已排隊」，日曆不會進、通知不會發。
 *
 * 這支就是把排隊的工作真的執行掉。呼叫點：
 *   - 建預約 / 改期 / 取消之後（用 next/server 的 after()，回應送出去之後才跑，客戶不用等）
 *   - 後台預約頁載入時（保險：萬一上面那次剛好失敗，邱姐開後台就會補跑）
 *
 * 🔴 一條紅線：這支不論怎麼炸都不可以往外丟例外。
 *    它跑在「預約已經成立」之後，這裡爆掉不該讓客戶看到預約失敗。
 */
import {
  claimAppointmentOutbox,
  finishAppointmentOutbox,
  getAppointment,
  listDueAppointmentOutbox,
  meetTypeLabel,
  intentLabel,
  setAppointmentCalendarSync,
  setAppointmentGoogleEvent,
  settleAppointmentOutbox,
  type AppointmentOutboxRow,
  type AppointmentRow,
  type MeetLocation,
} from "@/lib/appointment";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarDisplaySettings,
  isGoogleBound,
  isGoogleConfigured,
  updateCalendarEventTime,
} from "@/lib/google-calendar";
import { renderCalendarTitle } from "@/lib/appointment-calendar-display";
import {
  formatSlotRangeTw,
  notifyAppointmentChange,
  notifyNewAppointment,
  type NotifyInput,
} from "@/lib/appointment-notify";
import {
  AppointmentAnalyticsSettlement,
  runAppointmentAnalyticsTask,
} from "@/lib/appointment-analytics";

const LEGACY_DEFAULT_DURATION_MIN = 60;

function parseMeetLocation(raw: string | null): MeetLocation | null {
  if (!raw) return null;
  try {
    const loc = JSON.parse(raw) as Partial<MeetLocation>;
    if (!loc?.name) return null;
    return {
      name: String(loc.name).slice(0, 120),
      address: String(loc.address || "").slice(0, 200),
      lat: typeof loc.lat === "number" ? loc.lat : null,
      lng: typeof loc.lng === "number" ? loc.lng : null,
      placeId: typeof loc.placeId === "string" ? loc.placeId : null,
      source: loc.source === "google" ? "google" : "manual",
    };
  } catch {
    return null;
  }
}

function parseIntent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
  } catch {
    // 舊資料可能是逗號分隔的純字串，不是 JSON
  }
  return String(raw)
    .split(/[,，]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function slotEndOf(appt: AppointmentRow): Date {
  const start = new Date(appt.slot_at);
  return appt.slot_end_at
    ? new Date(appt.slot_end_at)
    : new Date(start.getTime() + LEGACY_DEFAULT_DURATION_MIN * 60_000);
}

function toNotifyInput(appt: AppointmentRow): NotifyInput {
  return {
    id: appt.id,
    name: appt.name,
    gender: appt.gender,
    phone: appt.phone,
    email: appt.email,
    lineId: appt.line_id,
    meetType: appt.meet_type,
    meetLocation: parseMeetLocation(appt.meet_location),
    intent: parseIntent(appt.intent),
    urgency: appt.urgency,
    note: appt.note,
    slotAt: new Date(appt.slot_at),
    slotEndAt: slotEndOf(appt),
    aiHeat: appt.ai_heat,
    aiSuggestion: appt.ai_suggestion,
    meetUrl: appt.meet_url,
    status: appt.status,
    confirmationDeadline: appt.confirmation_deadline,
  };
}

function parsePayload(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** 佇列項目要「就此了結、不要再重試」時丟這個（例如沒設定 Google、功能還沒做）。 */
class OutboxSettlement extends Error {
  constructor(
    readonly status: "blocked_config" | "skipped_no_consent" | "skipped_no_identity" | "failed_permanent",
    message: string,
  ) {
    super(message);
    this.name = "OutboxSettlement";
  }
}

async function buildCalendarEvent(appt: AppointmentRow): Promise<{
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  withMeet: boolean;
  location: string | null;
  attendeeEmail: string | null;
  attendeeName: string | null;
}> {
  const display = await getCalendarDisplaySettings();
  const intents = parseIntent(appt.intent);
  const location = parseMeetLocation(appt.meet_location);
  const summary = renderCalendarTitle(display.titleTemplate, {
    name: appt.name,
    phone: appt.phone,
    meetTypeLabel: meetTypeLabel(appt.meet_type),
    intent: intents[0] ? intentLabel(intents[0]) : null,
    purpose: intents[1] ? intentLabel(intents[1]) : null,
  });
  const lines = [
    `姓名：${appt.name}`,
    `電話：${appt.phone}`,
    `Email：${appt.email}`,
    appt.line_id ? `LINE：${appt.line_id}` : null,
    `方式：${meetTypeLabel(appt.meet_type)}`,
    intents.length ? `來意：${intents.map(intentLabel).join(" / ")}` : null,
    appt.urgency ? `急迫度：${appt.urgency}` : null,
    appt.note ? `備註：${appt.note}` : null,
    appt.case_no ? `案件編號：${appt.case_no}` : null,
  ].filter(Boolean);
  return {
    summary,
    description: lines.join("\n"),
    startIso: new Date(appt.slot_at).toISOString(),
    endIso: slotEndOf(appt).toISOString(),
    // 線上視訊才需要 Google Meet 連結；門市面談產一個沒人用的會議室只是雜訊
    withMeet: appt.meet_type === "video",
    location:
      appt.meet_type === "custom" && location
        ? [location.name, location.address].filter(Boolean).join(" ")
        : null,
    attendeeEmail: appt.email || null,
    attendeeName: appt.name || null,
  };
}

async function runOne(task: AppointmentOutboxRow): Promise<void> {
  const appt = await getAppointment(task.appointment_id);
  if (!appt) {
    throw new OutboxSettlement("failed_permanent", "appointment_not_found");
  }
  const payload = parsePayload(task.payload_json);

  switch (task.task_type) {
    case "calendar_create": {
      if (!isGoogleConfigured()) throw new OutboxSettlement("blocked_config", "google_not_configured");
      if (!(await isGoogleBound())) throw new OutboxSettlement("blocked_config", "google_not_bound");
      // 已經有 event 了就別再建一顆（重跑佇列時不會變成兩筆行程）
      if (appt.google_event_id) {
        await setAppointmentCalendarSync({ id: appt.id, status: "synced" });
        return;
      }
      const created = await createCalendarEvent(await buildCalendarEvent(appt));
      if (!created) throw new Error("calendar_create_failed");
      await setAppointmentGoogleEvent(appt.id, created.eventId, created.meetUrl);
      await setAppointmentCalendarSync({ id: appt.id, status: "synced" });
      return;
    }

    case "calendar_reschedule": {
      if (!isGoogleConfigured()) throw new OutboxSettlement("blocked_config", "google_not_configured");
      if (!appt.google_event_id) throw new OutboxSettlement("failed_permanent", "google_event_id_missing");
      await updateCalendarEventTime(
        appt.google_event_id,
        new Date(appt.slot_at).toISOString(),
        slotEndOf(appt).toISOString(),
      );
      await setAppointmentCalendarSync({ id: appt.id, status: "synced" });
      return;
    }

    case "calendar_cancel": {
      if (!appt.google_event_id) {
        // 本來就沒進日曆，取消當然不用做事
        await setAppointmentCalendarSync({ id: appt.id, status: "cancelled" });
        return;
      }
      await deleteCalendarEvent(appt.google_event_id);
      await setAppointmentGoogleEvent(appt.id, null, null);
      await setAppointmentCalendarSync({ id: appt.id, status: "cancelled" });
      return;
    }

    case "notify_new": {
      const phase = payload.phase === "confirmation_request" ? "confirmation_request" : "confirmed";
      const result = await notifyNewAppointment(toNotifyInput(appt), { phase, onlyPending: true });
      if (!result.ok) throw new Error("notify_new_failed");
      return;
    }

    case "notify_reschedule":
    case "notify_cancel": {
      const type = task.task_type === "notify_cancel" ? "cancel" : "reschedule";
      const previousSlotTw =
        typeof payload.previousSlotAt === "string"
          ? formatSlotRangeTw(new Date(payload.previousSlotAt))
          : null;
      const result = await notifyAppointmentChange(
        toNotifyInput(appt),
        { type, previousSlotTw },
        { notifyAdmin: true, onlyPending: true },
      );
      if (!result.ok) throw new Error(`${task.task_type}_failed`);
      return;
    }

    case "analytics_ga4":
    case "analytics_meta": {
      try {
        await runAppointmentAnalyticsTask(task, appt, payload);
      } catch (error) {
        if (error instanceof AppointmentAnalyticsSettlement) {
          throw new OutboxSettlement(error.status, error.message);
        }
        throw error;
      }
      return;
    }

    case "ai_grade":
      // AI 熱度評分還沒接上。就此了結，不要留在佇列裡一直重試、也不要在後台顯示成「異常」。
      throw new OutboxSettlement("blocked_config", "ai_grading_not_implemented");

    default:
      throw new OutboxSettlement("failed_permanent", `unknown_task_type:${task.task_type}`);
  }
}

export type OutboxRunResult = { picked: number; done: number; settled: number; failed: number };

/**
 * 把到期的佇列工作跑掉。
 * 失敗的會由 finishAppointmentOutbox 自己算退避時間排下一次（第 8 次才放棄）。
 */
export async function runAppointmentOutbox(limit = 10): Promise<OutboxRunResult> {
  const result: OutboxRunResult = { picked: 0, done: 0, settled: 0, failed: 0 };
  let due: AppointmentOutboxRow[] = [];
  try {
    due = await listDueAppointmentOutbox(limit);
  } catch (error) {
    console.error("[outbox] 讀取待辦失敗:", error);
    return result;
  }

  for (const task of due) {
    try {
      // 搶不到代表另一個請求正在跑同一筆，跳過就好
      if (!(await claimAppointmentOutbox(task.id))) continue;
      result.picked += 1;
      try {
        await runOne(task);
        await finishAppointmentOutbox(task.id);
        result.done += 1;
      } catch (error) {
        if (error instanceof OutboxSettlement) {
          await settleAppointmentOutbox({ id: task.id, status: error.status, reason: error.message });
          result.settled += 1;
        } else {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[outbox] ${task.task_type} 失敗:`, message);
          if (task.task_type === "calendar_create") {
            await setAppointmentCalendarSync({
              id: task.appointment_id,
              status: "failed",
              error: message,
            }).catch(() => {});
          }
          await finishAppointmentOutbox(task.id, message);
          result.failed += 1;
        }
      }
    } catch (error) {
      // 連寫回狀態都失敗（多半是資料庫斷線）。下次 locked_at 逾時後會自己被撿回來。
      console.error("[outbox] 處理佇列項目時發生未預期錯誤:", error);
    }
  }
  return result;
}

/** 給呼叫端用的「射後不理」版本：絕不 throw、絕不讓呼叫端等。 */
export function runAppointmentOutboxSafely(limit = 10): void {
  void runAppointmentOutbox(limit).catch((error) => {
    console.error("[outbox] runAppointmentOutbox 未預期錯誤:", error);
  });
}
