"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ArrowRight, CalendarRange, Users, GraduationCap, CheckCircle2, RefreshCw } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, CardHead, Checkbox, Field, PageHeader, Select, cn, type IconType,
} from "@/components/ui";
import { STUDENT_ROWS, CLASS_NAMES, SECTIONS, SESSIONS, type StudentRow } from "@/lib/mock-data";

const STEPS: { n: number; label: string; Icon: IconType }[] = [
  { n: 1, label: "Current Placement", Icon: CalendarRange },
  { n: 2, label: "Select Students", Icon: Users },
  { n: 3, label: "New Placement", Icon: GraduationCap },
  { n: 4, label: "Confirm", Icon: CheckCircle2 },
];

export default function PromoteStudentsPage() {
  const [step, setStep] = useState(1);
  const [curSession, setCurSession] = useState("2024-2025");
  const [curClass, setCurClass] = useState("");
  const [curSection, setCurSection] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [newSession, setNewSession] = useState("2025-2026");
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [done, setDone] = useState(false);

  const candidates = useMemo(() => STUDENT_ROWS
    .filter((s) => (curClass ? s.cls === curClass : true))
    .filter((s) => (curSection ? s.section === curSection : true)),
  [curClass, curSection]);

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const canNext = step === 1 ? !!(curClass && curSection) : step === 2 ? selected.length > 0 : step === 3 ? !!(newClass && newSection) : true;

  const reset = () => { setStep(1); setSelected([]); setDone(false); setCurClass(""); setCurSection(""); setNewClass(""); setNewSection(""); };

  return (
    <>
      <PageHeader title="Promote Students" subtitle="Promote a batch of students to the next class and academic session." />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <Card>
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const active = step === s.n;
              const complete = step > s.n;
              return (
                <div key={s.n} className="flex min-w-0 flex-1 items-center gap-2">
                  <button onClick={() => s.n < step && setStep(s.n)} className="flex min-w-0 items-center gap-2 text-left">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold",
                      complete ? "bg-[#00C875] text-white" : active ? "bg-[#2563EB] text-white" : "bg-[#E6E9EF] text-[#676879]")}>
                      {complete ? <Check className="h-4 w-4" /> : s.n}
                    </span>
                    <span className={cn("hidden min-w-0 truncate text-[13px] sm:block", active ? "font-semibold text-[#323338]" : "text-[#676879]")}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded", complete ? "bg-[#00C875]" : "bg-[#E6E9EF]")} />}
                </div>
              );
            })}
          </div>
        </Card>

        {step === 1 && (
          <Card pad={false}>
            <CardHead title="Current placement" subtitle="Select the session, class and section to promote from" Icon={CalendarRange} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="Current Session"><Select options={SESSIONS} value={curSession} onChange={(e) => setCurSession(e.target.value)} /></Field>
              <Field label="Current Class"><Select options={CLASS_NAMES} value={curClass} onChange={(e) => { setCurClass(e.target.value); setSelected([]); }} placeholder="Select class" /></Field>
              <Field label="Current Section"><Select options={SECTIONS} value={curSection} onChange={(e) => { setCurSection(e.target.value); setSelected([]); }} placeholder="Select section" /></Field>
            </div>
            {curClass && curSection && <p className="px-4 pb-4 text-[13px] text-[#676879]">{candidates.length} student(s) found in {curClass}-{curSection}.</p>}
          </Card>
        )}

        {step === 2 && (
          <Card pad={false}>
            <CardHead title="Select students" subtitle={`${selected.length} of ${candidates.length} selected`} Icon={Users}
              right={<Btn size="sm" variant="secondary" onClick={() => setSelected(selected.length === candidates.length ? [] : candidates.map((c) => c.id))}>{selected.length === candidates.length ? "Clear all" : "Select all"}</Btn>} />
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map((s) => <StudentPick key={s.id} s={s} checked={selected.includes(s.id)} onToggle={() => toggle(s.id)} />)}
              {candidates.length === 0 && <p className="col-span-full py-6 text-center text-[14px] text-[#676879]">No students in the selected class &amp; section.</p>}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card pad={false}>
            <CardHead title="New placement" subtitle="Choose the destination session, class and section" Icon={GraduationCap} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="New Session"><Select options={SESSIONS} value={newSession} onChange={(e) => setNewSession(e.target.value)} /></Field>
              <Field label="New Class"><Select options={CLASS_NAMES} value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="Select class" /></Field>
              <Field label="New Section"><Select options={SECTIONS} value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Select section" /></Field>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card pad={false}>
            <CardHead title="Promotion summary" subtitle="Review before confirming" Icon={CheckCircle2} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Summary label="From" value={`${curClass}-${curSection}`} sub={curSession} />
              <Summary label="To" value={`${newClass}-${newSection}`} sub={newSession} />
              <Summary label="Students" value={`${selected.length}`} sub="selected for promotion" />
            </div>
            <div className="border-t border-[#E6E9EF] p-4">
              <p className="mb-2 text-[13px] font-medium text-[#676879]">Students to promote</p>
              <div className="flex flex-wrap gap-2">
                {STUDENT_ROWS.filter((s) => selected.includes(s.id)).map((s) => <Badge key={s.id} label={s.name} tone="blue" />)}
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2">
          <Btn variant="secondary" Icon={ChevronLeft} onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>Back</Btn>
          {step < 4
            ? <Btn variant="primary" IconRight={ChevronRight} onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={!canNext}>Next</Btn>
            : <Btn variant="primary" Icon={ArrowRight} onClick={() => setDone(true)} disabled={!canNext}>Confirm Promotion</Btn>}
        </div>

        {done && (
          <Card className="border-[#D6F5E3] bg-[#F1FBF5]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00C875] text-white"><CheckCircle2 className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#037F4C]">{selected.length} student(s) promoted successfully</p>
                <p className="text-[13px] text-[#037F4C]">Moved from {curClass}-{curSection} ({curSession}) to {newClass}-{newSection} ({newSession})</p>
              </div>
              <Btn variant="secondary" Icon={RefreshCw} onClick={reset}>Start New</Btn>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function StudentPick({ s, checked, onToggle }: { s: StudentRow; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} type="button"
      className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        checked ? "border-[#2563EB] bg-[#EAF4FF]" : "border-[#E6E9EF] hover:bg-[#F5F6F8]")}>
      <Checkbox checked={checked} onChange={onToggle} />
      <Avatar name={s.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{s.name}</p>
        <p className="text-[12px] text-[#676879]">{s.id} · {s.cls}-{s.section}</p>
      </div>
    </button>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-[#E6E9EF] bg-[#F6F7FB] p-4">
      <p className="text-[12px] uppercase tracking-wide text-[#9699A6]">{label}</p>
      <p className="text-[18px] font-bold">{value}</p>
      <p className="text-[12px] text-[#676879]">{sub}</p>
    </div>
  );
}
