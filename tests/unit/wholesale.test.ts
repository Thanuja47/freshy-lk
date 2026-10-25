// tests/unit/wholesale.test.ts — Unit tests for Wholesale Enquiry Zod validation

import { describe, it, expect } from "vitest";
import { wholesaleEnquirySchema } from "../../src/lib/validators/wholesale";

describe("Wholesale Enquiry Validation", () => {
  it("validates correct wholesale enquiry inputs", () => {
    const validData = {
      companyName: "Cinnamon Grand Hotel",
      contactName: "Chef Silva",
      phone: "+94771234567",
      email: "chef@cinnamon.lk",
      businessType: "HOTEL",
      district: "Colombo",
      estimatedKgPerWeek: 150,
      message: "Need 100kg Yellowfin Tuna and 50kg Tiger Prawns weekly.",
    };

    const result = wholesaleEnquirySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone, empty company name, and non-positive volume", () => {
    const invalidData = {
      companyName: "A", // too short
      contactName: "Chef",
      phone: "123", // invalid
      email: "invalid-email",
      businessType: "RESTAURANT",
      district: "Colombo",
      estimatedKgPerWeek: -10, // invalid volume
      message: "Short", // too short
    };

    const result = wholesaleEnquirySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issuePaths = result.error.issues.map((i) => i.path[0]);
      expect(issuePaths).toContain("companyName");
      expect(issuePaths).toContain("phone");
      expect(issuePaths).toContain("email");
      expect(issuePaths).toContain("estimatedKgPerWeek");
      expect(issuePaths).toContain("message");
    }
  });
});
