// src/lib/notify/index.ts — Unified notification dispatcher with DB logging

import { db } from "@/lib/db";
import { sendSms } from "./sms";
import { sendEmail } from "./email";
import type { NotifyChannel, NotifyStatus } from "@prisma/client";

export interface NotifyParams {
  orderId?: string;
  channel: NotifyChannel;
  toAddress: string;
  template: string;
  body: string;
  subject?: string;
}

/**
 * Dispatches a notification via SMS or Email and logs the attempt to the Notification table.
 * Guaranteed NEVER to throw errors that break caller transactions.
 */
export async function sendNotification(params: NotifyParams): Promise<boolean> {
  try {
    let result: { success: boolean; providerRef?: string; error?: string };

    if (params.channel === "SMS") {
      result = await sendSms({ to: params.toAddress, body: params.body });
    } else {
      result = await sendEmail({
        to: params.toAddress,
        subject: params.subject || "Notification from Freshy.lk",
        html: `<p>${params.body}</p>`,
      });
    }

    const status: NotifyStatus = result.success ? "SENT" : "FAILED";

    try {
      await db.notification.create({
        data: {
          orderId: params.orderId || null,
          channel: params.channel,
          toAddress: params.toAddress,
          template: params.template,
          body: params.body,
          status,
          providerRef: result.providerRef || null,
          error: result.error || null,
        },
      });
    } catch (dbErr) {
      console.error("Failed to write notification log:", dbErr);
    }

    return result.success;
  } catch (err: unknown) {
    console.error("sendNotification caught error:", err);
    return false;
  }
}
