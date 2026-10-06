"use client";

import { useState } from "react";
import { Briefcase, CheckCircle2, Save, User } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, type IconType,
} from "@/components/ui";
import { simulateDelay } from "@/components/skeleton";
import {
  PORTAL_TEACHER, TEACHER_META, teacherClasses, teacherTimetable,
  type PortalTeacherProfile,
} from "@/lib/portal-data";
import { DEPARTMENTS, DESIGNATIONS, EMPLOYMENT_TYPES, GENDERS } from "@/lib/mock-data";

/* ===========================================================================
   Teacher Profile — reuses the Admin "Add New Employee" form EXACTLY.

   Field names, sections and terminology come from
   app/(app)/employees/new/page.tsx (Personal / Employment). Employment fields
   are owned by HR/Admin so they render read-only; a teacher keeps control of
   their own contact details, exactly as a student does on their profile.
   ========================================================================== */

export default function TeacherProfilePage() {
  const [form, setForm] = useState<PortalTeacherProfile>(PORTAL_TEACHER);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<PortalTeacherProfile>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => { setSaving(true); await simulateDelay(); setSaving(false); setSaved(true); };
  const periods = teacherTimetable.length;

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Personal and employment details — exactly as recorded in the staff directory."
        actions={<Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">Save Changes</Btn>}
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Section icon={User} title="Personal" subtitle="Identity and contact details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} disabled /></Field>
              <Field label="Gender"><Select options={GENDERS} value={form.gender} onChange={(e) => set({ gender: e.target.value })} disabled /></Field>
              <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={(e) => set({ dob: e.target.value })} disabled /></Field>
              <Field label="CNIC / ID"><Input value={form.cnic} onChange={(e) => set({ cnic: e.target.value })} disabled /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Email" className="sm:col-span-2"><Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="employee@bisons.edu" /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" /></Field>
              <Field label="Photo" className="sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Avatar name={form.name} size={44} />
                  <div className="min-w-0 flex-1 truncate rounded border border-dashed border-[var(--theme-border-strong)] px-3 py-2.5 text-[13px] text-[var(--theme-text-muted)]">{form.photo}</div>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={Briefcase} title="Employment" subtitle="Role, department and joining details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee ID"><Input value={form.employeeId} onChange={(e) => set({ employeeId: e.target.value })} disabled /></Field>
              <Field label="Designation"><Select options={DESIGNATIONS} value={form.designation} onChange={(e) => set({ designation: e.target.value })} disabled /></Field>
              <Field label="Department"><Select options={DEPARTMENTS} value={form.department} onChange={(e) => set({ department: e.target.value })} disabled /></Field>
              <Field label="Joining Date"><Input type="date" value={form.joining} onChange={(e) => set({ joining: e.target.value })} disabled /></Field>
              <Field label="Employment Type"><Select options={EMPLOYMENT_TYPES} value={form.type} onChange={(e) => set({ type: e.target.value })} disabled /></Field>
              <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value })} disabled /></Field>
            </div>
            <p className="mt-3 text-[12px] text-[var(--theme-text-faint)]">
              Employment records are maintained by HR. Contact the administration office for any correction.
            </p>
          </Section>
        </div>

        <div className="space-y-5">
          {/* Same "Employee summary" card as the Admin Add Employee page */}
          <Card pad={false}>
            <CardHead title="Employee summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-4">
              <Avatar name={form.name} size={64} />
              <p className="text-[16px] font-semibold">{form.name}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">{form.designation} · {form.department}</p>
              <Badge label={form.status} tone={form.status === "Active" ? "green" : "gray"} />
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Employee ID" value={form.employeeId || "—"} />
              <Row label="Type" value={form.type} />
              <Row label="Joining" value={form.joining || "—"} />
              <Row label="Phone" value={form.phone || "—"} />
              <Row label="Campus" value={TEACHER_META.campus} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="My Teaching Load" subtitle="Derived from your Admin timetable" Icon={Briefcase} />
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Sections" value={String(teacherClasses.length)} />
              <Row label="Periods / week" value={String(periods)} />
              <Row label="Subjects" value={String(TEACHER_META.subjects.length)} />
              <div className="pt-1">
                <p className="mb-1.5 text-[12px] uppercase tracking-wide text-[var(--theme-text-faint)]">Sections</p>
                <div className="flex flex-wrap gap-1.5">
                  {teacherClasses.map((c) => <Badge key={c.label} label={c.label} tone="blue" />)}
                </div>
              </div>
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
          <p className="text-[13px] text-[var(--theme-text-muted)]">HR has been notified of the update.</p>
        </div>
      </Modal>
    </>
  );
}

/** Section wrapper copied from the Admin Add Employee page. */
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
