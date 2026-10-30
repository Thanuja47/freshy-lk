"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, Loader2, AlertCircle, Building2, Receipt, Phone, ShieldCheck, CreditCard, MapPin, Mail, Clock, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { saveSettingsAction } from "@/actions/settings";

interface FieldDef {
  key: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  type: string;
  description?: string;
}

interface SectionDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  fields: FieldDef[];
}

const DEFAULT_SECTIONS: SectionDef[] = [
  {
    id: "paymentMethods",
    title: "Payment Methods & Launch Scope",
    description: "Control which payment methods are accepted at checkout. Inactive or unconfigured methods are completely hidden across the storefront.",
    icon: CreditCard,
    fields: [
      { key: "paymentBankTransferEnabled", label: "Direct Bank Transfer (Slip Upload)", icon: Building2, placeholder: "true", type: "toggle", description: "Primary launch payment method. Customers place orders, view bank transfer details, and upload payment slips for admin verification." },
      { key: "paymentCardPayHereEnabled", label: "Online Card Payments (PayHere Gateway)", icon: CreditCard, placeholder: "false", type: "toggle", description: "Kept OFF for launch. Requires both this toggle ON and PAYHERE_MERCHANT_ID + PAYHERE_MERCHANT_SECRET configured in environment variables." },
      { key: "paymentCodEnabled", label: "Cash on Delivery (COD)", icon: Receipt, placeholder: "false", type: "toggle", description: "Kept OFF for launch." },
    ],
  },
  {
    id: "bank",
    title: "Bank Transfer Payment Details",
    description: "Bank account details presented to customers choosing Direct Bank Transfer payment method.",
    icon: CreditCard,
    fields: [
      { key: "bankName", label: "Bank Name", icon: CreditCard, placeholder: "e.g. Commercial Bank of Ceylon", type: "text" },
      { key: "bankAccountName", label: "Account Name", icon: Building2, placeholder: "e.g. Freshy LK (Pvt) Ltd", type: "text" },
      { key: "bankAccountNumber", label: "Account Number", icon: CreditCard, placeholder: "e.g. 1000200300", type: "text" },
      { key: "bankBranch", label: "Branch Name", icon: Building2, placeholder: "e.g. Colombo Main Branch", type: "text" },
    ],
  },
  {
    id: "general",
    title: "Store & Brand Information",
    description: "Company details displayed on storefront, emails, and customer communications.",
    icon: Building2,
    fields: [
      { key: "companyName", label: "Business Legal Name", icon: Building2, placeholder: "e.g. Freshy LK (Pvt) Ltd", type: "text" },
      { key: "operatingAddress", label: "Operating Hub Address", icon: MapPin, placeholder: "e.g. No. 45, Harbor Road, Negombo", type: "text" },
      { key: "hubDescription", label: "Hub Description / Pickup Info", icon: Building2, placeholder: "e.g. Order pickup and dispatch hub", type: "text" },
    ],
  },
  {
    id: "contact",
    title: "Customer Support & Contact",
    description: "Primary support channels visible to buyers on /contact, header, footer, and checkout.",
    icon: Phone,
    fields: [
      { key: "supportPhone", label: "Helpline Phone Number", icon: Phone, placeholder: "e.g. +94 11 234 5678", type: "tel" },
      { key: "supportWhatsapp", label: "WhatsApp Number (Digits with country code)", icon: MessageCircle, placeholder: "e.g. +94 77 123 4567", type: "tel" },
      { key: "supportEmail", label: "Support Email", icon: Mail, placeholder: "e.g. orders@freshy.lk", type: "email" },
      { key: "supportHours", label: "Support Hours Text", icon: Clock, placeholder: "e.g. Mon–Sat: 6:00 AM – 8:00 PM | Sun: 6:00 AM – 2:00 PM", type: "text" },
      { key: "responseTimeText", label: "Response-Time Note (optional)", icon: Clock, placeholder: "e.g. Response within 2 hours", type: "text" },
    ],
  },
  {
    id: "invoicing",
    title: "Invoicing & Receipts",
    description: "Receipt numbering prefixes, tax registrations, and customer invoice footnotes.",
    icon: Receipt,
    fields: [
      { key: "invoicePrefix", label: "Invoice Number Prefix", icon: Receipt, placeholder: "e.g. INV-", type: "text" },
      { key: "vatNumber", label: "Business Registration / VAT No", icon: ShieldCheck, placeholder: "e.g. PV-123456 / VAT-894210", type: "text" },
      { key: "invoiceFooter", label: "Footer Thank-You Message", icon: Receipt, placeholder: "e.g. Thank you for buying fresh from Freshy.lk!", type: "text" },
    ],
  },
];

