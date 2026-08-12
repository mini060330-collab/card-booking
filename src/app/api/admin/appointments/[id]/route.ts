/**
 * 後台單筆預約的操作 API。
 *
 * 為什麼有這支：後台案件卡上的每一顆按鈕（取消預約、標記已聯絡、標記完成、改期、
 * 儲存案件進度、建立跟進任務、重排客戶確認通知）都是 POST 到這個網址，
 * 但這支路由一直沒被建出來 —— 結果線上每按一顆都只跳「操作失敗，請稍後重試」。
 *
 * 回應格式要跟 AppointmentActions.tsx 對得上：
 *   { ok: true, notice }        完全成功
 *   { saved: true, notice }     資料已改，但背景工作（日曆／通知）沒排進去 → 前端顯示黃色提醒
 *   { error }                   失敗
 */
import { NextRequest, NextResponse, after } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin-check";
import {
  createAppointmentFollowup,
  enqueueAppointmentOutbox,
  getAppointment,
  setAppointmentSlot,
  setAppointmentStatus,
  updateAppointmentOperations,
  appointmentMeetingPolicy,
} from "@/lib/appointment";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { runAppointmentOutbox } from "@/lib/appointment-outbox-worker";

export const dynamic = "force-dynamic";

const ATTENDANCE = ["unknown", "confirmed", "arrived", "no_show"];
const OUTCOME = ["none", "high_intent", "nurture", "not_fit", "closed_won", "closed_lost"];
const CONTACT = ["not_contacted", "contacted", "waiting_customer", "follow_up", "closed"];

function str(value: unknown, max = 4000): string | null {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  return v ? v.slice(0, max) : null;
}

