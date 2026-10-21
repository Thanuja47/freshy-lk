// scripts/purge-test-orders.ts — Clean up test and staging orders before production
//
// ⚠️  REFUSES to run when NEXT_PUBLIC_APP_ENV=production or NODE_ENV=production.

import "dotenv/config";
import { db } from "../src/lib/db";

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";

if (APP_ENV === "production") {
  console.error(
    "❌  purge-test-orders: Refused to run in production! " +
    "This script is strictly intended for staging/preview cleanup."
  );
  process.exit(1);
}

const TEST_NAMES = [
  "Nimal Perera",
  "Thanuja Nirmal",
  "Kamal Perera",
  "Test User",
  "Test Customer",
  "Jane Doe",
  "John Doe",
  "Outstation Customer",
];

const TEST_PHONES = [
  "+94771234567",
  "+94777123456",
  "0771234567",
  "0777123456",
];

async function main() {
  console.log(`🧹 Purging test orders (env: ${APP_ENV})...`);

  // Find all test orders matching names or phones
  const testOrders = await db.order.findMany({
    where: {
      OR: [
        { customerName: { in: TEST_NAMES } },
        { customerName: { contains: "Test", mode: "insensitive" } },
        { customerName: { contains: "Playwright", mode: "insensitive" } },
        { customerName: { contains: "E2E", mode: "insensitive" } },
        { phone: { in: TEST_PHONES } },
      ],
    },
    select: {
      id: true,
      orderNo: true,
      customerName: true,
      phone: true,
      totalCents: true,
      createdAt: true,
    },
  });

  if (testOrders.length === 0) {
    console.log("✓ No test orders found to purge.");
    return;
  }

  console.log(`Found ${testOrders.length} test order(s) to remove:`);
  for (const o of testOrders) {
    console.log(`  - ${o.orderNo} | ${o.customerName} | ${o.phone} | Rs. ${(o.totalCents / 100).toFixed(2)} (${o.createdAt.toISOString()})`);
  }

  const ids = testOrders.map((o) => o.id);

  // Cascade delete in Prisma deletes OrderItem, OrderStatusEvent, Invoice, Payment
  const deleteResult = await db.order.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`✅ Successfully purged ${deleteResult.count} test order(s).`);
}

main()
  .catch((e) => {
    console.error("❌ Purge error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
