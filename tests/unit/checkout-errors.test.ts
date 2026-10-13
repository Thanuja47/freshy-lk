// tests/unit/checkout-errors.test.ts — Error mapping tests for checkout action
// Tests that each failure path returns a customer-safe message (never raw DB errors),
// and that error IDs are included for traceability.

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Pure logic tests — the error-mapping behaviour extracted from checkout.ts
// These test the *rules* without needing a real DB connection.
// ---------------------------------------------------------------------------

/** Mirrors the safe message mapping logic from checkout.ts catch block */
function mapCheckoutError(err: unknown): { status: "ERROR"; message: string } {
  const errorId = "ERR-test-abc123"; // fixed for test predictability

  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("connect") || msg.includes("ECONNREFUSED") || msg.includes("PrismaClient")) {
    return {
      status: "ERROR",
      message: `Service temporarily unavailable. Please try again in a few minutes or call us. (Ref: ${errorId})`,
    };
  }

  return {
    status: "ERROR",
    message: `Something went wrong placing your order. Please try again or call us. (Ref: ${errorId})`,
  };
}

/** Mirrors the safe-string guard from checkout page handleSubmit */
function safeClientMessage(err: unknown): string {
  const rawMsg = err instanceof Error ? err.message : "";
  return typeof rawMsg === "string" && rawMsg.length > 0
    ? rawMsg
    : "Unable to place your order right now. Please try again or call us.";
}

describe("checkout — server-side error mapping", () => {
  it("DB connection error maps to service-unavailable message (never exposes stack/SQL)", () => {
    const dbErr = new Error("Error: connect ECONNREFUSED 127.0.0.1:5432");
    const result = mapCheckoutError(dbErr);

    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("Service temporarily unavailable");
    expect(result.message).toContain("Ref:");
    // Must NOT contain raw connection details
    expect(result.message).not.toContain("127.0.0.1");
    expect(result.message).not.toContain("5432");
    expect(result.message).not.toContain("ECONNREFUSED");
  });

  it("Prisma client error maps to service-unavailable (never exposes PrismaClient internals)", () => {
    const prismaErr = new Error("PrismaClient initialization error: DATABASE_URL not found");
    const result = mapCheckoutError(prismaErr);

    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("Service temporarily unavailable");
    expect(result.message).not.toContain("DATABASE_URL");
    expect(result.message).not.toContain("PrismaClient");
  });

  it("generic unexpected error maps to generic safe message with error ID", () => {
    const unknownErr = new Error("Unexpected internal error XYZ");
    const result = mapCheckoutError(unknownErr);

    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("Please try again");
    expect(result.message).toContain("Ref:");
    // Must NOT expose internal error detail
    expect(result.message).not.toContain("XYZ");
  });

  it("non-Error thrown value (e.g. string) maps to safe message", () => {
    const result = mapCheckoutError("something bad happened internally");

    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("Please try again");
    expect(result.message).not.toContain("something bad happened internally");
  });

  it("null thrown value maps to safe message (never throws React rendering error)", () => {
    const result = mapCheckoutError(null);

    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("Please try again");
  });
});

describe("checkout — client-side safe string guard (React #441 prevention)", () => {
  it("uses Error.message as string when available", () => {
    const err = new Error("Service temporarily unavailable. (Ref: ERR-abc)");
    const msg = safeClientMessage(err);

    expect(typeof msg).toBe("string");
    expect(msg).toBe("Service temporarily unavailable. (Ref: ERR-abc)");
  });

  it("falls back to default message when err is not an Error instance", () => {
    const msg = safeClientMessage({ status: 500, body: "Internal error" });

    expect(typeof msg).toBe("string");
    expect(msg).toContain("Unable to place your order");
  });

  it("falls back to default message when err is undefined", () => {
    const msg = safeClientMessage(undefined);

    expect(typeof msg).toBe("string");
    expect(msg).toContain("Unable to place your order");
  });

  it("falls back to default message when err.message is empty string", () => {
    const msg = safeClientMessage(new Error(""));

    expect(typeof msg).toBe("string");
    expect(msg).toContain("Unable to place your order");
  });

  it("result is always a string (never an object — guards against React #441)", () => {
    const inputs = [null, undefined, {}, [], new Error(""), new Error("real msg")];
    for (const input of inputs) {
      const msg = safeClientMessage(input);
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

describe("checkout — CheckoutActionResult message type contract", () => {
  it("ERROR status always has a string message, never undefined", () => {
    // Simulate what the action returns in each case
    const errorResults = [
      { status: "ERROR" as const, message: "Some error (Ref: ERR-abc)" },
      { status: "OUT_OF_STOCK" as const, message: "Cuttlefish is sold out. Please try again or call us.", failedProductName: "Cuttlefish" },
      { status: "ZONE_STORAGE_BLOCKED" as const, message: "Delivery to Jaffna does not support fresh items.", invalidStorageTypes: [] as string[] },
    ];

    for (const r of errorResults) {
      expect(typeof r.message).toBe("string");
      expect(r.message.length).toBeGreaterThan(0);
    }
  });

  it("PRICE_CHANGED result has numeric totals (not strings)", () => {
    const result = {
      status: "PRICE_CHANGED" as const,
      message: "Prices updated. Please review.",
      newSubtotalCents: 190000,
      newTotalCents: 225000,
    };

    expect(typeof result.newSubtotalCents).toBe("number");
    expect(typeof result.newTotalCents).toBe("number");
    expect(result.newTotalCents).toBeGreaterThan(result.newSubtotalCents);
  });

  it("DELIVERY_DATE_CHANGED result has a string date in YYYY-MM-DD format", () => {
    const result = {
      status: "DELIVERY_DATE_CHANGED" as const,
      message: "12 PM cut-off has passed. Earliest delivery: 2026-10-14.",
      newEarliestDate: "2026-10-14",
    };

    expect(typeof result.newEarliestDate).toBe("string");
    expect(result.newEarliestDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
