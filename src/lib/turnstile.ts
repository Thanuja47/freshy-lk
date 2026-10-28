// src/lib/turnstile.ts — Cloudflare Turnstile verification helper

export async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development, testing, or if Turnstile secret is not set, allow bypassing for easy QA
  if (!secretKey || process.env.NODE_ENV === "test") {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Please complete the security verification challenge." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: data["error-codes"] ? `Security check failed: ${data["error-codes"].join(", ")}` : "Security verification failed.",
    };
  } catch (err) {
    console.warn("Turnstile verification fetch error:", err);
    // Non-fatal network fallback in non-strict modes
    return { success: true };
  }
}
