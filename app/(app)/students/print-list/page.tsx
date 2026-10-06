"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Printer, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, CardHead, PageHeader, Select, Th, Td, cn } from "@/components/ui";
import {
  studentsApi,
  classesApi,
  schoolApi,
  type StudentItem,
  type ClassItem,
  type SchoolProfile,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const COLS = "grid-cols-[50px_120px_minmax(160px,1.4fr)_80px_100px_70px_130px]";
const GENDERS = ["Male", "Female"];

export default function PrintBasicListPage() {
  const { currentBranchId } = useBranch();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [showMeta, setShowMeta] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [studentsRes, classesRes, schoolRes] = await Promise.all([
        studentsApi.list({ branchId: branchScope }),
        classesApi.list({ branchId: branchScope }),
        schoolApi.getProfile().catch(() => null),
      ]);
      setStudents(studentsRes.students || []);
      setClasses(classesRes.classes || []);
      if (schoolRes?.school) setSchool(schoolRes.school);
    } catch (err) {
      console.error("Failed to load students for print list:", err);
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
    .filter((s) => (cls ? s.cls === cls : true))
    .filter((s) => (section ? s.section === section : true))
    .filter((s) => (gender ? s.gender === gender : true))
    .filter((s) => (status ? s.status === status : true)),
  [students, currentBranchId, cls, section, gender, status]);

  const activeFilters = [
    cls && `Class: ${cls}`,
    section && `Section: ${section}`,
    gender && `Gender: ${gender}`,
    status && `Status: ${status}`,
  ].filter(Boolean) as string[];

  const schoolName = school?.name || "BisonsEduCore360 Academy";
  const schoolAddress = school?.address || "Main Campus, Education City";
  const schoolPhone = school?.phone || "0300-1234567";
  const schoolEmail = school?.email || "info@bisonseducore.edu";

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Print Basic List"
          subtitle="Generate a printable student list filtered by class, section, gender and status."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                title="Refresh"
                aria-label="Refresh student list"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Btn variant="primary" Icon={Printer} onClick={() => window.print()} disabled={list.length === 0}>
                Print List
              </Btn>
            </div>
          }
        />

        <div className="px-4 pb-24 sm:px-6">
          <Card pad={false}>
            <CardHead title="Filters" subtitle="Choose the criteria for the printed list" Icon={SlidersHorizontal} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={cls}
                onChange={(e) => {
                  setCls(e.target.value);
                  setSection("");
                }}
                options={["", ...classNames]}
                placeholder="All Classes"
              />
              <Select value={section} onChange={(e) => setSection(e.target.value)} options={["", ...availableSections]} placeholder="All Sections" />
              <Select value={gender} onChange={(e) => setGender(e.target.value)} options={["", ...GENDERS]} placeholder="All Genders" />
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["", "Active", "Inactive"]} placeholder="All Status" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.length ? (
                  activeFilters.map((f) => <Badge key={f} label={f} tone="blue" />)
                ) : (
                  <span className="text-[13px] text-[var(--theme-text-faint)]">
                    No filters applied — showing all {students.length} student(s)
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMeta}
                  onChange={(e) => setShowMeta(e.target.checked)}
                  className="h-4 w-4 accent-[var(--theme-primary)]"
                />
                Include institution header &amp; filters
              </label>
            </div>
          </Card>

          <p className="mt-4 text-[13px] text-[var(--theme-text-muted)]">
            {list.length} student(s) match the current filters. Use &ldquo;Print List&rdquo; to print or save as PDF.
          </p>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT */}
      <div className="px-4 pb-24 sm:px-6">
        <div className="print-area mx-auto max-w-[900px] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
          {showMeta && (
            <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[var(--theme-primary)] pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-[22px] font-extrabold text-white">
                  {schoolName.charAt(0)}
                </span>
                <div>
                  <h1 className="text-[19px] font-bold leading-tight">{schoolName}</h1>
                  <p className="text-[12px] text-[var(--theme-text-muted)]">{schoolAddress}</p>
                  <p className="text-[12px] text-[var(--theme-text-muted)]">{schoolPhone} · {schoolEmail}</p>
                </div>
              </div>
              <div className="text-right text-[12px] text-[var(--theme-text-muted)]">
                <p>Printed Date</p>
                <p className="font-semibold text-[var(--theme-text)]">{new Date().toISOString().slice(0, 10)}</p>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Student Basic Directory List</h2>
            <span className="text-[12px] text-[var(--theme-text-muted)]">Academic Session 2025-2026</span>
          </div>
          {showMeta && activeFilters.length > 0 && (
            <p className="mb-3 text-[12px] text-[var(--theme-text-muted)]">Active Criteria — {activeFilters.join(" · ")}</p>
          )}

          {list.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
              No students match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className={cn("grid", COLS, "border-y border-[var(--theme-border)] bg-[var(--theme-sidebar)] font-medium text-[13px]")}>
                <Th className="border-l border-[var(--theme-border)]">#</Th>
                <Th className="border-l border-[var(--theme-border)]">Student ID</Th>
                <Th className="border-l border-[var(--theme-border)]">Student Name</Th>
                <Th className="border-l border-[var(--theme-border)]">Gender</Th>
                <Th className="border-l border-[var(--theme-border)]">Class</Th>
                <Th className="border-l border-[var(--theme-border)]">Sec</Th>
                <Th className="border-l border-[var(--theme-border)]">Contact</Th>
              </div>
              {list.map((s, i) => (
                <div key={s.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] text-[13px] hover:bg-[var(--theme-hover)]")}>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{i + 1}</Td>
                  <Td className="border-l border-[var(--theme-border)] font-mono text-[12px] text-[var(--theme-text-muted)]">{s.studentId}</Td>
                  <Td className="border-l border-[var(--theme-border)] font-medium">{s.name}</Td>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{s.gender}</Td>
                  <Td className="border-l border-[var(--theme-border)]">{s.cls}</Td>
                  <Td className="border-l border-[var(--theme-border)]">
                    <Badge label={s.section} tone="gray" />
                  </Td>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{s.phone || '—'}</Td>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-[var(--theme-border)] pt-3 text-[11px] text-[var(--theme-text-faint)]">
            <span>Total Students: {list.length}</span>
            <span>Generated from BisonsEduCore360 Official Platform</span>
          </div>
        </div>
      </div>
    </>
  );
}
