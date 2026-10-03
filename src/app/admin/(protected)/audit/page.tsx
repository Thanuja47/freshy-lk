import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireOwner();

  let logs: Array<{
    id: string;
    action: string;
    entity: string;
    diff: unknown;
    createdAt: Date;
    admin: { name: string; email: string } | null;
  }> = [];

  try {
    logs = await db.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { name: true, email: true } },
      },
    });
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminAuditPage fallback:", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-sea-ink">Audit Log</h1>
        <p className="text-xs text-sea-ink/70 mt-1">
          Historical record of administrative changes (prices, stock, settings, and orders).
        </p>
      </div>

      <div className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ice border-b border-sand text-[11px] font-bold uppercase tracking-wider text-sea-ink/70">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/50 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-ice/50 font-mono">
                  <td className="py-3 px-4 text-sea-ink/70 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-LK")}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-sea-ink">
                    {log.admin ? log.admin.name : "System / Demo"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-tide/10 text-tide font-bold rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sea-ink">{log.entity}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-sea-ink/80 max-w-xs truncate">
                    {JSON.stringify(log.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
