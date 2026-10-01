"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, CheckCircle2, User, GraduationCap, Users2, FileText, ImagePlus } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, Avatar, type IconType } from "@/components/ui";
import { CLASS_NAMES, SECTIONS, GENDERS, BLOOD_GROUPS, SESSIONS } from "@/lib/mock-data";

export default function AddStudentPage() {
  const router = useRouter();
  const [f, setF] = useState({
    first: "", last: "", gender: "Male", dob: "", blood: "", photo: "",
    studentId: "", admissionNo: "", admissionDate: "", session: "2025-2026", cls: "Grade 1", section: "A",
    father: "", mother: "", guardian: "", phone: "", email: "", address: "",
    prevSchool: "", medical: "", notes: "",
  });
  const [done, setDone] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));
  const fullName = `${f.first} ${f.last}`.trim();

  const back = <Link href="/students" className="flex h-9 w-9 items-center justify-center rounded text-[#676879] hover:bg-[#F5F6F8]" aria-label="Back"><ChevronLeft className="h-5 w-5" /></Link>;

  return (
    <>
      <PageHeader title="Add New Student" subtitle="Register a new student with personal, academic and guardian details." back={back}
        actions={<Btn variant="primary" Icon={Save} onClick={() => setDone(true)}>Save Student</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Section icon={User} title="Personal Information" subtitle="Basic bio-data of the student">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name"><Input value={f.first} onChange={(e) => set({ first: e.target.value })} placeholder="First name" /></Field>
              <Field label="Last Name"><Input value={f.last} onChange={(e) => set({ last: e.target.value })} placeholder="Last name" /></Field>
              <Field label="Gender"><Select options={GENDERS} value={f.gender} onChange={(e) => set({ gender: e.target.value })} /></Field>
              <Field label="Date of Birth"><Input type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} /></Field>
              <Field label="Blood Group"><Select options={BLOOD_GROUPS} value={f.blood} onChange={(e) => set({ blood: e.target.value })} placeholder="Select blood group" /></Field>
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName || "New Student"} size={44} />
                  <label className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-[#C5C7D0] px-3 text-[13px] text-[#676879] hover:bg-[#F5F6F8]">
                    <ImagePlus className="h-4 w-4" /> {f.photo ? f.photo : "Upload photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => set({ photo: e.target.files?.[0]?.name ?? "" })} />
                  </label>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={GraduationCap} title="Academic Information" subtitle="Class placement and admission details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student ID"><Input value={f.studentId} onChange={(e) => set({ studentId: e.target.value })} placeholder="Auto / manual" /></Field>
              <Field label="Admission Number"><Input value={f.admissionNo} onChange={(e) => set({ admissionNo: e.target.value })} placeholder="ADM-2026-XXXX" /></Field>
              <Field label="Admission Date"><Input type="date" value={f.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} /></Field>
              <Field label="Academic Session"><Select options={SESSIONS} value={f.session} onChange={(e) => set({ session: e.target.value })} /></Field>
              <Field label="Class"><Select options={CLASS_NAMES} value={f.cls} onChange={(e) => set({ cls: e.target.value })} /></Field>
              <Field label="Section"><Select options={SECTIONS} value={f.section} onChange={(e) => set({ section: e.target.value })} /></Field>
            </div>
          </Section>

          <Section icon={Users2} title="Parent / Guardian" subtitle="Contact and address information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Father Name"><Input value={f.father} onChange={(e) => set({ father: e.target.value })} /></Field>
              <Field label="Mother Name"><Input value={f.mother} onChange={(e) => set({ mother: e.target.value })} /></Field>
              <Field label="Guardian Name"><Input value={f.guardian} onChange={(e) => set({ guardian: e.target.value })} /></Field>
              <Field label="Phone"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Email" className="sm:col-span-2"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="guardian@email.com" /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" /></Field>
            </div>
          </Section>

          <Section icon={FileText} title="Additional Information" subtitle="Optional background and medical notes">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Previous School"><Input value={f.prevSchool} onChange={(e) => set({ prevSchool: e.target.value })} /></Field>
              <Field label="Medical Information"><Textarea value={f.medical} onChange={(e) => set({ medical: e.target.value })} placeholder="Allergies, conditions, medication" /></Field>
              <Field label="Notes"><Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Any other remarks" /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Student summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[#E6E9EF] p-4">
              <Avatar name={fullName || "New Student"} size={64} />
              <p className="text-[16px] font-semibold">{fullName || "New Student"}</p>
              <p className="text-[13px] text-[#676879]">{f.cls}-{f.section} · {f.gender}</p>
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Student ID" value={f.studentId || "—"} />
              <Row label="Admission No" value={f.admissionNo || "—"} />
              <Row label="Session" value={f.session} />
              <Row label="Guardian" value={f.guardian || f.father || "—"} />
              <Row label="Phone" value={f.phone || "—"} />
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => setDone(true)}>Save Student</Btn>
            <Btn variant="secondary" onClick={() => router.push("/students")}>Cancel</Btn>
          </div>
        </div>
      </div>

      <Modal open={done} onClose={() => { setDone(false); router.push("/students"); }} title="Student registered" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => { setDone(false); router.push("/students"); }}>Close</Btn>
          <Btn variant="primary" onClick={() => { setDone(false); setF((p) => ({ ...p, first: "", last: "", studentId: "", admissionNo: "", father: "", mother: "", guardian: "", phone: "", email: "", address: "", prevSchool: "", medical: "", notes: "" })); }}>Add Another</Btn></>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">{fullName || "New student"} has been added successfully.</p>
          <p className="text-[13px] text-[#676879]">Placed in {f.cls}-{f.section} for {f.session}</p>
        </div>
      </Modal>
    </>
  );
}

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
      <span className="text-[#676879]">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
