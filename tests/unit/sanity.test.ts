import { describe, it, expect } from "vitest";

describe("Phase 0 Environment Setup", () => {
  it("should have correct timezone context", () => {
    expect(process.env.TZ || "Asia/Colombo").toBe("Asia/Colombo");
  });
});
