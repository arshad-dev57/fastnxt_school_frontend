"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, Save } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { OfficialLetterDocument } from "@/components/letters/official-letter";
import {
  DEFAULT_ADMISSION_LETTER_TEMPLATE,
  describeApiError,
  lettersApi,
  type LetterSchoolInfo,
  type LetterTemplate,
} from "@/lib/auth/api-client";

export default function AdmissionLetterSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [school, setSchool] = useState<LetterSchoolInfo | null>(null);
  const [form, setForm] = useState<LetterTemplate>(DEFAULT_ADMISSION_LETTER_TEMPLATE);

  const set = (patch: Partial<LetterTemplate>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  useEffect(() => {
    lettersApi
      .getAdmissionTemplate()
      .then((res) => {
        setForm({ ...DEFAULT_ADMISSION_LETTER_TEMPLATE, ...res.template });
        setSchool(res.school);
      })
      .catch((err) => setError(describeApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await lettersApi.updateAdmissionTemplate(form);
      setForm({ ...DEFAULT_ADMISSION_LETTER_TEMPLATE, ...res.template });
      setSchool(res.school);
      setSaved(true);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--theme-text-muted)]" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Admission Letter Layout"
        subtitle="Customize the admission letter wording, signatures and branding. Placeholders: {studentName}, {schoolName}, {classSection}."
        actions={
          <Btn variant="primary" Icon={Save} loading={saving} loadingLabel="Saving…" onClick={save}>
            {saved ? "Saved" : "Save Layout"}
          </Btn>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 lg:grid-cols-2 lg:px-6">
        <div className="space-y-4">
          {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
          <Card pad={false}>
            <CardHead title="Letter content" Icon={FileText} />
            <div className="grid gap-3 p-4">
              <Field label="Title"><Input value={form.title} onChange={(e) => set({ title: e.target.value })} /></Field>
              <Field label="Salutation"><Input value={form.salutation} onChange={(e) => set({ salutation: e.target.value })} /></Field>
              <Field label="Intro paragraph">
                <Textarea rows={3} value={form.bodyIntro} onChange={(e) => set({ bodyIntro: e.target.value })} />
              </Field>
              <Field label="Closing paragraph">
                <Textarea rows={3} value={form.bodyClosing} onChange={(e) => set({ bodyClosing: e.target.value })} />
              </Field>
              <Field label="Sign-off"><Input value={form.signOff} onChange={(e) => set({ signOff: e.target.value })} /></Field>
              <Field label="Signer title"><Input value={form.signerTitle} onChange={(e) => set({ signerTitle: e.target.value })} /></Field>
              <Field label="Footer note"><Input value={form.footerNote} onChange={(e) => set({ footerNote: e.target.value })} /></Field>
              <Field label="Accent color"><Input type="color" value={form.accentColor || "#0f4c81"} onChange={(e) => set({ accentColor: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={form.showLogo} onChange={(e) => set({ showLogo: e.target.checked })} /> Show school logo
              </label>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={form.showRef} onChange={(e) => set({ showRef: e.target.checked })} /> Show Ref / Date
              </label>
            </div>
          </Card>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-[var(--theme-text-muted)]">Live preview</p>
          <div className="overflow-auto rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-3">
            <OfficialLetterDocument
              template={form}
              school={school}
              refNo="ADM-2026-0001"
              date={new Date().toISOString().slice(0, 10)}
              vars={{ studentName: "Sample Student", classSection: "Grade 5 (Section A)" }}
              detailRows={[
                ["Student Name", "Sample Student"],
                ["Class / Section", "Grade 5 - A"],
                ["Admission Number", "ADM-2026-0001"],
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
