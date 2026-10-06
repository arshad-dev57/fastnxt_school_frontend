"use client";

import { useState } from "react";
import { Sun, Moon, Monitor, Palette, Languages, Check, CheckCircle2, Save } from "lucide-react";
import { Badge, Btn, Card, CardHead, Field, Modal, PageHeader, Select, cn } from "@/components/ui";

const THEMES = [
  { k: "Light", Icon: Sun, desc: "Bright interface, best for daytime use" },
  { k: "Dark", Icon: Moon, desc: "Dimmed interface, easier on the eyes at night" },
  { k: "System", Icon: Monitor, desc: "Follows your device appearance setting" },
];
const ACCENTS = [
  { name: "Blue (default)", color: "var(--theme-primary)" },
  { name: "Purple", color: "var(--theme-accent)" },
  { name: "Green", color: "var(--theme-success)" },
  { name: "Orange", color: "var(--theme-warning)" },
  { name: "Pink", color: "#FF158A" },
  { name: "Teal", color: "var(--theme-success-text)" },
];
const LANGUAGES = ["English", "اردو (Urdu)", "العربية (Arabic)", "Français", "Español"];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

export default function ThemeLanguagePage() {
  const [theme, setTheme] = useState("Light");
  const [accent, setAccent] = useState("var(--theme-primary)");
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0]);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Theme & Language" subtitle="Personalise the look, accent colour and display language."
        actions={<Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Preferences</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card pad={false}>
            <CardHead title="Appearance" subtitle="Choose how the application looks" Icon={Palette} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
              {THEMES.map(({ k, Icon, desc }) => (
                <button key={k} type="button" onClick={() => setTheme(k)}
                  className={cn("flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                    theme === k ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)]" : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]")}>
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", theme === k ? "bg-[var(--theme-primary)] text-white" : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex items-center gap-2 text-[14px] font-medium">{k}{theme === k && <Check className="h-4 w-4 text-[var(--theme-primary)]" />}</span>
                  <span className="text-[12px] text-[var(--theme-text-muted)]">{desc}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Accent colour" subtitle="Applied to primary buttons and highlights" Icon={Palette} />
            <div className="flex flex-wrap gap-3 p-4">
              {ACCENTS.map((a) => (
                <button key={a.color} type="button" onClick={() => setAccent(a.color)} title={a.name}
                  className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    accent === a.color ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)]" : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]")}>
                  <span className="h-5 w-5 rounded-full" style={{ background: a.color }} />
                  {a.name}
                  {accent === a.color && <Check className="h-4 w-4 text-[var(--theme-primary)]" />}
                </button>
              ))}
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Language & region" subtitle="Interface language and date formatting" Icon={Languages} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="Display Language"><Select options={LANGUAGES} value={language} onChange={(e) => setLanguage(e.target.value)} /></Field>
              <Field label="Date Format"><Select options={DATE_FORMATS} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} /></Field>
              <Field label="Time Zone"><Select options={["Asia/Karachi (PKT)", "Asia/Dubai (GST)", "UTC"]} value="Asia/Karachi (PKT)" onChange={() => {}} /></Field>
              <Field label="Currency"><Select options={["PKR — Rs", "USD — $", "AED — د.إ", "GBP — £"]} value="PKR — Rs" onChange={() => {}} /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Live preview" Icon={Palette} />
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--theme-text-muted)]">Theme</span><Badge label={theme} tone="blue" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--theme-text-muted)]">Accent</span>
                <span className="flex items-center gap-2 text-[13px]">{ACCENTS.find((a) => a.color === accent)?.name}<span className="h-4 w-4 rounded-full" style={{ background: accent }} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--theme-text-muted)]">Language</span><span className="text-[13px]">{language}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--theme-text-muted)]">Date format</span><span className="text-[13px]">{dateFormat}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="flex h-9 flex-1 items-center justify-center rounded text-[13px] font-medium text-white" style={{ background: accent }}>Primary</span>
                <span className="flex h-9 flex-1 items-center justify-center rounded border border-[var(--theme-border-strong)] text-[13px]">Secondary</span>
              </div>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Preferences</Btn>
          </div>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Preferences saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">Theme &amp; language preferences updated.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">{theme} theme · {language}</p>
        </div>
      </Modal>
    </>
  );
}
