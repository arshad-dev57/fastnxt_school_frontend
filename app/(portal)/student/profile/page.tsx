"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, GraduationCap, Save, User, Users2 } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Textarea, type IconType,
} from "@/components/ui";
import { describeApiError, studentsApi, type StudentItem } from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

export default function StudentProfilePage() {
  const { student, loading, error, reload } = useMyStudent();
  const [form, setForm] = useState<Partial<StudentItem>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (student) setForm(student);
  }, [student]);

  const set = (patch: Partial<StudentItem>) => setForm((f) => ({ ...f, ...patch }));
  const fullName = form.name || "Student";
  const nameParts = fullName.trim().split(/\s+/);
  const first = nameParts[0] || "";
  const last = nameParts.slice(1).join(" ");

  const save = async () => {
    if (!student?.id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await studentsApi.updateMe({
        father: form.father,
        mother: form.mother,
        guardian: form.guardian,
        phone: form.phone,
        email: form.email,
        address: form.address,
        prevSchool: form.prevSchool,
        medical: form.medical,
        notes: form.notes,
      });
      await reload();
      setSaved(true);
    } catch (err) {
      setSaveError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !student) {
    return (
      <div className="px-4 py-16 text-center text-[14px] text-[var(--theme-text-muted)] sm:px-6">
        Loading your profile…
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className="text-[15px] font-medium text-[var(--theme-danger)]">{error}</p>
        <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">
          Ask the office to link your login email to a student record.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Personal, academic and guardian details — as recorded by the school office."
        actions={
          <Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">
            Save Changes
          </Btn>
        }
      />

      {saveError ? (
        <p className="px-4 text-[13px] text-[var(--theme-danger)] sm:px-6">{saveError}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Section icon={User} title="Personal Information" subtitle="Basic bio-data of the student">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name"><Input value={first} disabled /></Field>
              <Field label="Last Name"><Input value={last} disabled /></Field>
              <Field label="Gender"><Input value={form.gender || ""} disabled /></Field>
              <Field label="Date of Birth"><Input type="date" value={form.dob || ""} disabled /></Field>
              <Field label="Blood Group"><Input value={form.blood || ""} disabled /></Field>
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName} src={form.photo} size={44} />
                  <div className="min-w-0 flex-1 truncate rounded border border-dashed border-[var(--theme-border-strong)] px-3 py-2.5 text-[13px] text-[var(--theme-text-muted)]">
                    {form.photo ? "Photo on file" : "No photo uploaded"}
                  </div>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={GraduationCap} title="Academic Information" subtitle="Class placement and admission details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student ID"><Input value={form.studentId || ""} disabled /></Field>
              <Field label="Admission Number"><Input value={form.admissionNo || ""} disabled /></Field>
              <Field label="Admission Date"><Input type="date" value={form.admissionDate || ""} disabled /></Field>
              <Field label="Academic Session"><Input value={form.session || ""} disabled /></Field>
              <Field label="Class"><Input value={form.cls || ""} disabled /></Field>
              <Field label="Section"><Input value={form.section || ""} disabled /></Field>
            </div>
            <p className="mt-3 text-[12px] text-[var(--theme-text-faint)]">
              Academic records are maintained by the school office. Contact the front desk for any correction.
            </p>
          </Section>

          <Section icon={Users2} title="Parent / Guardian" subtitle="Contact and address information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Father Name"><Input value={form.father || ""} onChange={(e) => set({ father: e.target.value })} /></Field>
              <Field label="Mother Name"><Input value={form.mother || ""} onChange={(e) => set({ mother: e.target.value })} /></Field>
              <Field label="Guardian Name"><Input value={form.guardian || ""} onChange={(e) => set({ guardian: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone || ""} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Email" className="sm:col-span-2">
                <Input type="email" value={form.email || ""} onChange={(e) => set({ email: e.target.value })} placeholder="student@email.com" />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea value={form.address || ""} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" />
              </Field>
            </div>
          </Section>

          <Section icon={FileText} title="Additional Information" subtitle="Optional background and medical notes">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Previous School"><Input value={form.prevSchool || ""} onChange={(e) => set({ prevSchool: e.target.value })} /></Field>
              <Field label="Medical Information">
                <Textarea value={form.medical || ""} onChange={(e) => set({ medical: e.target.value })} placeholder="Allergies, conditions, medication" />
              </Field>
              <Field label="Notes">
                <Textarea value={form.notes || ""} onChange={(e) => set({ notes: e.target.value })} placeholder="Any other remarks" />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Student summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-4">
              <Avatar name={fullName} src={form.photo} size={64} />
              <p className="text-[16px] font-semibold">{fullName}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">{form.cls}-{form.section} · {form.gender}</p>
              <Badge label={form.session || "—"} tone="blue" />
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Student ID" value={form.studentId || "—"} />
              <Row label="Admission No" value={form.admissionNo || "—"} />
              <Row label="Session" value={form.session || "—"} />
              <Row label="Guardian" value={form.guardian || form.father || "—"} />
              <Row label="Phone" value={form.phone || "—"} />
            </div>
          </Card>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Profile updated" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--theme-success)]" />
          <p className="text-[14px] text-[var(--theme-text-muted)]">Your contact details were saved successfully.</p>
        </div>
      </Modal>
    </>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: IconType; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card pad={false}>
      <CardHead title={title} subtitle={subtitle} Icon={Icon} />
      <div className="p-4">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--theme-text-muted)]">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
