import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { ScrollText, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  PRICE_UPDATE: { bg: "#E3F2FD", text: "#1565C0" },
  STOCK_UPDATE: { bg: "#E8F5E9", text: "#2E7D32" },
  ORDER_STATUS: { bg: "#FFF3E0", text: "#B26A00" },
  SETTINGS_UPDATE: { bg: "#F3E5F5", text: "#6A1B9A" },
  LOGIN: { bg: "rgba(0,0,0,0.05)", text: "#1D1D1F" },
};

function getActionStyle(action: string) {
  return ACTION_STYLES[action] ?? { bg: "rgba(0,0,0,0.05)", text: "#6E6E73" };
}

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
      take: 100,
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
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#1D1D1F",
            margin: 0,
          }}
        >
          Audit Log
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E73", marginTop: "4px" }}>
          Immutable history of price changes, stock updates, and order actions.
        </p>
      </div>

      {/* Owner-only notice */}
      <div
        style={{
          background: "#FFF8E1",
          border: "1px solid rgba(178,106,0,0.2)",
          borderRadius: "12px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: "#B26A00",
        }}
      >
        <ShieldAlert style={{ width: 15, height: 15, flexShrink: 0 }} />
        Visible to Owner role only. All entries are append-only.
      </div>

      {/* Table card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <ScrollText
              style={{
                width: 36,
                height: 36,
                strokeWidth: 1.25,
                margin: "0 auto 12px",
                color: "#6E6E73",
                opacity: 0.4,
              }}
            />
            <p style={{ fontWeight: 600, color: "#1D1D1F" }}>No audit entries</p>
            <p style={{ fontSize: "13px", color: "#6E6E73", marginTop: 4 }}>
              Admin actions will appear here once recorded.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    background: "#F5F5F7",
                  }}
                >
                  {["Timestamp", "Admin", "Action", "Entity", "Change Details"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "11px 16px",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#6E6E73",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const style = getActionStyle(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: i < logs.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#6E6E73",
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        {new Date(log.createdAt).toLocaleString("en-LK")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1D1D1F", fontSize: "13px" }}>
                          {log.admin ? log.admin.name : "System"}
                        </div>
                        {log.admin && (
                          <div style={{ fontSize: "11px", color: "#6E6E73" }}>{log.admin.email}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: style.bg,
                            color: style.text,
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "6px",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#1D1D1F",
                          fontWeight: 500,
                        }}
                      >
                        {log.entity}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          maxWidth: "260px",
                        }}
                      >
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color: "#6E6E73",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {JSON.stringify(log.diff)}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
