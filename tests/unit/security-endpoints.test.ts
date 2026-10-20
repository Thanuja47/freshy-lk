// tests/unit/security-endpoints.test.ts — Authorization checks for invoice, slip, and order endpoints
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/db", () => {
  return {
    db: {
      invoice: {
        findUnique: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
      },
      bankSlip: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/auth", () => {
  return {
    requireAdmin: vi.fn(),
  };
});

vi.mock("@/lib/storage", () => {
  return {
    getStorageAdminClient: vi.fn().mockReturnValue(null),
  };
});

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

describe("Endpoint Security & IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/invoices/[invoiceNo]/pdf", () => {
    const mockInvoice = {
      id: "inv-1",
      invoiceNo: "FR-2026-000001",
      snapshot: {
        orderNo: "FRS-261016-0001",
        invoiceNo: "FR-2026-000001",
        issuedAt: new Date().toISOString(),
        customerName: "Kamal Perera",
        phone: "+94771234567",
        addressLine1: "123 Galle Rd",
        city: "Colombo",
        district: "Colombo",
        zoneName: "Metro",
        paymentMethod: "BANK_TRANSFER",
        subtotalCents: 100000,
        prepTotalCents: 0,
        deliveryFeeCents: 35000,
        totalCents: 135000,
        items: [],
      },
      order: {
        trackingToken: "valid-secret-token-123",
      },
    };

    it("returns 401 Unauthorized when no token provided and no admin session exists", async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice as never);
      vi.mocked(requireAdmin).mockRejectedValue(new Error("Unauthorized: no admin session"));

      const { GET } = await import("@/app/api/invoices/[invoiceNo]/pdf/route");
      const req = new NextRequest("http://localhost:3000/api/invoices/FR-2026-000001/pdf");
      const res = await GET(req, { params: Promise.resolve({ invoiceNo: "FR-2026-000001" }) });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns 404 Not Found when a guessed or wrong token is supplied", async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice as never);

      const { GET } = await import("@/app/api/invoices/[invoiceNo]/pdf/route");
      const req = new NextRequest("http://localhost:3000/api/invoices/FR-2026-000001/pdf?token=wrong-guessed-token");
      const res = await GET(req, { params: Promise.resolve({ invoiceNo: "FR-2026-000001" }) });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Invoice not found");
    });

    it("returns 200 with PDF binary when the correct order tracking token is supplied", async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice as never);

      const { GET } = await import("@/app/api/invoices/[invoiceNo]/pdf/route");
      const req = new NextRequest("http://localhost:3000/api/invoices/FR-2026-000001/pdf?token=valid-secret-token-123");
      const res = await GET(req, { params: Promise.resolve({ invoiceNo: "FR-2026-000001" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });

    it("returns 200 with PDF when accessed by an authenticated admin without token", async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice as never);
      vi.mocked(requireAdmin).mockResolvedValue({ id: "admin-1", email: "admin@freshy.lk", name: "Admin", role: "ADMIN" } as never);

      const { GET } = await import("@/app/api/invoices/[invoiceNo]/pdf/route");
      const req = new NextRequest("http://localhost:3000/api/invoices/FR-2026-000001/pdf");
      const res = await GET(req, { params: Promise.resolve({ invoiceNo: "FR-2026-000001" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });
  });

  describe("GET /api/admin/slips/view", () => {
    it("returns 401 Unauthorized if not authenticated as admin", async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error("Unauthorized"));

      const { GET } = await import("@/app/api/admin/slips/view/route");
      const req = new NextRequest("http://localhost:3000/api/admin/slips/view?path=slips/order-1/slip.jpg");
      const res = await GET(req);

      expect(res.status).toBe(401);
    });
  });
});
