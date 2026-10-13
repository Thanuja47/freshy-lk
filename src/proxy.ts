// src/proxy.ts — Supabase session refresh & /admin route protection
// Renamed from middleware.ts (Next.js 16 "proxy" file convention).
//
// BEFORE (src/middleware.ts):
//   export async function middleware(request: NextRequest) { ... }
//   export const config = { matcher: [...] };
//
// AFTER (src/proxy.ts):
//   export async function proxy(request: NextRequest) { ... }
//   export const config = { matcher: [...] };
//
// The auth guard keys on NEXT_PUBLIC_APP_ENV (not NODE_ENV) so that
// Vercel preview deployments (NODE_ENV=production, APP_ENV=preview)
// still allow demo access.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Guard /admin routes (except /admin/login).
  // Condition: NEXT_PUBLIC_APP_ENV=production AND DEMO_MODE != "true" AND no valid Supabase user.
  // We intentionally do NOT key on NODE_ENV — Vercel previews run with
  // NODE_ENV=production but NEXT_PUBLIC_APP_ENV=preview, and they must
  // remain accessible for demo/review purposes.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const isProductionEnv =
      process.env.NEXT_PUBLIC_APP_ENV === "production";
    const isDemoMode = process.env.DEMO_MODE === "true";

    if (!user && !isDemoMode && isProductionEnv) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
