// src/app/admin/(protected)/messages/page.tsx
import { db } from "@/lib/db";
import MessagesClient, { type InquiryRow } from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let inquiries: InquiryRow[] = [];
  const stats = {
    total: 0,
    newCount: 0,
    contactedCount: 0,
    quotedCount: 0,
    wonCount: 0,
    lostCount: 0,
  };

  try {
    const [fetchedInquiries, counts] = await Promise.all([
      db.contactInquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.contactInquiry.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    inquiries = fetchedInquiries.map((iq) => ({
      ...iq,
      createdAt: iq.createdAt.toISOString(),
    }));

    for (const c of counts) {
      stats.total += c._count._all;
      if (c.status === "NEW") stats.newCount = c._count._all;
      else if (c.status === "CONTACTED") stats.contactedCount = c._count._all;
      else if (c.status === "QUOTED") stats.quotedCount = c._count._all;
      else if (c.status === "WON") stats.wonCount = c._count._all;
      else if (c.status === "LOST") stats.lostCount = c._count._all;
    }
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminMessagesPage fallback:", err);
  }

  return <MessagesClient initialInquiries={inquiries} initialStats={stats} />;
}
