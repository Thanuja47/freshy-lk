// src/app/admin/(protected)/settings/page.tsx
import { db } from "@/lib/db";
import SettingsForm from "./SettingsForm";
import { Building2, Receipt, Phone, ShieldCheck, CreditCard } from "lucide-react";

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

  const sections = [
    {
      id: "general",
      title: "Store & Brand Information",
      description: "Company details displayed on storefront, emails, and customer communications.",
      icon: Building2,
      fields: [
        { key: "companyName", label: "Business Legal Name", icon: Building2, placeholder: "Freshy LK (Pvt) Ltd", type: "text" },
        { key: "operatingAddress", label: "Operating Hub Address", icon: Building2, placeholder: "Harbor Road, Negombo", type: "text" },
      ],
    },
    {
      id: "contact",
      title: "Customer Support & Contact",
      description: "Primary support channels visible to buyers during checkout and order tracking.",
      icon: Phone,
      fields: [
        { key: "supportPhone", label: "Helpline Phone Number", icon: Phone, placeholder: "+94 77 123 4567", type: "tel" },
        { key: "supportEmail", label: "Support Email", icon: Phone, placeholder: "orders@freshy.lk", type: "email" },
      ],
    },
    {
      id: "bank",
      title: "Bank Transfer Payment Details",
      description: "Bank details provided to customers choosing Direct Bank Transfer payment method.",
      icon: CreditCard,
      fields: [
        { key: "bankName", label: "Bank Name", icon: CreditCard, placeholder: "Commercial Bank of Ceylon", type: "text" },
        { key: "bankAccountName", label: "Account Name", icon: Building2, placeholder: "Freshy LK (Pvt) Ltd", type: "text" },
        { key: "bankAccountNumber", label: "Account Number", icon: CreditCard, placeholder: "1000200300", type: "text" },
        { key: "bankBranch", label: "Branch Name", icon: Building2, placeholder: "Colombo Main Branch", type: "text" },
      ],
    },
    {
      id: "invoicing",
      title: "Invoicing & Receipts",
      description: "Receipt numbering prefixes, tax registrations, and customer invoice footnotes.",
      icon: Receipt,
      fields: [
        { key: "invoicePrefix", label: "Invoice Number Prefix", icon: Receipt, placeholder: "INV-", type: "text" },
        { key: "vatNumber", label: "Business Registration / VAT No", icon: ShieldCheck, placeholder: "PV-123456 / VAT-894210", type: "text" },
        { key: "invoiceFooter", label: "Footer Thank-You Message", icon: Receipt, placeholder: "Thank you for buying fresh from Freshy.lk!", type: "text" },
      ],
    },
  ];

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

      <SettingsForm sections={sections} settings={mergedSettings} />
    </div>
  );
}