interface SettingsFormProps {
  sections?: SectionDef[];
  settings: Record<string, string>;
}

const headingStyle: React.CSSProperties = {
  fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  color: "#1D1D1F",
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 12px 0 38px",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#1D1D1F",
  background: "#F5F5F7",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export default function SettingsForm({ sections = DEFAULT_SECTIONS, settings }: SettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSave = async (sectionId: string) => {
    setSavingSection(sectionId);
    setErrorMessage(null);

    try {
      const res = await saveSettingsAction(values);
      if (res.success) {
        setSavedSection(sectionId);
        router.refresh();
        setTimeout(() => setSavedSection(null), 3000);
      } else {
        setErrorMessage(res.message || "Failed to save settings. Please try again.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred while saving.");
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#FFEBEE",
            border: "1px solid #FFCDD2",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "#C62828",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {sections.map((section) => {
        const SectionIcon = section.icon;
        const isSaved = savedSection === section.id;
        const isSaving = savingSection === section.id;

        return (
          <section
            id={`section-${section.id}`}
            key={section.id}
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: "#E3F2FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <SectionIcon style={{ width: 18, height: 18, color: "#1E88E5", strokeWidth: 1.75 }} />
                </div>
                <div>
                  <h2 style={headingStyle}>{section.title}</h2>
                  <p style={{ fontSize: "13px", color: "#6E6E73", margin: "2px 0 0" }}>
                    {section.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(section.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isSaved ? "#2E7D32" : "#1E88E5",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                  flexShrink: 0,
                  transition: "background 0.2s, opacity 0.2s",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <Check style={{ width: 14, height: 14 }} />
                    Saved
                  </>
                ) : (
                  <>
                    <Save style={{ width: 14, height: 14 }} />
                    Save
                  </>
                )}
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {section.fields.map(({ key, label, icon: FieldIcon, placeholder, type, description }) => {
                if (type === "toggle") {
                  const isChecked =
                    key === "paymentBankTransferEnabled"
                      ? values[key] !== "false" // default enabled
                      : values[key] === "true";  // default disabled

                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "#F5F5F7",
                        borderRadius: "12px",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            background: isChecked ? "#E3F2FD" : "#E5E5EA",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <FieldIcon
                            style={{
                              width: 16,
                              height: 16,
                              color: isChecked ? "#1E88E5" : "#8E8E93",
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1F" }}>
                            {label}
                          </div>
                          {description && (
                            <p style={{ fontSize: "11px", color: "#6E6E73", margin: "2px 0 0", lineHeight: 1.4 }}>
                              {description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        aria-label={`Toggle ${label}`}
                        onClick={() =>
                          setValues((v) => ({
                            ...v,
                            [key]: isChecked ? "false" : "true",
                          }))
                        }
                        style={{
                          width: "44px",
                          height: "26px",
                          borderRadius: "13px",
                          background: isChecked ? "#34C759" : "#D1D1D6",
                          border: "none",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            transform: isChecked ? "translateX(18px)" : "translateX(0)",
                            transition: "transform 0.2s",
                          }}
                        />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label
                      htmlFor={`field-${key}`}
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                        marginBottom: "6px",
                        fontFamily: "-apple-system, 'SF Pro Text', Inter, system-ui, sans-serif",
                      }}
                    >
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <FieldIcon
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 15,
                          height: 15,
                          color: focusedField === key ? "#1E88E5" : "#6E6E73",
                          strokeWidth: 1.75,
                          pointerEvents: "none",
                          transition: "color 0.15s",
                        }}
                      />
                      <input
                        id={`field-${key}`}
                        type={type}
                        value={values[key] ?? ""}
                        placeholder={placeholder}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        onFocus={() => setFocusedField(key)}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          ...inputStyle,
                          borderColor: focusedField === key ? "#1E88E5" : "rgba(0,0,0,0.12)",
                          boxShadow: focusedField === key ? "0 0 0 3px rgba(30,136,229,0.1)" : "none",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
