import { describe, it, expect } from "vitest";
import { validateFileMagicBytes, uploadBankSlipToStorage } from "../../src/lib/storage";

describe("Bank Slip Upload Server-Side Security", () => {
  it("accepts valid JPEG magic bytes (FF D8 FF)", () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res = validateFileMagicBytes(validJpeg);
    expect(res.isValid).toBe(true);
    expect(res.detectedMime).toBe("image/jpeg");
  });

  it("accepts valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)", () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = validateFileMagicBytes(validPng);
    expect(res.isValid).toBe(true);
    expect(res.detectedMime).toBe("image/png");
  });

  it("accepts valid PDF magic bytes (%PDF / 25 50 44 46)", () => {
    const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const res = validateFileMagicBytes(validPdf);
    expect(res.isValid).toBe(true);
    expect(res.detectedMime).toBe("application/pdf");
  });

  it("rejects malicious or spoofed files (e.g. PHP script disguised as JPG)", () => {
    const spoofedFile = Buffer.from("<?php echo 'malicious payload'; ?>");
    const res = validateFileMagicBytes(spoofedFile);
    expect(res.isValid).toBe(false);
    expect(res.detectedMime).toBeNull();
  });

  it("generates an unguessable random UUID object name and correct extension", async () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const { storagePath } = await uploadBankSlipToStorage("ord-12345", "user-original-name.jpg", validJpeg, "image/jpeg");

    // Must be in slips/ord-12345/[uuid].jpg format
    expect(storagePath).toMatch(/^slips\/ord-12345\/[a-f0-9-]{36}\.jpg$/);
    expect(storagePath).not.toContain("user-original-name");
  });
});
