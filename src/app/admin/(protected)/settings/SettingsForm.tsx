"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FieldDef {
  key: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  type: string;
}

interface SectionDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  fields: FieldDef[];
}

interface SettingsFormProps {
  sections: SectionDef[];
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

export default function SettingsForm({ sections, settings }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSave = (sectionId: string) => {
    setSavedSection(sectionId);
    console.log("Settings save (demo):", values);
    setTimeout(() => setSavedSection(null), 3000);
  };

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const SectionIcon = section.icon;
        const isSaved = savedSection === section.id;

        return (
          <div
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
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                {isSaved ? (
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
              {section.fields.map(({ key, label, icon: FieldIcon, placeholder, type }) => (
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
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
