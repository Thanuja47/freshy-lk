import fs from "fs";
import path from "path";
import { generateInvoicePdfBuffer } from "../src/lib/pdf";

const sampleSnapshot = {
  orderNo: "FRS-261016-0001",
  invoiceNo: "FR-2026-000001",
  issuedAt: new Date("2026-10-16T14:30:00.000Z").toISOString(),
  customerName: "Nirmal Thanuja",
  phone: "+94771234567",
  email: "nirmal.test@freshy.lk",
  addressLine1: "No 45, Marine Drive",
  addressLine2: "Bambalapitiya",
  city: "Colombo 03",
  district: "Colombo",
  zoneName: "Colombo Metro Express",
  paymentMethod: "BANK_TRANSFER",
  subtotalCents: 490000,   // Rs. 4,900.00
  prepTotalCents: 25000,    // Rs. 250.00 (Prep fee)
  deliveryFeeCents: 35000,  // Rs. 350.00 (Delivery fee)
  totalCents: 550000,       // Rs. 5,500.00
  items: [
    {
      productName: "Fresh Sprats - Hurulla (Sinhala: Hurulla / hurulla)",
      packLabel: "1 kg pack",
      quantity: 2,
      pricePerKgCents: 98000, // Rs. 980.00/kg
      prepName: "Cleaned & Headless",
      prepFeeCents: 15000,    // Rs. 150.00
      lineTotalCents: 196000,
    },
    {
      productName: "Yellowfin Tuna - Kelawalla (Sinhala: Kelawalla)",
      packLabel: "1 kg pack",
      quantity: 1,
      pricePerKgCents: 294000,
      prepName: "Curry Cut Cubes",
      prepFeeCents: 10000,    // Rs. 100.00
      lineTotalCents: 294000,
    },
  ],
};

const pdfBuffer = generateInvoicePdfBuffer(sampleSnapshot);
const outPath = path.join(process.cwd(), "docs", "sample-invoice.pdf");
fs.writeFileSync(outPath, pdfBuffer);
console.log("Generated sample invoice PDF at:", outPath, "Size:", pdfBuffer.length, "bytes");
