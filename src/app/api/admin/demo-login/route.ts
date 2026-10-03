import { NextResponse } from "next/server";
import { signDemoSession, timingSafeCompare } from "@/lib/demo-session";
import { checkDemoLoginRateLimit } from "@/lib/demo-rate-limiter";

export async function POST(req: Request) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Demo mode is disabled on this server." },
      { status: 403 }
    );
  }

  // Rate Limiting by IP or forwarded header
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitResult = checkDemoLoginRateLimit(clientIp);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Please try again after ${rateLimitResult.retryAfterSeconds} seconds.` },
      {
        status: 429,
        headers: { "Retry-After": rateLimitResult.retryAfterSeconds.toString() },
      }
    );
  }

  const configuredPasscode = process.env.DEMO_ADMIN_PASSCODE;
  if (!configuredPasscode) {
    return NextResponse.json(
      { error: "DEMO_ADMIN_PASSCODE environment variable is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;

    // Timing-safe passcode comparison
    if (typeof passcode !== "string" || !timingSafeCompare(passcode, configuredPasscode)) {
      return NextResponse.json(
        { error: "Invalid demo passcode." },
        { status: 401 }
      );
    }

    const token = signDemoSession(configuredPasscode);

    const response = NextResponse.json({ success: true, redirect: "/admin" });

    // Cookie security flags: httpOnly, Secure in non-localhost, SameSite=Lax, short 2-hour expiry
    const isLocalhost = req.url.includes("localhost") || req.url.includes("127.0.0.1");
    
    response.cookies.set("demo_admin_session", token, {
      httpOnly: true,
      secure: !isLocalhost || process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60, // Short expiry: 2 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
