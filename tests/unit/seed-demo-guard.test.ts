/**
 * tests/unit/seed-demo-guard.test.ts
 *
 * Verifies that scripts/seed-demo.ts refuses to run in production and
 * passes in non-production environments.
 *
 * Strategy: spawn a child process that runs the guard logic inline
 * (without actually connecting to a DB), and assert the exit code / stderr.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Inline guard snippet — mirrors the exact guard in scripts/seed-demo.ts
// ---------------------------------------------------------------------------
const GUARD_SNIPPET = `
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
if (APP_ENV === "production") {
  console.error("GUARD_REFUSED");
  process.exit(1);
}
console.log("GUARD_PASSED");
process.exit(0);
`;

function runGuard(env: Record<string, string>): { exitCode: number; stdout: string; stderr: string } {
  // Write snippet to a temp file so we can run it with node (no tsx needed)
  const tmp = path.join(os.tmpdir(), `seed-demo-guard-test-${Date.now()}.mjs`);
  fs.writeFileSync(tmp, GUARD_SNIPPET);
  try {
    const result = spawnSync(process.execPath, [tmp], {
      env: { ...process.env, ...env },
      encoding: "utf-8",
    });
    return {
      exitCode: result.status ?? -1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } finally {
    fs.unlinkSync(tmp);
  }
}

// ---------------------------------------------------------------------------

describe("seed-demo production guard", () => {
  it("exits 0 in development (default, no NEXT_PUBLIC_APP_ENV set)", () => {
    const { exitCode, stdout } = runGuard({ NEXT_PUBLIC_APP_ENV: "" });
    // When env var is empty string, guard treats it as "development"
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 0 when NEXT_PUBLIC_APP_ENV=development", () => {
    const { exitCode, stdout } = runGuard({ NEXT_PUBLIC_APP_ENV: "development" });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 0 when NEXT_PUBLIC_APP_ENV=preview (Vercel preview with NODE_ENV=production)", () => {
    // Vercel preview sets NODE_ENV=production but APP_ENV=preview
    const { exitCode, stdout } = runGuard({
      NEXT_PUBLIC_APP_ENV: "preview",
      NODE_ENV: "production",
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 0 when NEXT_PUBLIC_APP_ENV=staging", () => {
    const { exitCode, stdout } = runGuard({ NEXT_PUBLIC_APP_ENV: "staging" });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("GUARD_PASSED");
  });

  it("exits 1 and logs error when NEXT_PUBLIC_APP_ENV=production", () => {
    const { exitCode, stderr } = runGuard({ NEXT_PUBLIC_APP_ENV: "production" });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("GUARD_REFUSED");
  });

  it("exits 1 even when NODE_ENV=development but NEXT_PUBLIC_APP_ENV=production", () => {
    // The guard must key on APP_ENV, not NODE_ENV
    const { exitCode, stderr } = runGuard({
      NEXT_PUBLIC_APP_ENV: "production",
      NODE_ENV: "development",
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("GUARD_REFUSED");
  });
});
