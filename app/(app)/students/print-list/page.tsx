"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Printer, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, CardHead, PageHeader, Select, cn } from "@/components/ui";
import {
  studentsApi,
  classesApi,
  schoolApi,
  type StudentItem,
  type ClassItem,
  type SchoolProfile,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

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

  const schoolName = school?.name || "School";
  const schoolAddress = school?.address || school?.city || "";
  const schoolPhone = school?.phone || "";
  const schoolEmail = school?.email || "";
  const session = school?.academicSession || "2025-2026";
  const printedOn = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Print Basic List"
          subtitle="Generate a printable student directory — formatted as an official school document."
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
              <Btn
                variant="primary"
                Icon={Printer}
                disabled={list.length === 0}
                onClick={() => {
                  void import("@/lib/print-element").then(({ printElement }) => {
                    const ok = printElement("[data-print-root='student-list']", {
                      title: "Student List",
                      pageCss: "@page { size: A4 portrait; margin: 12mm; }",
                    });
                    if (!ok) window.print();
                  });
                }}
              >
                Print List
              </Btn>
            </div>
          }
        />

        <div className="px-4 pb-6 sm:px-6">
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
                    No filters — {students.length} student(s)
                  </span>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                <input
                  type="checkbox"
                  checked={showMeta}
                  onChange={(e) => setShowMeta(e.target.checked)}
                  className="h-4 w-4 accent-[var(--theme-primary)]"
                />
                Include institution header
              </label>
            </div>
          </Card>
          <p className="mt-3 text-[13px] text-[var(--theme-text-muted)]">
            {list.length} student(s) will print. Use Print List (or Ctrl+P) for a clean A4 document / PDF.
          </p>
        </div>
      </div>

      <div className="px-4 pb-24 sm:px-6">
        <div
          data-print-root="student-list"
          className="print-area print-document mx-auto max-w-[210mm] bg-white p-8 text-black shadow-sm ring-1 ring-black/10 print:max-w-none print:p-0 print:shadow-none print:ring-0"
        >
          {showMeta && (
            <header className="mb-5 flex items-start justify-between gap-4 border-b-2 border-black pb-4">
              <div className="flex items-center gap-3">
                {school?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={school.logoUrl} alt="" className="h-14 w-14 object-contain" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded border-2 border-black text-[20px] font-extrabold">
                    {schoolName.charAt(0)}
                  </span>
                )}
                <div>
                  <h1 className="text-[20px] font-bold leading-tight tracking-tight">{schoolName}</h1>
                  {schoolAddress ? <p className="text-[11px] text-neutral-700">{schoolAddress}</p> : null}
                  <p className="text-[11px] text-neutral-700">
                    {[schoolPhone, schoolEmail].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-neutral-700">
                <p className="font-semibold uppercase tracking-wide text-black">Student Directory</p>
                <p>Printed: {printedOn}</p>
                <p>Session: {session}</p>
              </div>
            </header>
          )}

          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold">Student Basic List</h2>
              {activeFilters.length > 0 && (
                <p className="mt-0.5 text-[11px] text-neutral-600">Filters: {activeFilters.join(" · ")}</p>
              )}
            </div>
            <p className="text-[11px] text-neutral-600">Total: <strong className="text-black">{list.length}</strong></p>
          </div>

          {list.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">No students match the selected filters.</p>
          ) : (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-y-2 border-black bg-neutral-100 text-left">
                  <th className="px-2 py-2 font-semibold w-10">#</th>
                  <th className="px-2 py-2 font-semibold">Student ID</th>
                  <th className="px-2 py-2 font-semibold">Student Name</th>
                  <th className="px-2 py-2 font-semibold">Gender</th>
                  <th className="px-2 py-2 font-semibold">Class</th>
                  <th className="px-2 py-2 font-semibold">Sec</th>
                  <th className="px-2 py-2 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr key={s.id} className="border-b border-neutral-300">
                    <td className="px-2 py-1.5 text-neutral-600">{i + 1}</td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">{s.studentId}</td>
                    <td className="px-2 py-1.5 font-medium">{s.name}</td>
                    <td className="px-2 py-1.5">{s.gender || "—"}</td>
                    <td className="px-2 py-1.5">{s.cls}</td>
                    <td className="px-2 py-1.5">{s.section}</td>
                    <td className="px-2 py-1.5">{s.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <footer className="mt-8 flex items-end justify-between gap-6 border-t border-neutral-400 pt-6 text-[11px] text-neutral-600">
            <div>
              <div className="mb-8 h-px w-36 bg-black" />
              <p className="font-semibold text-black">Prepared by</p>
              <p>Administration Office</p>
            </div>
            <div className="text-right">
              <div className="mb-8 ml-auto h-px w-36 bg-black" />
              <p className="font-semibold text-black">Verified by</p>
              <p>{school?.principal || "Principal"}</p>
            </div>
          </footer>
          <p className="mt-6 text-center text-[10px] text-neutral-500">
            Computer-generated document · {schoolName} · BisonsEduCore360
          </p>
        </div>
      </div>
    </>
  );
}
