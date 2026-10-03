import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { timingSafeCompare, signDemoSession, verifyDemoSession } from "@/lib/demo-session";
import { checkDemoLoginRateLimit, resetDemoLoginRateLimit } from "@/lib/demo-rate-limiter";
import { POST } from "@/app/api/admin/demo-login/route";

describe("Hardened Demo Login & Session Security", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetDemoLoginRateLimit();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("timingSafeCompare", () => {
    it("should return true for identical passcodes", () => {
      expect(timingSafeCompare("my-secret-passcode", "my-secret-passcode")).toBe(true);
    });

    it("should return false for different passcodes or different lengths", () => {
      expect(timingSafeCompare("my-secret-passcode", "wrong-passcode")).toBe(false);
      expect(timingSafeCompare("short", "longer-passcode")).toBe(false);
      expect(timingSafeCompare(undefined, "passcode")).toBe(false);
    });
  });

  describe("DEMO_HMAC_SECRET and 2-Hour Max Age", () => {
    it("should sign and verify token using DEMO_HMAC_SECRET", () => {
      process.env.DEMO_HMAC_SECRET = "custom-32-char-hmac-secret-key-12345";
      const passcode = "passcode123";

      const token = signDemoSession(passcode);
      expect(verifyDemoSession(token, passcode)).toBe(true);
    });

    it("should reject token if HMAC signature is tampered", () => {
      process.env.DEMO_HMAC_SECRET = "custom-32-char-hmac-secret-key-12345";
      const passcode = "passcode123";

      const token = signDemoSession(passcode);
      const tamperedToken = token.slice(0, -4) + "0000";
      expect(verifyDemoSession(tamperedToken, passcode)).toBe(false);
    });

    it("should reject token older than 2 hours", () => {
      process.env.DEMO_HMAC_SECRET = "custom-32-char-hmac-secret-key-12345";
      const passcode = "passcode123";

      // Mock Date.now to 3 hours in the past
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      const dateSpy = vi.spyOn(Date, "now").mockReturnValue(threeHoursAgo);

      const oldToken = signDemoSession(passcode);

      dateSpy.mockRestore(); // Restore Date.now to present

      expect(verifyDemoSession(oldToken, passcode)).toBe(false);
    });
  });

  describe("Demo Login Rate Limiting", () => {
    it("should allow up to 5 attempts and block 6th attempt with HTTP 429", () => {
      const ip = "192.168.1.100";

      for (let i = 0; i < 5; i++) {
        const res = checkDemoLoginRateLimit(ip);
        expect(res.allowed).toBe(true);
      }

      const blockedRes = checkDemoLoginRateLimit(ip);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("Demo Login Route Handler & Cookie Security", () => {
    it("should enforce rate limiting on POST /api/admin/demo-login", async () => {
      process.env.DEMO_MODE = "true";
      process.env.DEMO_ADMIN_PASSCODE = "correct-passcode";
      const clientIp = "10.0.0.5";

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost:3000/api/admin/demo-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({ passcode: "wrong" }),
        });
        await POST(req);
      }

      // 6th attempt should return 429
      const blockedReq = new Request("http://localhost:3000/api/admin/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({ passcode: "correct-passcode" }),
      });

      const res = await POST(blockedReq);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain("Too many login attempts");
    });

    it("should set httpOnly, SameSite=Lax, 2-hour maxAge cookie on successful login", async () => {
      process.env.DEMO_MODE = "true";
      process.env.DEMO_ADMIN_PASSCODE = "correct-passcode";
      process.env.DEMO_HMAC_SECRET = "test-hmac-secret-key-32-chars-long";

      const req = new Request("https://freshy.lk/api/admin/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "172.16.0.1",
        },
        body: JSON.stringify({ passcode: "correct-passcode" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain("demo_admin_session=");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=lax");
      expect(setCookieHeader).toContain("Max-Age=7200"); // 2 hours
    });
  });
});
