/**
 * tests/unit/proxy-guard.test.ts
 *
 * Tests for the admin auth guard in src/proxy.ts.
 *
 * The guard must:
 * - Redirect unauthenticated users to /admin/login when
 *   NEXT_PUBLIC_APP_ENV=production AND DEMO_MODE != "true"
 * - Allow access when DEMO_MODE=true regardless of NODE_ENV
 *   (Vercel previews have NODE_ENV=production + APP_ENV=preview)
 * - Allow access when NEXT_PUBLIC_APP_ENV != "production"
 */

import { describe, it, expect } from "vitest";

// --------------------------------------------------------------------------
// The guard logic extracted from proxy.ts for unit testing without the
// full Next.js module graph (which requires an edge runtime environment).
// --------------------------------------------------------------------------
function adminGuard({
  pathname,
  hasUser,
  appEnv,
  demoMode,
}: {
  pathname: string;
  hasUser: boolean;
  appEnv: string;
  demoMode: string;
}): "allow" | "redirect-to-login" {
  // Mirrors the exact condition in src/proxy.ts
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const isProductionEnv = appEnv === "production";
    const isDemoMode = demoMode === "true";
    if (!hasUser && !isDemoMode && isProductionEnv) {
      return "redirect-to-login";
    }
  }
  return "allow";
}

describe("proxy.ts — admin auth guard", () => {
  // -----------------------------------------------------------------------
  // Production mode: unauthenticated, no DEMO_MODE → must redirect
  // -----------------------------------------------------------------------
  it("redirects unauthenticated user in production (DEMO_MODE=false)", () => {
    expect(
      adminGuard({ pathname: "/admin/orders", hasUser: false, appEnv: "production", demoMode: "false" })
    ).toBe("redirect-to-login");
  });

  it("redirects unauthenticated user in production (DEMO_MODE not set)", () => {
    expect(
      adminGuard({ pathname: "/admin/dashboard", hasUser: false, appEnv: "production", demoMode: "" })
    ).toBe("redirect-to-login");
  });

  // -----------------------------------------------------------------------
  // Production mode: authenticated → allow
  // -----------------------------------------------------------------------
  it("allows authenticated user in production", () => {
    expect(
      adminGuard({ pathname: "/admin/orders", hasUser: true, appEnv: "production", demoMode: "false" })
    ).toBe("allow");
  });

  // -----------------------------------------------------------------------
  // Production mode: DEMO_MODE=true → allow (should never happen, but guard
  // should not double-block if validateEnv already prevented this at startup)
  // -----------------------------------------------------------------------
  it("allows access when DEMO_MODE=true even in production (validateEnv handles the real block)", () => {
    expect(
      adminGuard({ pathname: "/admin/dashboard", hasUser: false, appEnv: "production", demoMode: "true" })
    ).toBe("allow");
  });

  // -----------------------------------------------------------------------
  // Preview: NODE_ENV=production but APP_ENV=preview → must allow
  // This is the Vercel preview scenario.
  // -----------------------------------------------------------------------
  it("allows unauthenticated access in preview (APP_ENV=preview, DEMO_MODE=true)", () => {
    expect(
      adminGuard({ pathname: "/admin/dashboard", hasUser: false, appEnv: "preview", demoMode: "true" })
    ).toBe("allow");
  });

  it("allows unauthenticated access in preview (APP_ENV=preview, no DEMO_MODE)", () => {
    expect(
      adminGuard({ pathname: "/admin/dashboard", hasUser: false, appEnv: "preview", demoMode: "false" })
    ).toBe("allow");
  });

  // -----------------------------------------------------------------------
  // Development: always allow
  // -----------------------------------------------------------------------
  it("allows access in development regardless of auth", () => {
    expect(
      adminGuard({ pathname: "/admin/orders", hasUser: false, appEnv: "development", demoMode: "false" })
    ).toBe("allow");
  });

  // -----------------------------------------------------------------------
  // /admin/login is always exempt
  // -----------------------------------------------------------------------
  it("never redirects /admin/login itself", () => {
    expect(
      adminGuard({ pathname: "/admin/login", hasUser: false, appEnv: "production", demoMode: "false" })
    ).toBe("allow");
  });

  // -----------------------------------------------------------------------
  // Non-admin routes are always allowed
  // -----------------------------------------------------------------------
  it("allows all non-admin routes", () => {
    for (const path of ["/", "/products", "/checkout", "/api/health"]) {
      expect(
        adminGuard({ pathname: path, hasUser: false, appEnv: "production", demoMode: "false" })
      ).toBe("allow");
    }
  });
});