function money(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function drainAfterResponse(): void {
  after(async () => {
    try {
      await runAppointmentOutbox(10);
    } catch (error) {
      console.error("[admin/appointments] 跑待辦佇列失敗:", error);
    }
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "尚未登入或沒有權限。" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  const appt = await getAppointment(id);
  if (!appt) return NextResponse.json({ error: "找不到這筆預約。" }, { status: 404 });

  try {
    switch (action) {
      case "confirm": {
        await setAppointmentStatus(id, "confirmed");
        const enqueued = await enqueueStatusTasks(id, "confirmed");
        drainAfterResponse();
        return NextResponse.json(
          enqueued
            ? { ok: true, status: "confirmed", notice: "已確認，日曆與通知已排入處理。" }
            : { saved: true, status: "confirmed", notice: "已確認，但背景同步沒有排入，請查看異常佇列。" },
        );
      }

      case "complete": {
        await setAppointmentStatus(id, "completed");
        return NextResponse.json({ ok: true, status: "completed", notice: "已標記為完成。" });
      }

      case "cancel": {
        await setAppointmentStatus(id, "cancelled");
        const notifyCustomer = body.notifyCustomer !== false;
        let enqueued = true;
        try {
          await Promise.all([
            ...(isGoogleConfigured() || appt.google_event_id
              ? [
                  enqueueAppointmentOutbox({
                    appointmentId: id,
                    taskType: "calendar_cancel" as const,
                    dedupeKey: `appointment:${id}:calendar-cancel`,
                  }),
                ]
              : []),
            ...(notifyCustomer
              ? [
                  enqueueAppointmentOutbox({
                    appointmentId: id,
                    taskType: "notify_cancel" as const,
                    dedupeKey: `appointment:${id}:cancel-notify`,
                    payload: { notifyCustomer: true, notifyAdmin: true },
                  }),
                ]
              : []),
          ]);
        } catch (error) {
          console.error("[admin/appointments] cancel enqueue 失敗:", error);
          enqueued = false;
        }
        drainAfterResponse();
        return NextResponse.json(
          enqueued
            ? { ok: true, status: "cancelled", notice: "已取消，時段已釋出。" }
            : { saved: true, status: "cancelled", notice: "已取消，但日曆與通知沒有排入處理。" },
        );
      }

      case "mark_contacted": {
        await updateAppointmentOperations({ id, contactStatus: "contacted" });
        return NextResponse.json({ ok: true, notice: "已標記為已聯絡。" });
      }

      case "set_attendance": {
        const value = String(body.attendanceStatus || "");
        if (!ATTENDANCE.includes(value)) {
          return NextResponse.json({ error: "出席狀態不正確。" }, { status: 400 });
        }
        await updateAppointmentOperations({ id, attendanceStatus: value });
        return NextResponse.json({ ok: true, notice: "出席狀態已更新。" });
      }

      case "save_operations": {
        const attendanceStatus = String(body.attendanceStatus || "");
        const outcomeStatus = String(body.outcomeStatus || "");
        const contactStatus = String(body.contactStatus || "");
        if (attendanceStatus && !ATTENDANCE.includes(attendanceStatus)) {
          return NextResponse.json({ error: "出席狀態不正確。" }, { status: 400 });
        }
        if (outcomeStatus && !OUTCOME.includes(outcomeStatus)) {
          return NextResponse.json({ error: "案件結果不正確。" }, { status: 400 });
        }
        if (contactStatus && !CONTACT.includes(contactStatus)) {
          return NextResponse.json({ error: "聯絡狀態不正確。" }, { status: 400 });
        }
        const nextFollowupAt = body.nextFollowupAt ? new Date(String(body.nextFollowupAt)) : null;
        if (nextFollowupAt && Number.isNaN(nextFollowupAt.getTime())) {
          return NextResponse.json({ error: "跟進日期格式不正確。" }, { status: 400 });
        }
        await updateAppointmentOperations({
          id,
          attendanceStatus: attendanceStatus || null,
          outcomeStatus: outcomeStatus || null,
          outcomeNote: str(body.outcomeNote) ?? "",
          contactStatus: contactStatus || null,
          nextFollowupAt,
          estimatedCommission: money(body.estimatedCommission),
          actualCommission: money(body.actualCommission),
          caseReference: str(body.caseReference, 160) ?? "",
        });
        return NextResponse.json({ ok: true, notice: "案件進度已儲存。" });
      }

      case "create_followup": {
        const followup = await createAppointmentFollowup(appt);
        return NextResponse.json({ ok: true, followupId: followup?.id, notice: "跟進任務已建立。" });
      }

      case "resend_customer_confirmation": {
        await enqueueAppointmentOutbox({
          appointmentId: id,
          taskType: "notify_new",
          // 帶時間戳＝每次都是新的一筆，不會被上一次的 dedupe 擋掉
          dedupeKey: `appointment:${id}:resend:${Date.now()}`,
          payload: { phase: appt.status === "pending_confirmation" ? "confirmation_request" : "confirmed" },
        });
        drainAfterResponse();
        return NextResponse.json({ ok: true, notice: "客戶確認通知已排入發送。" });
      }

      case "reschedule": {
        const slotIso = String(body.slotIso || "");
        const slotAt = new Date(slotIso);
        if (!slotIso || Number.isNaN(slotAt.getTime())) {
          return NextResponse.json({ error: "改期時間格式不正確。" }, { status: 400 });
        }
        const oldStart = new Date(appt.slot_at);
        const oldEnd = appt.slot_end_at
          ? new Date(appt.slot_end_at)
          : new Date(oldStart.getTime() + 60 * 60_000);
        const requested = Number(body.durationMin);
        const durationMin =
          Number.isFinite(requested) && requested > 0
            ? requested
            : Math.max(15, Math.round((oldEnd.getTime() - oldStart.getTime()) / 60_000));
        const allowed = appointmentMeetingPolicy(appt.meet_type).publicDurations;
        if (Number.isFinite(requested) && requested > 0 && !allowed.includes(requested)) {
          return NextResponse.json(
            { error: `「${appt.meet_type}」只能選 ${allowed.join(" / ")} 分鐘。` },
            { status: 400 },
          );
        }
        const slotEndAt = new Date(slotAt.getTime() + durationMin * 60_000);
        await setAppointmentSlot(id, slotAt, slotEndAt);

        let enqueued = true;
        try {
          await Promise.all([
            ...(isGoogleConfigured() || appt.google_event_id
              ? [
                  enqueueAppointmentOutbox({
                    appointmentId: id,
                    taskType: appt.google_event_id
                      ? ("calendar_reschedule" as const)
                      : ("calendar_create" as const),
                    dedupeKey: `appointment:${id}:calendar:${slotAt.toISOString()}`,
                    payload: {
                      previousSlotAt: oldStart.toISOString(),
                      previousSlotEndAt: oldEnd.toISOString(),
                    },
                  }),
                ]
              : []),
            ...(body.notifyCustomer !== false
              ? [
                  enqueueAppointmentOutbox({
                    appointmentId: id,
                    taskType: "notify_reschedule" as const,
                    dedupeKey: `appointment:${id}:reschedule-notify:${slotAt.toISOString()}`,
                    payload: {
                      notifyCustomer: true,
                      notifyAdmin: true,
                      previousSlotAt: oldStart.toISOString(),
                      previousSlotEndAt: oldEnd.toISOString(),
                    },
                  }),
                ]
              : []),
          ]);
        } catch (error) {
          console.error("[admin/appointments] reschedule enqueue 失敗:", error);
          enqueued = false;
        }
        drainAfterResponse();
        return NextResponse.json(
          enqueued
            ? { ok: true, notice: "已改期，日曆與通知已排入處理。" }
            : { saved: true, notice: "已改期，但日曆與通知沒有排入處理。" },
        );
      }

      default:
        return NextResponse.json({ error: "不認得這個操作。" }, { status: 400 });
    }
  } catch (error) {
    console.error(`[admin/appointments] ${action} 失敗:`, error);
    return NextResponse.json({ error: "操作失敗，請稍後重試。" }, { status: 500 });
  }
}

/** 手動確認一筆預約時，補排日曆與通知。回傳有沒有成功排進去。 */
async function enqueueStatusTasks(id: string, status: string): Promise<boolean> {
  if (status !== "confirmed") return true;
  try {
    await Promise.all([
      ...(isGoogleConfigured()
        ? [
            enqueueAppointmentOutbox({
              appointmentId: id,
              taskType: "calendar_create" as const,
              dedupeKey: `appointment:${id}:calendar-create`,
            }),
          ]
        : []),
      enqueueAppointmentOutbox({
        appointmentId: id,
        taskType: "notify_new" as const,
        dedupeKey: `appointment:${id}:confirmed-notify`,
        payload: { phase: "confirmed" },
      }),
    ]);
    return true;
  } catch (error) {
    console.error("[admin/appointments] confirm enqueue 失敗:", error);
    return false;
  }
}
