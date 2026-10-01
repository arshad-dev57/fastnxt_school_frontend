"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, CheckCircle2, School, Users, Layers } from "lucide-react";
import { Btn, Card, CardHead, Checkbox, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { CLASS_NAMES, SESSIONS } from "@/lib/mock-data";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState("2025-2026");
  const [teacher, setTeacher] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState("Active");
  const [sections, setSections] = useState<string[]>(["A"]);
  const [done, setDone] = useState(false);

  const back = (
    <Link href="/classes" className="flex h-9 w-9 items-center justify-center rounded text-[#676879] hover:bg-[#F5F6F8]" aria-label="Back">
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );

  return (
    <>
      <PageHeader title="New Class" subtitle="Create a class, assign sections and a class teacher." back={back}
        actions={<Btn variant="primary" Icon={Save} onClick={() => setDone(true)}>Save Class</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-3">
        <Card pad={false} className="lg:col-span-2">
          <CardHead title="Class information" subtitle="Basic details for the new class" Icon={School} />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Field label="Class Name" hint="e.g. Grade 5, Nursery, KG">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter class name" list="new-class-names" />
              <datalist id="new-class-names">{CLASS_NAMES.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Class Code"><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. G5" /></Field>
            <Field label="Academic Session"><Select options={SESSIONS} value={session} onChange={(e) => setSession(e.target.value)} /></Field>
            <Field label="Class Teacher"><Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Assign a teacher" /></Field>
            <Field label="Sections" className="sm:col-span-2" hint="Select all sections that belong to this class">
              <div className="flex flex-wrap gap-4">
                {["A", "B", "C", "D"].map((s) => (
                  <label key={s} className="flex items-center gap-2 text-[14px]">
                    <Checkbox checked={sections.includes(s)} onChange={(v) => setSections((p) => (v ? [...p, s] : p.filter((x) => x !== s)))} /> Section {s}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Description" className="sm:col-span-2"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional notes about this class" /></Field>
            <Field label="Status"><Select options={["Active", "Inactive"]} value={status} onChange={(e) => setStatus(e.target.value)} /></Field>
          </div>
        </Card>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Summary" Icon={Layers} />
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Class" value={name || "—"} />
              <Row label="Code" value={code || "—"} />
              <Row label="Session" value={session} />
              <Row label="Sections" value={sections.join(", ") || "—"} />
              <Row label="Class Teacher" value={teacher || "—"} />
              <Row label="Status" value={status} />
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><Users className="h-4 w-4" /></span>
              <p className="text-[13px] leading-relaxed text-[#676879]">
                After creating the class you can assign subjects from the <Link href="/subjects/assign" className="font-medium text-[#2563EB] hover:underline">Subjects</Link> module and add students from the <Link href="/students" className="font-medium text-[#2563EB] hover:underline">Students</Link> module.
              </p>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => setDone(true)}>Save Class</Btn>
            <Btn variant="secondary" onClick={() => router.push("/classes")}>Cancel</Btn>
          </div>
        </div>
      </div>

      <Modal open={done} onClose={() => { setDone(false); router.push("/classes"); }} title="Class created" width="max-w-md"
        footer={<>
          <Btn variant="secondary" onClick={() => { setDone(false); router.push("/classes"); }}>Close</Btn>
          <Btn variant="primary" onClick={() => { setDone(false); setName(""); setCode(""); setTeacher(""); }}>Add Another</Btn>
        </>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">{name || "New class"} has been created successfully.</p>
          <p className="text-[13px] text-[#676879]">Sections: {sections.join(", ") || "None"} · Session {session}</p>
        </div>
      </Modal>
    </>
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
