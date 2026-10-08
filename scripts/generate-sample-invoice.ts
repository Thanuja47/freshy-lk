import { renderInvoiceHTML, formatInvoiceNumber, DEFAULT_BUSINESS_DETAILS } from "./src/lib/invoices";
import fs from "fs";
import path from "path";

const sampleSnapshot = {
  orderNo: "FRS-261008-0001",
  invoiceNo: formatInvoiceNumber(2026, 1),
  issuedAt: new Date().toISOString(),
  customerName: "Nimal Jayasinghe",
  phone: "+94771234567",
  email: "nimal@example.com",
  addressLine1: "No. 12, Beach Road",
  addressLine2: "Mount Lavinia",
  city: "Dehiwala-Mount Lavinia",
  district: "Colombo",
  zoneName: "Colombo Greater Zone",
  paymentMethod: "CARD_ONLINE",
  subtotalCents: 450000, // Rs. 4,500.00
  prepTotalCents: 25000,  // Rs. 250.00
  deliveryFeeCents: 35000, // Rs. 350.00
  totalCents: 510000,    // Rs. 5,100.00
  items: [
    {
      productName: "Yellowfin Tuna (Kelawalla)",
      packLabel: "1 kg pack",
      quantity: 2,
      pricePerKgCents: 180000, // Rs. 1,800.00/kg
      prepName: "Cleaned & Cubed",
      prepFeeCents: 15000,
      lineTotalCents: 360000,
    },
    {
      productName: "Jumbo Tiger Prawns",
      packLabel: "500 g pack",
      quantity: 1,
      pricePerKgCents: 180000, // Rs. 900.00 for 500g
      prepName: "Peeled & Deveined",
      prepFeeCents: 10000,
      lineTotalCents: 90000,
    },
  ],
};

const html = renderInvoiceHTML(sampleSnapshot, DEFAULT_BUSINESS_DETAILS);
const outputPath = path.join(process.cwd(), "docs", "sample-invoice.html");
fs.writeFileSync(outputPath, html, "utf-8");
console.log("Sample invoice rendered to:", outputPath);
