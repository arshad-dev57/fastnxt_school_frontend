"use client";

import { useState } from "react";
import { CheckCircle2, FileText, GraduationCap, Save, User, Users2 } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, type IconType,
} from "@/components/ui";
import { PORTAL_FORM_OPTIONS, PORTAL_STUDENT, type PortalStudentProfile } from "@/lib/portal-data";
import { simulateDelay } from "@/components/skeleton";

export default function StudentProfilePage() {
  const [form, setForm] = useState<PortalStudentProfile>(PORTAL_STUDENT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<PortalStudentProfile>) => setForm((f) => ({ ...f, ...patch }));
  const fullName = `${form.first} ${form.last}`.trim();

  const save = async () => { setSaving(true); await simulateDelay(); setSaving(false); setSaved(true); };

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Personal, academic and guardian details — exactly as recorded by the school office."
        actions={<Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">Save Changes</Btn>}
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Section icon={User} title="Personal Information" subtitle="Basic bio-data of the student">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name"><Input value={form.first} onChange={(e) => set({ first: e.target.value })} disabled /></Field>
              <Field label="Last Name"><Input value={form.last} onChange={(e) => set({ last: e.target.value })} disabled /></Field>
              <Field label="Gender"><Select options={PORTAL_FORM_OPTIONS.genders} value={form.gender} onChange={(e) => set({ gender: e.target.value })} disabled /></Field>
              <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={(e) => set({ dob: e.target.value })} disabled /></Field>
              <Field label="Blood Group"><Select options={PORTAL_FORM_OPTIONS.bloodGroups} value={form.blood} onChange={(e) => set({ blood: e.target.value })} disabled /></Field>
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName || "Student"} size={44} />
                  <div className="min-w-0 flex-1 truncate rounded border border-dashed border-[var(--theme-border-strong)] px-3 py-2.5 text-[13px] text-[var(--theme-text-muted)]">
                    {form.photo}
                  </div>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={GraduationCap} title="Academic Information" subtitle="Class placement and admission details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student ID"><Input value={form.studentId} onChange={(e) => set({ studentId: e.target.value })} disabled /></Field>
              <Field label="Admission Number"><Input value={form.admissionNo} onChange={(e) => set({ admissionNo: e.target.value })} disabled /></Field>
              <Field label="Admission Date"><Input type="date" value={form.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} disabled /></Field>
              <Field label="Academic Session"><Select options={PORTAL_FORM_OPTIONS.sessions} value={form.session} onChange={(e) => set({ session: e.target.value })} disabled /></Field>
              <Field label="Class"><Select options={PORTAL_FORM_OPTIONS.classes} value={form.cls} onChange={(e) => set({ cls: e.target.value })} disabled /></Field>
              <Field label="Section"><Select options={PORTAL_FORM_OPTIONS.sections} value={form.section} onChange={(e) => set({ section: e.target.value })} disabled /></Field>
            </div>
            <p className="mt-3 text-[12px] text-[var(--theme-text-faint)]">
              Academic records are maintained by the school office. Contact the front desk for any correction.
            </p>
          </Section>

          <Section icon={Users2} title="Parent / Guardian" subtitle="Contact and address information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Father Name"><Input value={form.father} onChange={(e) => set({ father: e.target.value })} /></Field>
              <Field label="Mother Name"><Input value={form.mother} onChange={(e) => set({ mother: e.target.value })} /></Field>
              <Field label="Guardian Name"><Input value={form.guardian} onChange={(e) => set({ guardian: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Email" className="sm:col-span-2"><Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="guardian@email.com" /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" /></Field>
            </div>
          </Section>

          <Section icon={FileText} title="Additional Information" subtitle="Optional background and medical notes">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Previous School"><Input value={form.prevSchool} onChange={(e) => set({ prevSchool: e.target.value })} /></Field>
              <Field label="Medical Information"><Textarea value={form.medical} onChange={(e) => set({ medical: e.target.value })} placeholder="Allergies, conditions, medication" /></Field>
              <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Any other remarks" /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          {/* Same "Student summary" card as the Admin Add Student page */}
          <Card pad={false}>
            <CardHead title="Student summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-4">
              <Avatar name={fullName || "Student"} size={64} />
              <p className="text-[16px] font-semibold">{fullName || "Student"}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">{form.cls}-{form.section} · {form.gender}</p>
              <Badge label={form.session} tone="blue" />
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Student ID" value={form.studentId || "—"} />
              <Row label="Admission No" value={form.admissionNo || "—"} />
              <Row label="Session" value={form.session} />
              <Row label="Guardian" value={form.guardian || form.father || "—"} />
              <Row label="Phone" value={form.phone || "—"} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="What you can edit" subtitle="Everything else is locked by the office" Icon={User} />
            <div className="space-y-2 p-4 text-[13px] text-[var(--theme-text-muted)]">
              {["Father Name", "Mother Name", "Guardian Name", "Phone", "Email", "Address", "Previous School", "Medical Information", "Notes"].map((f) => (
                <p key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-success)]" />
                  {f}
                </p>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">Save Changes</Btn>
          </div>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Profile updated" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">Your details have been saved.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">The school office has been notified of the update.</p>
        </div>
      </Modal>
    </>
  );
}

/** Section wrapper copied from the Admin Add Student / Add Employee pages. */
function Section({ icon, title, subtitle, children }: { icon: IconType; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card pad={false}>
      <CardHead title={title} subtitle={subtitle} Icon={icon} />
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
