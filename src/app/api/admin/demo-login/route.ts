import { NextResponse } from "next/server";
import { signDemoSession } from "@/lib/demo-session";

export async function POST(req: Request) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Demo mode is disabled on this server." },
      { status: 403 }
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

    if (typeof passcode !== "string" || passcode !== configuredPasscode) {
      return NextResponse.json(
        { error: "Invalid demo passcode." },
        { status: 401 }
      );
    }

    const token = signDemoSession(configuredPasscode);

    const response = NextResponse.json({ success: true, redirect: "/admin" });

    response.cookies.set("demo_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
