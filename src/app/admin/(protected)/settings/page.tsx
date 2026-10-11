import { db } from "@/lib/db";
import { Settings, Store, Phone, Mail, MapPin, Globe, Building } from "lucide-react";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  let settings: Record<string, string> = {};

  try {
    const rows = await db.setting.findMany();
    for (const row of rows) {
      settings[row.key] = row.value != null ? String(row.value) : "";
    }
  } catch (err) {
    if (process.env.DEMO_MODE !== "true") {
      throw err;
    }
    console.warn("DB offline in AdminSettingsPage fallback:", err);
    settings = {
      businessName: "Freshy.lk",
      businessPhone: "+94 77 000 0000",
      businessEmail: "hello@freshy.lk",
      businessAddress: "No. 1, Main Street, Colombo 01",
      websiteUrl: "https://freshy.lk",
      vatNumber: "",
      invoiceFooter: "Thank you for shopping fresh!",
    };
  }

  const sections = [
    {
      id: "business",
      title: "Business Details",
      description: "Used on invoices and customer-facing communications.",
      icon: Store,
      fields: [
        { key: "businessName", label: "Business Name", icon: Building, placeholder: "Freshy.lk", type: "text" },
        { key: "businessPhone", label: "Phone Number", icon: Phone, placeholder: "+94 77 000 0000", type: "tel" },
        { key: "businessEmail", label: "Email Address", icon: Mail, placeholder: "hello@freshy.lk", type: "email" },
        { key: "websiteUrl", label: "Website URL", icon: Globe, placeholder: "https://freshy.lk", type: "url" },
        { key: "vatNumber", label: "VAT / BR Number", icon: Building, placeholder: "Optional", type: "text" },
      ],
    },
    {
      id: "address",
      title: "Business Address",
      description: "Printed on PDF invoices.",
      icon: MapPin,
      fields: [
        { key: "businessAddress", label: "Street Address", icon: MapPin, placeholder: "No. 1, Main Street, Colombo 01", type: "text" },
      ],
    },
    {
      id: "invoice",
      title: "Invoice Settings",
      description: "Text printed at the bottom of every PDF invoice.",
      icon: Settings,
      fields: [
        { key: "invoiceFooter", label: "Invoice Footer Note", icon: Settings, placeholder: "Thank you for shopping fresh!", type: "text" },
      ],
    },
  ];

  return (
    <div className="space-y-6" style={{ maxWidth: "720px" }}>
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
          Settings
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E73", marginTop: "4px" }}>
          Business information and invoice configuration.
        </p>
      </div>

      <SettingsForm sections={sections} settings={settings} />
    </div>
  );
}
