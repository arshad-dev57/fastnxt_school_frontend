"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ArrowRight, CalendarRange, Users, GraduationCap, CheckCircle2, RefreshCw } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, CardHead, Checkbox, Field, PageHeader, Select, cn, type IconType,
} from "@/components/ui";
import {
  classesApi,
  studentsApi,
  type ClassItem,
  type StudentItem,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const SESSIONS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

const STEPS: { n: number; label: string; Icon: IconType }[] = [
  { n: 1, label: "Current Placement", Icon: CalendarRange },
  { n: 2, label: "Select Students", Icon: Users },
  { n: 3, label: "New Placement", Icon: GraduationCap },
  { n: 4, label: "Confirm", Icon: CheckCircle2 },
];

export default function PromoteStudentsPage() {
  const { currentBranchId } = useBranch();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [curSession, setCurSession] = useState("2024-2025");
  const [curClass, setCurClass] = useState("");
  const [curSection, setCurSection] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [newSession, setNewSession] = useState("2025-2026");
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [classesRes, studentsRes] = await Promise.all([
        classesApi.list({ branchId: branchScope }),
        studentsApi.list({ branchId: branchScope }),
      ]);
      const loadedClasses = classesRes.classes || [];
      setClasses(loadedClasses);
      setStudents(studentsRes.students || []);

      if (loadedClasses.length > 0 && !curClass) {
        setCurClass(loadedClasses[0].name);
        setCurSection(loadedClasses[0].sections?.[0] || "A");
      }
    } catch (err) {
      console.error("Failed to load promotion data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, curClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classNames = classes.map((c) => c.name);

  const currentClassObj = classes.find((c) => c.name === curClass);
  const currentSections = currentClassObj?.sections?.length ? currentClassObj.sections : ["A", "B", "C", "D"];

  const newClassObj = classes.find((c) => c.name === newClass);
  const newSections = newClassObj?.sections?.length ? newClassObj.sections : ["A", "B", "C", "D"];

  const candidates = useMemo(() => students
    .filter((s) => !currentBranchId || currentBranchId === "all" || !s.branchId || s.branchId === currentBranchId)
    .filter((s) => (curClass ? s.cls === curClass : true))
    .filter((s) => (curSection ? s.section === curSection : true)),
  [students, currentBranchId, curClass, curSection]);

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const canNext = step === 1 ? !!(curClass && curSection) : step === 2 ? selected.length > 0 : step === 3 ? !!(newClass && newSection) : true;

  const handlePromote = async () => {
    if (!selected.length || !newClass || !newSection) return;
    try {
      setSubmitting(true);
      await studentsApi.promote({
        studentIds: selected,
        newSession,
        newClass,
        newSection,
      });
      setDone(true);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to promote students.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelected([]);
    setDone(false);
  };

  const selectedStudents = students.filter((s) => selected.includes(s.id));

  return (
    <>
      <PageHeader
        title="Promote Students"
        subtitle="Promote a batch of enrolled students to the next class and academic session."
        actions={
          <button
            type="button"
            onClick={loadData}
            title="Refresh"
            aria-label="Refresh"
            className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <Card>
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const active = step === s.n;
              const complete = step > s.n;
              return (
                <div key={s.n} className="flex min-w-0 flex-1 items-center gap-2">
                  <button onClick={() => s.n < step && setStep(s.n)} className="flex min-w-0 items-center gap-2 text-left">
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold",
                      complete ? "bg-[var(--theme-success)] text-white" : active ? "bg-[var(--theme-primary)] text-white" : "bg-[var(--theme-border)] text-[var(--theme-text-muted)]"
                    )}>
                      {complete ? <Check className="h-4 w-4" /> : s.n}
                    </span>
                    <span className={cn("hidden min-w-0 truncate text-[13px] sm:block", active ? "font-semibold text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]")}>
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded", complete ? "bg-[var(--theme-success)]" : "bg-[var(--theme-border)]")} />}
                </div>
              );
            })}
          </div>
        </Card>

        {step === 1 && (
          <Card pad={false}>
            <CardHead title="Current placement" subtitle="Select the session, class and section to promote from" Icon={CalendarRange} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="Current Academic Session">
                <Select options={SESSIONS} value={curSession} onChange={(e) => setCurSession(e.target.value)} />
              </Field>
              <Field label="Current Class">
                <Select
                  options={classNames.length ? classNames : ["No classes found"]}
                  value={curClass}
                  onChange={(e) => {
                    setCurClass(e.target.value);
                    const found = classes.find((c) => c.name === e.target.value);
                    setCurSection(found?.sections?.[0] || "A");
                    setSelected([]);
                  }}
                  placeholder="Select class"
                />
              </Field>
              <Field label="Current Section">
                <Select
                  options={currentSections}
                  value={curSection}
                  onChange={(e) => {
                    setCurSection(e.target.value);
                    setSelected([]);
                  }}
                  placeholder="Select section"
                />
              </Field>
            </div>
            {curClass && curSection && (
              <p className="px-4 pb-4 text-[13px] text-[var(--theme-text-muted)]">
                {candidates.length} student(s) currently found in {curClass}-{curSection}.
              </p>
            )}
          </Card>
        )}

        {step === 2 && (
          <Card pad={false}>
            <CardHead
              title="Select students"
              subtitle={`${selected.length} of ${candidates.length} selected`}
              Icon={Users}
              right={
                <Btn
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelected(selected.length === candidates.length ? [] : candidates.map((c) => c.id))}
                >
                  {selected.length === candidates.length && candidates.length > 0 ? "Clear all" : "Select all"}
                </Btn>
              }
            />
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map((s) => (
                <StudentPick key={s.id} s={s} checked={selected.includes(s.id)} onToggle={() => toggle(s.id)} />
              ))}
              {candidates.length === 0 && (
                <p className="col-span-full py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                  No students currently enrolled in {curClass}-{curSection}. Please select another class or add students first.
                </p>
              )}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card pad={false}>
            <CardHead title="New placement" subtitle="Choose the destination session, class and section" Icon={GraduationCap} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Field label="New Academic Session">
                <Select options={SESSIONS} value={newSession} onChange={(e) => setNewSession(e.target.value)} />
              </Field>
              <Field label="Destination Class *">
                <Select
                  options={classNames}
                  value={newClass}
                  onChange={(e) => {
                    setNewClass(e.target.value);
                    const found = classes.find((c) => c.name === e.target.value);
                    setNewSection(found?.sections?.[0] || "A");
                  }}
                  placeholder="Select destination class"
                />
              </Field>
              <Field label="Destination Section *">
                <Select options={newSections} value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Select section" />
              </Field>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card pad={false}>
            <CardHead title="Promotion summary" subtitle="Review student promotion details before confirming" Icon={CheckCircle2} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <Summary label="From" value={`${curClass} (Sec ${curSection})`} sub={`Session ${curSession}`} />
              <Summary label="To" value={`${newClass} (Sec ${newSection})`} sub={`Session ${newSession}`} />
              <Summary label="Students" value={`${selected.length}`} sub="selected for promotion" />
            </div>
            <div className="border-t border-[var(--theme-border)] p-4">
              <p className="mb-2 text-[13px] font-medium text-[var(--theme-text-muted)]">Selected students ({selectedStudents.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((s) => (
                  <Badge key={s.id} label={`${s.name} (${s.studentId})`} tone="blue" />
                ))}
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2">
          <Btn variant="secondary" Icon={ChevronLeft} onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || submitting}>
            Back
          </Btn>
          {step < 4 ? (
            <Btn variant="primary" IconRight={ChevronRight} onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={!canNext}>
              Next Step
            </Btn>
          ) : (
            <Btn variant="primary" Icon={ArrowRight} onClick={handlePromote} disabled={!canNext || submitting} loading={submitting} loadingLabel="Promoting…">
              Confirm &amp; Promote
            </Btn>
          )}
        </div>

        {done && (
          <Card className="border-[var(--theme-success-soft)] bg-[var(--theme-success-soft)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-success)] text-white">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[var(--theme-success-text)]">
                  {selected.length} student(s) successfully promoted!
                </p>
                <p className="text-[13px] text-[var(--theme-success-text)]">
                  Moved from {curClass}-{curSection} ({curSession}) to {newClass}-{newSection} ({newSession})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="secondary" Icon={RefreshCw} onClick={reset}>
                  Promote Another Batch
                </Btn>
                <Link
                  href="/students"
                  className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[13px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
                >
                  View All Students
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function StudentPick({ s, checked, onToggle }: { s: StudentItem; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        checked ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)]" : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
      )}
    >
      <Checkbox checked={checked} onChange={onToggle} />
      <Avatar name={s.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{s.name}</p>
        <p className="text-[12px] text-[var(--theme-text-muted)] font-mono">{s.studentId} · {s.cls}-{s.section}</p>
      </div>
    </button>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-4">
      <p className="text-[12px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="text-[18px] font-bold">{value}</p>
      <p className="text-[12px] text-[var(--theme-text-muted)]">{sub}</p>
    </div>
  );
}
