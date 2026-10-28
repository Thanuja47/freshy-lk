// src/actions/contact.ts — Server action for Contact form submissions
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { defaultNotificationAdapter } from "@/lib/notify/adapter";
import { verifyTurnstileToken } from "@/lib/turnstile";

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

    // Dispatch notification via adapter (dry-run mode in dev/test)
    try {
      await defaultNotificationAdapter.sendEmail({
        to: process.env.ADMIN_ALERT_EMAIL || "support@freshy.lk",
        subject: `[Contact Form] New inquiry from ${parsed.name}`,
        body: `Name: ${parsed.name}\nPhone: ${parsed.phone}\nEmail: ${parsed.email || "N/A"}\n\nMessage:\n${parsed.message}`,
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
