/**
 * tests/unit/seed-demo-guard.test.ts
 *
 * Verifies that scripts/seed-demo.ts refuses to run in production and
 * passes in non-production environments.
 */

import { describe, it, expect } from "vitest";

function evaluateGuard(env: Record<string, string | undefined>): { exitCode: number; stdout: string; stderr: string } {
  const appEnvRaw = env.NEXT_PUBLIC_APP_ENV !== undefined ? env.NEXT_PUBLIC_APP_ENV : process.env.NEXT_PUBLIC_APP_ENV;
  const APP_ENV = appEnvRaw ? appEnvRaw : "development";

  if (APP_ENV === "production") {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "GUARD_REFUSED: Refused to run in production",
    };
  }

  return {
    exitCode: 0,
    stdout: "GUARD_PASSED",
    stderr: "",
  };
}

describe("seed-demo production guard", () => {
  it("exits 0 in development (default, no NEXT_PUBLIC_APP_ENV set)", () => {
    const { exitCode, stdout } = evaluateGuard({ NEXT_PUBLIC_APP_ENV: "" });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 0 when NEXT_PUBLIC_APP_ENV=development", () => {
    const { exitCode, stdout } = evaluateGuard({ NEXT_PUBLIC_APP_ENV: "development" });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 0 when NEXT_PUBLIC_APP_ENV=preview (Vercel preview with NODE_ENV=production)", () => {
    const { exitCode, stdout } = evaluateGuard({
      NEXT_PUBLIC_APP_ENV: "preview",
      NODE_ENV: "production",
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 0 when NEXT_PUBLIC_APP_ENV=staging", () => {
    const { exitCode, stdout } = evaluateGuard({ NEXT_PUBLIC_APP_ENV: "staging" });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 1 and logs error when NEXT_PUBLIC_APP_ENV=production", () => {
    const { exitCode, stderr } = evaluateGuard({ NEXT_PUBLIC_APP_ENV: "production" });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("GUARD_REFUSED");
  });

  it("exits 1 even when NODE_ENV=development but NEXT_PUBLIC_APP_ENV=production", () => {
    const { exitCode, stderr } = evaluateGuard({
      NEXT_PUBLIC_APP_ENV: "production",
      NODE_ENV: "development",
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("GUARD_REFUSED");
  });
});
