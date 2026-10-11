"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Printer, IdCard, Check, Search, RefreshCw } from "lucide-react";
import { Avatar, Btn, Card, CardHead, Checkbox, EmptyState, PageHeader, SearchBox, Select, cn } from "@/components/ui";
import {
  studentsApi,
  classesApi,
  schoolApi,
  type StudentItem,
  type ClassItem,
  type SchoolProfile,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function StudentIdCardsPage() {
  const { currentBranchId } = useBranch();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [studentsRes, classesRes, schoolRes] = await Promise.all([
        studentsApi.list({ branchId: branchScope }),
        classesApi.list({ branchId: branchScope }),
        schoolApi.getProfile().catch(() => null),
      ]);
      const loadedStudents = studentsRes.students || [];
      setStudents(loadedStudents);
      setClasses(classesRes.classes || []);
      if (schoolRes?.school) setSchool(schoolRes.school);

      // Default select up to first 2 students
      if (loadedStudents.length > 0 && selected.length === 0) {
        setSelected(loadedStudents.slice(0, Math.min(2, loadedStudents.length)).map((s) => s.id));
      }
    } catch (err) {
      console.error("Failed to load students for ID cards:", err);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classNames = classes.map((c) => c.name);
  const currentClassObj = classes.find((c) => c.name === cls);
  const availableSections = currentClassObj?.sections?.length
    ? currentClassObj.sections
    : Array.from(new Set(students.map((s) => s.section).filter(Boolean))).sort();

  const list = useMemo(() => students
    .filter((s) => !currentBranchId || currentBranchId === "all" || !s.branchId || s.branchId === currentBranchId)
    .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.studentId.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => (cls ? s.cls === cls : true))
    .filter((s) => (section ? s.section === section : true)),
  [students, currentBranchId, q, cls, section]);

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const selectedStudents = students.filter((s) => selected.includes(s.id));

  const schoolName = school?.name || "BisonsEduCore360 Academy";
  const schoolShortName = school?.shortName || schoolName.split(" ")[0] || "ACADEMY";
  const schoolPhone = school?.phone || "0300-1234567";

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Student ID Cards"
          subtitle="Select enrolled students and print official school ID cards."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                title="Refresh"
                aria-label="Refresh"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Btn variant="primary" Icon={Printer} onClick={() => window.print()} disabled={selected.length === 0}>
                Print {selected.length ? `(${selected.length})` : ""}
              </Btn>
            </div>
          }
        />

        <div className="px-4 pb-24 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search students by name or ID" className="w-full sm:w-72" />
            <Select
              value={cls}
              onChange={(e) => {
                setCls(e.target.value);
                setSection("");
              }}
              options={["", ...classNames]}
              placeholder="All Classes"
              className="w-36"
            />
            <Select value={section} onChange={(e) => setSection(e.target.value)} options={["", ...availableSections]} placeholder="All Sections" className="w-32" />
          </div>

          <Card pad={false}>
            <CardHead
              title="Select students"
              subtitle={`${selected.length} of ${list.length} selected`}
              Icon={IdCard}
              right={
                <Btn
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelected(selected.length === list.length ? [] : list.map((s) => s.id))}
                >
                  {selected.length === list.length && list.length > 0 ? "Clear all" : "Select all"}
                </Btn>
              }
            />

            {loading && students.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--theme-primary)]" />
                Loading students…
              </div>
            ) : list.length === 0 ? (
              <EmptyState Icon={Search} title="No students found" message="Adjust the search or filters, or register students first." />
            ) : (
              <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected.includes(s.id)
                        ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)]"
                        : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
                    )}
                  >
                    <Checkbox checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                    <Avatar name={s.name} src={s.photo} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{s.name}</p>
                      <p className="text-[12px] text-[var(--theme-text-muted)] font-mono">
                        {s.studentId} · {s.cls}-{s.section}
                      </p>
                    </div>
                    {selected.includes(s.id) && <Check className="h-4 w-4 shrink-0 text-[var(--theme-primary)]" />}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="no-print px-4 sm:px-6">
        <h2 className="mb-2 text-[15px] font-semibold">
          Card preview {selectedStudents.length > 0 && <span className="text-[var(--theme-text-muted)]">({selectedStudents.length} cards)</span>}
        </h2>
      </div>

      <div className="px-4 pb-24 sm:px-6">
        <div className="print-area flex flex-wrap gap-4 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-4">
          {selectedStudents.map((s) => (
            <IdCardView
              key={s.id}
              s={s}
              schoolName={schoolName}
              schoolShortName={schoolShortName}
              schoolPhone={schoolPhone}
              schoolLogoUrl={school?.logoUrl || ""}
            />
          ))}
          {selectedStudents.length === 0 && (
            <p className="w-full py-10 text-center text-[14px] text-[var(--theme-text-muted)]">
              Select students above to preview and print their official ID cards.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function IdCardPhoto({ name, photo, initials }: { name: string; photo?: string; initials: string }) {
  const [broken, setBroken] = useState(false);
  const src = typeof photo === "string" ? photo.trim() : "";
  if (!src || broken) {
    return (
      <span className="flex h-[88px] w-[72px] shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[22px] font-bold text-neutral-500">
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="h-[88px] w-[72px] shrink-0 rounded-lg border border-black/10 object-cover print:block"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    />
  );
}

function IdCardView({
  s,
  schoolName,
  schoolShortName,
  schoolPhone,
  schoolLogoUrl,
}: {
  s: StudentItem;
  schoolName: string;
  schoolShortName: string;
  schoolPhone: string;
  schoolLogoUrl?: string;
}) {
  const initials = s.name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="print-break print-document w-[330px] max-w-full overflow-hidden rounded-xl bg-white text-black shadow-md ring-1 ring-black/10">
      <div className="flex items-center gap-2 bg-[#0f4c81] px-3 py-2.5 text-white">
        {schoolLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={schoolLogoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-[15px] font-extrabold">
            {schoolShortName.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight">{schoolName}</p>
          <p className="text-[10px] text-white/80">{s.session || "2025-2026"} · Student ID Card</p>
        </div>
      </div>
      <div className="flex gap-3 p-3">
        <IdCardPhoto name={s.name} photo={s.photo} initials={initials} />
        <div className="min-w-0 flex-1 space-y-1 text-[11px]">
          <p className="truncate text-[15px] font-bold leading-tight">{s.name}</p>
          <p className="text-neutral-600">
            <span className="font-medium text-black">ID:</span> <span className="font-mono">{s.studentId}</span>
          </p>
          <p className="text-neutral-600">
            <span className="font-medium text-black">Class:</span> {s.cls} (Sec {s.section})
          </p>
          <p className="text-neutral-600">
            <span className="font-medium text-black">Gender:</span> {s.gender || "Male"}
          </p>
          <p className="text-neutral-600">
            <span className="font-medium text-black">Contact:</span> {s.phone || s.guardian || "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-1.5 text-[9px] text-neutral-500">
        <span>{schoolPhone}</span>
        <span className="font-mono">ADM: {s.admissionDate || "—"}</span>
      </div>
    </div>
  );
}
