"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, CheckCircle2, User, Briefcase, ImagePlus } from "lucide-react";
import { Avatar, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, type IconType } from "@/components/ui";
import { DESIGNATIONS, DEPARTMENTS, EMPLOYMENT_TYPES, GENDERS } from "@/lib/mock-data";

export default function AddEmployeePage() {
  const router = useRouter();
  const [f, setF] = useState({
    name: "", gender: "Male", dob: "", cnic: "", phone: "", email: "", address: "", photo: "",
    employeeId: "", designation: DESIGNATIONS[0], department: DEPARTMENTS[0], joining: "", type: "Permanent", status: "Active",
  });
  const [done, setDone] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));
  const back = <Link href="/employees" className="flex h-9 w-9 items-center justify-center rounded text-[#676879] hover:bg-[#F5F6F8]" aria-label="Back"><ChevronLeft className="h-5 w-5" /></Link>;

  return (
    <>
      <PageHeader title="Add New Employee" subtitle="Register a new staff member with personal and employment details." back={back}
        actions={<Btn variant="primary" Icon={Save} onClick={() => setDone(true)}>Save Employee</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Section icon={User} title="Personal" subtitle="Identity and contact of the employee">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Employee full name" /></Field>
              <Field label="Gender"><Select options={GENDERS} value={f.gender} onChange={(e) => set({ gender: e.target.value })} /></Field>
              <Field label="Date of Birth"><Input type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} /></Field>
              <Field label="CNIC / ID"><Input value={f.cnic} onChange={(e) => set({ cnic: e.target.value })} placeholder="35202-XXXXXXX-X" /></Field>
              <Field label="Phone"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Email" className="sm:col-span-2"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="employee@bisons.edu" /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" /></Field>
              <Field label="Photo" className="sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Avatar name={f.name || "New Employee"} size={44} />
                  <label className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-[#C5C7D0] px-3 text-[13px] text-[#676879] hover:bg-[#F5F6F8]">
                    <ImagePlus className="h-4 w-4" /> {f.photo ? f.photo : "Upload photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => set({ photo: e.target.files?.[0]?.name ?? "" })} />
                  </label>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={Briefcase} title="Employment" subtitle="Role, department and joining details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee ID"><Input value={f.employeeId} onChange={(e) => set({ employeeId: e.target.value })} placeholder="EMP-XXX" /></Field>
              <Field label="Designation"><Select options={DESIGNATIONS} value={f.designation} onChange={(e) => set({ designation: e.target.value })} /></Field>
              <Field label="Department"><Select options={DEPARTMENTS} value={f.department} onChange={(e) => set({ department: e.target.value })} /></Field>
              <Field label="Joining Date"><Input type="date" value={f.joining} onChange={(e) => set({ joining: e.target.value })} /></Field>
              <Field label="Employment Type"><Select options={EMPLOYMENT_TYPES} value={f.type} onChange={(e) => set({ type: e.target.value })} /></Field>
              <Field label="Status"><Select options={["Active", "Inactive"]} value={f.status} onChange={(e) => set({ status: e.target.value })} /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Employee summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[#E6E9EF] p-4">
              <Avatar name={f.name || "New Employee"} size={64} />
              <p className="text-[16px] font-semibold">{f.name || "New Employee"}</p>
              <p className="text-[13px] text-[#676879]">{f.designation} · {f.department}</p>
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Employee ID" value={f.employeeId || "—"} />
              <Row label="Type" value={f.type} />
              <Row label="Joining" value={f.joining || "—"} />
              <Row label="Phone" value={f.phone || "—"} />
              <Row label="Status" value={f.status} />
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => setDone(true)}>Save Employee</Btn>
            <Btn variant="secondary" onClick={() => router.push("/employees")}>Cancel</Btn>
          </div>
        </div>
      </div>

      <Modal open={done} onClose={() => { setDone(false); router.push("/employees"); }} title="Employee added" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => { setDone(false); router.push("/employees"); }}>Close</Btn>
          <Btn variant="primary" onClick={() => { setDone(false); setF((p) => ({ ...p, name: "", cnic: "", phone: "", email: "", address: "", employeeId: "", joining: "", photo: "" })); }}>Add Another</Btn></>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">{f.name || "New employee"} has been added successfully.</p>
          <p className="text-[13px] text-[#676879]">{f.designation} · {f.department}</p>
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
