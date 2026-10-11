// tests/unit/invoice.test.ts — Unit tests for Invoice generation and FR-YYYY-NNNNNN numbering

import { describe, it, expect, vi } from "vitest";
import { generateInvoice, formatInvoiceNumber, renderInvoiceHTML, DEFAULT_BUSINESS_DETAILS } from "../../src/lib/invoices";

describe("Invoice Numbering & HTML Template (FR-YYYY-NNNNNN)", () => {
  const mockOrder = {
    id: "ord-100",
    orderNo: "FRS-261004-0001",
    customerName: "Kamal Perera",
    phone: "0771234567",
    email: "kamal@example.com",
    addressLine1: "123 Galle Rd",
    addressLine2: null,
    city: "Colombo 03",
    district: "Colombo",
    paymentMethod: "CARD_ONLINE",
    subtotalCents: 500000,
    prepTotalCents: 20000,
    deliveryFeeCents: 35000,
    totalCents: 555000,
    items: [],
    zone: { name: "Zone A - Colombo Core" },
  };

  it("formats invoice number with FR-YYYY-NNNNNN pattern and 6 digits zero-padding", async () => {
    let lastNumber = 0;
    const year = new Date().getFullYear();

    const mockTx = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "inv-1", ...data })),
      },
      order: {
        findUnique: vi.fn().mockResolvedValue(mockOrder),
      },
      invoiceCounter: {
        upsert: vi.fn().mockImplementation(({ update, create }) => {
          lastNumber = lastNumber ? lastNumber + update.lastNumber.increment : create.lastNumber;
          return Promise.resolve({ year, lastNumber });
        }),
      },
    };

    const invoice1 = await generateInvoice("ord-100", mockTx as unknown as Parameters<typeof generateInvoice>[1]);
    expect(invoice1.invoiceNo).toBe(`FR-${year}-000001`);
    expect(invoice1.invoiceNo).toMatch(/^FR-\d{4}-\d{6}$/);

    // Second order gets incremented number FR-YYYY-000002
    mockTx.invoice.findUnique.mockResolvedValue(null);
    mockTx.order.findUnique.mockResolvedValue({ ...mockOrder, id: "ord-101" });

    const invoice2 = await generateInvoice("ord-101", mockTx as unknown as Parameters<typeof generateInvoice>[1]);
    expect(invoice2.invoiceNo).toBe(`FR-${year}-000002`);
  });

  it("renders complete HTML invoice with LKR formatted totals and business details", () => {
    const formattedNo = formatInvoiceNumber(2026, 42);
    expect(formattedNo).toBe("FR-2026-000042");

    const html = renderInvoiceHTML(
      {
        orderNo: "FRS-261008-0001",
        invoiceNo: formattedNo,
        issuedAt: new Date().toISOString(),
        customerName: "Sunil Perera",
        phone: "+94771112233",
        addressLine1: "55 Main Street",
        city: "Colombo 01",
        district: "Colombo",
        zoneName: "Colombo Core",
        paymentMethod: "BANK_TRANSFER",
        subtotalCents: 200000,
        prepTotalCents: 1500,
        deliveryFeeCents: 35000,
        totalCents: 236500,
        items: [
          {
            productName: "Seer Fish",
            packLabel: "1 kg",
            quantity: 1,
            pricePerKgCents: 200000,
            prepFeeCents: 1500,
            lineTotalCents: 200000,
          },
        ],
      },
      DEFAULT_BUSINESS_DETAILS
    );

    expect(html).toContain("FR-2026-000042");
    expect(html).toContain("Freshy LK (Pvt) Ltd");
    expect(html).toContain("Rs. 2,365.00");
    expect(html).toContain("Seer Fish");
  });
});
