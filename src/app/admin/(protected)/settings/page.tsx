// src/app/admin/(protected)/settings/page.tsx
import { db } from "@/lib/db";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const defaultSettings: Record<string, string> = {
    companyName: "Freshy LK (Pvt) Ltd",
    supportPhone: "+94 77 123 4567",
    supportEmail: "support@freshy.lk",
    operatingAddress: "Negombo Harbor Road, Negombo, Sri Lanka",
    invoicePrefix: "INV-",
    vatNumber: "BR-984210",
    invoiceFooter: "Thank you for choosing Freshy.lk! Direct from Sri Lankan coastal landings.",
    bankName: "Commercial Bank of Ceylon",
    bankAccountName: "Freshy LK (Pvt) Ltd",
    bankAccountNumber: "8001234567",
    bankBranch: "Negombo Branch",
  };

  const loadedSettings: Record<string, string> = {};

  try {
    const rows = await db.setting.findMany();
    for (const row of rows) {
      if (row.value != null) {
        if (typeof row.value === "string") {
          loadedSettings[row.key] = row.value;
        } else {
          loadedSettings[row.key] = String(row.value);
        }
      }
    }
  } catch (err) {
    console.warn("Could not load db settings, falling back to defaults:", err);
  }

  const mergedSettings = { ...defaultSettings, ...loadedSettings };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
          Settings
        </h1>
        <p className="text-sm text-[#6E6E73] mt-1">
          Configure business details, customer support channels, bank transfer details, and invoice formats.
        </p>
      </div>

      <SettingsForm settings={mergedSettings} />
    </div>
  );
}
