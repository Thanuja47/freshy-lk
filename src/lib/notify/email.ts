// src/lib/notify/email.ts — Email notify adapter (Resend & DEMO_MODE fallback)

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; providerRef?: string; error?: string }> {
  if (process.env.DEMO_MODE === "true" || !process.env.RESEND_API_KEY) {
    console.log(`[DEMO EMAIL to ${to}] Subject: ${subject}`);
    return { success: true, providerRef: `demo-email-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Freshy.lk <orders@freshy.lk>",
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return { success: true, providerRef: data.id };
    }

    return { success: false, error: data.message || "Resend error" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Email send failed" };
  }
}
