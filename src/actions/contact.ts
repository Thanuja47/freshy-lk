// src/actions/contact.ts — Server action for Contact form submissions
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { defaultNotificationAdapter } from "@/lib/notify/adapter";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getSiteSettings } from "@/lib/settings";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(9, "Please enter a valid phone number (at least 9 digits)").max(20, "Phone number is too long"),
  email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message must be at least 5 characters"),
  turnstileToken: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactInquiry(data: ContactFormData) {
  try {
    const parsed = contactSchema.parse(data);

    // Turnstile bot verification
    const turnstileCheck = await verifyTurnstileToken(parsed.turnstileToken);
    if (!turnstileCheck.success) {
      return { success: false, message: turnstileCheck.error || "Security check failed." };
    }

    // Save inquiry to PostgreSQL database
    const inquiry = await db.contactInquiry.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email && parsed.email.length > 0 ? parsed.email : null,
        message: parsed.message,
      },
    });

    // Determine admin recipient email from site settings or env
    let adminEmail = process.env.ADMIN_ALERT_EMAIL || "support@freshy.lk";
    try {
      const siteSettings = await getSiteSettings();
      if (siteSettings.supportEmail) {
        adminEmail = siteSettings.supportEmail;
      }
    } catch {
      // Fallback to default adminEmail
    }

    const cleanPhone = parsed.phone.replace(/[^0-9]/g, "");
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hello ${parsed.name}, thank you for contacting Freshy.lk! We received your inquiry: "${parsed.message.slice(0, 80)}..."`
    )}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #ffffff; color: #1D1D1F;">
        <div style="padding-bottom: 16px; border-bottom: 1px solid #F3F4F6;">
          <h2 style="color: #0D2137; margin: 0 0 6px 0; font-size: 20px; font-weight: 700;">🐟 New Customer Inquiry Received</h2>
          <p style="color: #6E6E73; margin: 0; font-size: 13px;">Received via Freshy.lk Contact Form</p>
        </div>

        <div style="margin: 20px 0; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748B; width: 100px; font-weight: 600;">Customer:</td>
              <td style="padding: 6px 0; color: #0F172A; font-weight: 600;">${parsed.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Phone:</td>
              <td style="padding: 6px 0;">
                <a href="tel:${parsed.phone}" style="color: #0284C7; text-decoration: none; font-weight: 600;">${parsed.phone}</a>
                &nbsp;&nbsp;
                <a href="${waLink}" style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; color: #166534; background: #DCFCE7; border-radius: 999px; text-decoration: none;">WhatsApp Customer</a>
              </td>
            </tr>
            ${
              parsed.email
                ? `<tr>
                    <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Email:</td>
                    <td style="padding: 6px 0;"><a href="mailto:${parsed.email}" style="color: #0284C7; text-decoration: none;">${parsed.email}</a></td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <div style="margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748B; letter-spacing: 0.05em; margin-bottom: 8px;">Customer Message:</div>
          <div style="background: #F1F5F9; border-left: 4px solid #0284C7; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${parsed.message}</div>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #F3F4F6; text-align: center;">
          <a href="${waLink}" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 9999px; text-decoration: none; margin-right: 8px;">
            Reply on WhatsApp
          </a>
          <a href="tel:${parsed.phone}" style="display: inline-block; background-color: #0284C7; color: #ffffff; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 9999px; text-decoration: none;">
            Call Customer
          </a>
        </div>
      </div>
    `;

    // Dispatch notification via adapter (dry-run mode in dev/test)
    try {
      await defaultNotificationAdapter.sendEmail({
        to: adminEmail,
        subject: `[Freshy.lk Inquiry] New message from ${parsed.name}`,
        body: `Name: ${parsed.name}\nPhone: ${parsed.phone}\nEmail: ${parsed.email || "N/A"}\n\nMessage:\n${parsed.message}`,
        html: htmlBody,
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed (non-fatal):", notifErr);
    }

    return {
      success: true,
      inquiryId: inquiry.id,
      message: "Thank you! Your message has been received. Our team will contact you shortly.",
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        message: err.issues.map((e) => e.message).join(". "),
      };
    }
    console.error("submitContactInquiry error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.",
    };
  }
}
