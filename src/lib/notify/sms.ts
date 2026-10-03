// src/lib/notify/sms.ts — SMS provider adapter (NotifyLK & DEMO_MODE fallback)

export interface SendSmsParams {
  to: string; // +94XXXXXXXXX
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<{ success: boolean; providerRef?: string; error?: string }> {
  // If DEMO_MODE=true or no SMS keys configured, simulate send
  if (process.env.DEMO_MODE === "true" || !process.env.NOTIFYLK_API_KEY) {
    console.log(`[DEMO SMS to ${to}]: ${body}`);
    return { success: true, providerRef: `demo-sms-${Date.now()}` };
  }

  try {
    const userId = process.env.NOTIFYLK_USER_ID;
    const apiKey = process.env.NOTIFYLK_API_KEY;
    const senderId = process.env.NOTIFYLK_SENDER_ID || "Freshy.lk";

    const url = new URL("https://app.notifylk.com/api/v1/send");
    url.searchParams.append("user_id", userId || "");
    url.searchParams.append("api_key", apiKey || "");
    url.searchParams.append("sender_id", senderId);
    url.searchParams.append("to", to.replace("+", ""));
    url.searchParams.append("message", body);

    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();

    if (res.ok && data.status === "success") {
      return { success: true, providerRef: data.data?.message_id || "notifylk-ok" };
    }

    return { success: false, error: data.message || "NotifyLK error" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "SMS send failed" };
  }
}
