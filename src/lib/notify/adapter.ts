// src/lib/notify/adapter.ts — Abstract Notification Service Adapter with Dry-Run support

import { sendSms } from "./sms";
import { sendEmail } from "./email";

export interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  html?: string;
  orderId?: string;
  templateName?: string;
}

export interface NotificationResult {
  success: boolean;
  providerRef?: string;
  error?: string;
  dryRun?: boolean;
}

export interface INotificationAdapter {
  sendSms(payload: NotificationPayload): Promise<NotificationResult>;
  sendEmail(payload: NotificationPayload): Promise<NotificationResult>;
}

export class NotificationAdapter implements INotificationAdapter {
  private isDryRun: boolean;

  constructor(options?: { dryRun?: boolean }) {
    // Enable dry-run if explicitly set, or in development mode when configured
    this.isDryRun = options?.dryRun ?? (process.env.NODE_ENV === "test" || process.env.NOTIFICATION_DRY_RUN === "true");
  }

  async sendSms(payload: NotificationPayload): Promise<NotificationResult> {
    if (this.isDryRun) {
      console.log(`[DRY-RUN SMS to ${payload.to}]: ${payload.body}`);
      return {
        success: true,
        providerRef: `dryrun-sms-${Date.now()}`,
        dryRun: true,
      };
    }

    return sendSms({ to: payload.to, body: payload.body });
  }

  async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    if (this.isDryRun) {
      console.log(`[DRY-RUN EMAIL to ${payload.to}] Subject: ${payload.subject} | Body: ${payload.body}`);
      return {
        success: true,
        providerRef: `dryrun-email-${Date.now()}`,
        dryRun: true,
      };
    }

    return sendEmail({
      to: payload.to,
      subject: payload.subject || "Freshy.lk Notification",
      html: payload.html || `<p>${payload.body}</p>`,
    });
  }
}

export const defaultNotificationAdapter = new NotificationAdapter();
