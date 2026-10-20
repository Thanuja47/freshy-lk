// src/lib/pdf.ts — Pure TypeScript PDF 1.4 generator for invoices (Zero external dependencies)
import type { InvoiceSnapshot } from "@/lib/invoices";

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function generateInvoicePdfBuffer(snapshot: InvoiceSnapshot): Buffer {
  const objects: string[] = [];
  const offsets: number[] = [];

  function addObject(content: string): number {
    const objNum = objects.length + 1;
    objects.push(`${objNum} 0 obj\n${content}\nendobj`);
    return objNum;
  }

  // 1 0 obj: Catalog
  addObject("<< /Type /Catalog /Pages 2 0 R >>");

  // 2 0 obj: Pages
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");

  // We will build the page content stream
  const commands: string[] = [];

  // Helper drawing functions (Page size: A4 = 595.28 x 841.89 points)
  const drawText = (
    text: string,
    x: number,
    y: number,
    fontSize = 10,
    font = "F1",
    color = "0 0 0"
  ) => {
    commands.push("BT");
    commands.push(`/${font} ${fontSize} Tf`);
    commands.push(`${color} rg`);
    commands.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    commands.push(`(${escapePdfText(text)}) Tj`);
    commands.push("ET");
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, strokeColor = "0.8 0.8 0.8", lineWidth = 1) => {
    commands.push("q");
    commands.push(`${strokeColor} RG`);
    commands.push(`${lineWidth} w`);
    commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`);
    commands.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`);
    commands.push("S");
    commands.push("Q");
  };

  const drawRect = (x: number, y: number, w: number, h: number, fillColor = "0.95 0.95 0.95") => {
    commands.push("q");
    commands.push(`${fillColor} rg`);
    commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    commands.push("f");
    commands.push("Q");
  };

  // Header Banner
  drawRect(40, 770, 515, 45, "0.05 0.35 0.65");
  drawText("FRESHY.LK — INVOICE", 55, 788, 16, "F2", "1 1 1");
  drawText("Premium Seafood & Coastal Catch", 55, 776, 9, "F1", "0.9 0.9 0.9");

  // Invoice Meta (Right-aligned / top block)
  drawText(`Invoice No: ${snapshot.invoiceNo}`, 370, 745, 11, "F2", "0.1 0.1 0.1");
  drawText(`Date: ${new Date(snapshot.issuedAt).toLocaleDateString("en-LK")}`, 370, 730, 9, "F1", "0.3 0.3 0.3");
  drawText(`Order Ref: ${snapshot.orderNo}`, 370, 715, 9, "F1", "0.3 0.3 0.3");
  drawText(`Payment: ${snapshot.paymentMethod}`, 370, 700, 9, "F1", "0.3 0.3 0.3");

  // Merchant info
  drawText("Freshy LK (Pvt) Ltd", 40, 745, 10, "F2", "0.1 0.1 0.1");
  drawText("45 Oceanfront Avenue, Colombo 03, Sri Lanka", 40, 732, 9, "F1", "0.3 0.3 0.3");
  drawText("Phone: +94 11 234 5678 | Email: orders@freshy.lk", 40, 719, 9, "F1", "0.3 0.3 0.3");
  drawText("VAT Reg: VAT-100293847-7000", 40, 706, 9, "F1", "0.3 0.3 0.3");

  drawLine(40, 690, 555, 690, "0.85 0.85 0.85", 1);

  // Customer / Delivery section
  drawText("BILLED & DELIVERED TO:", 40, 672, 9, "F2", "0.4 0.4 0.4");
  drawText(snapshot.customerName, 40, 658, 10, "F2", "0.1 0.1 0.1");
  drawText(`Phone: ${snapshot.phone}`, 40, 645, 9, "F1", "0.3 0.3 0.3");
  if (snapshot.email) {
    drawText(`Email: ${snapshot.email}`, 40, 632, 9, "F1", "0.3 0.3 0.3");
  }
  const addressText = `${snapshot.addressLine1}${snapshot.addressLine2 ? ", " + snapshot.addressLine2 : ""}, ${snapshot.city}`;
  drawText(addressText, 40, snapshot.email ? 619 : 632, 9, "F1", "0.3 0.3 0.3");
  drawText(`Zone: ${snapshot.zoneName} (${snapshot.district} District)`, 40, snapshot.email ? 606 : 619, 9, "F1", "0.3 0.3 0.3");

  // Table Header
  const tableY = 580;
  drawRect(40, tableY - 5, 515, 22, "0.93 0.95 0.98");
  drawLine(40, tableY - 5, 555, tableY - 5, "0.8 0.85 0.9", 1);
  drawLine(40, tableY + 17, 555, tableY + 17, "0.8 0.85 0.9", 1);

  drawText("ITEM & SPECIFICATION", 50, tableY + 3, 9, "F2", "0.1 0.1 0.1");
  drawText("QTY", 280, tableY + 3, 9, "F2", "0.1 0.1 0.1");
  drawText("RATE / KG", 340, tableY + 3, 9, "F2", "0.1 0.1 0.1");
  drawText("PREP", 420, tableY + 3, 9, "F2", "0.1 0.1 0.1");
  drawText("AMOUNT (LKR)", 480, tableY + 3, 9, "F2", "0.1 0.1 0.1");

  // Table Rows
  let curY = tableY - 24;
  for (const item of snapshot.items) {
    drawText(`${item.productName} (${item.packLabel})`, 50, curY, 9, "F1", "0.1 0.1 0.1");
    if (item.prepName) {
      drawText(`Prep: ${item.prepName}`, 50, curY - 11, 8, "F1", "0.1 0.45 0.75");
    }

    drawText(String(item.quantity), 285, curY, 9, "F1", "0.2 0.2 0.2");
    drawText(`Rs. ${(item.pricePerKgCents / 100).toFixed(2)}`, 340, curY, 9, "F1", "0.2 0.2 0.2");
    drawText(`Rs. ${(item.prepFeeCents / 100).toFixed(2)}`, 420, curY, 9, "F1", "0.2 0.2 0.2");

    const lineTotal = ((item.lineTotalCents + item.prepFeeCents) / 100).toFixed(2);
    drawText(`Rs. ${lineTotal}`, 480, curY, 9, "F2", "0.1 0.1 0.1");

    drawLine(40, curY - (item.prepName ? 16 : 8), 555, curY - (item.prepName ? 16 : 8), "0.92 0.92 0.92", 0.5);
    curY -= item.prepName ? 28 : 20;
  }

  // Totals Area
  curY -= 10;
  drawLine(340, curY, 555, curY, "0.8 0.8 0.8", 1);
  curY -= 16;

  drawText("Subtotal:", 350, curY, 9, "F1", "0.3 0.3 0.3");
  drawText(`Rs. ${(snapshot.subtotalCents / 100).toFixed(2)}`, 480, curY, 9, "F1", "0.2 0.2 0.2");

  if (snapshot.prepTotalCents > 0) {
    curY -= 14;
    drawText("Preparation Fee:", 350, curY, 9, "F1", "0.3 0.3 0.3");
    drawText(`Rs. ${(snapshot.prepTotalCents / 100).toFixed(2)}`, 480, curY, 9, "F1", "0.2 0.2 0.2");
  }

  curY -= 14;
  drawText("Delivery Fee:", 350, curY, 9, "F1", "0.3 0.3 0.3");
  drawText(`Rs. ${(snapshot.deliveryFeeCents / 100).toFixed(2)}`, 480, curY, 9, "F1", "0.2 0.2 0.2");

  curY -= 16;
  drawRect(340, curY - 5, 215, 22, "0.93 0.96 0.99");
  drawLine(340, curY - 5, 555, curY - 5, "0.1 0.4 0.7", 1);
  drawLine(340, curY + 17, 555, curY + 17, "0.1 0.4 0.7", 1);

  drawText("TOTAL AMOUNT:", 350, curY + 3, 10, "F2", "0.05 0.35 0.65");
  drawText(`Rs. ${(snapshot.totalCents / 100).toFixed(2)}`, 470, curY + 3, 11, "F2", "0.05 0.35 0.65");

  // Footer notes
  drawText("Thank you for choosing Freshy.lk! Direct from Sri Lankan coastal landings to your door.", 40, 80, 8, "F1", "0.5 0.5 0.5");
  drawText("This is a computer-generated tax invoice and requires no physical signature.", 40, 68, 8, "F1", "0.5 0.5 0.5");

  const streamContent = commands.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf-8");

  // 3 0 obj: Page
  addObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`
  );

  // 4 0 obj: Stream Contents
  addObject(`<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`);

  // 5 0 obj: Standard Font F1 (Helvetica)
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

  // 6 0 obj: Standard Font F2 (Helvetica-Bold)
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  // Assemble full PDF
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += objects[i] + "\n";
  }

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += "xref\n";
  pdf += `0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    pdf += offsets[i].toString().padStart(10, "0") + " 00000 n \n";
  }

  pdf += "trailer\n";
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefOffset}\n`;
  pdf += "%%EOF\n";

  return Buffer.from(pdf, "binary");
}
