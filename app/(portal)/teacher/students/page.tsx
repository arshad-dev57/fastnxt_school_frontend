"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen, Download, GraduationCap, Loader2, Phone, RefreshCw,
  School, User, Users,
} from "lucide-react";
import { Avatar, Badge, Card, CardHead, PageHeader, Select, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  employeesApi,
  studentsApi,
  subjectsApi,
  type ClassItem,
  type EmployeeItem,
  type StudentItem,
  type SubjectAssignmentItem,
} from "@/lib/auth/api-client";

/* ============================================================================
   My Students — Teacher Portal
   ---------------------------------------------------------------------------
   Shows ONLY students enrolled in the classes/sections this teacher has been
   assigned to (either as subject teacher or class teacher).

   Flow:
   1. Resolve exact teacher name via employee record (by email)
   2. Fetch subject assignments filtered by teacher= server-side
   3. Fetch class teacher assignments (client-side exact match)
   4. Collect all assigned class-section pairs
   5. Fetch students, then filter to only those pairs
   ========================================================================== */

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const { currentBranchId, currentBranch } = useBranch();

  const [employee, setEmployee]       = useState<EmployeeItem | null>(null);
  const [assignments, setAssignments] = useState<SubjectAssignmentItem[]>([]);
  const [classes, setClasses]         = useState<ClassItem[]>([]);
  const [students, setStudents]       = useState<StudentItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Section filter UI
  const [sectionFilter, setSectionFilter] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const branchScope =
        currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      // Step 1 — resolve the exact stored employee name via email
      const empRes = await employeesApi.list({ q: user.email, branchId: branchScope });
      const emps: EmployeeItem[] = empRes.employees ?? [];
      const matched =
        emps.find((e) => e.email?.toLowerCase() === user.email.toLowerCase()) ||
        emps.find((e) => e.name?.toLowerCase() === (user.name || "").toLowerCase()) ||
        (emps.length > 0 ? emps[0] : null);
      setEmployee(matched ?? null);

      const teacherName = matched?.name || user.name || "";

      // Step 2 — fetch subject assignments with server-side teacher filter
      const [assignRes, clsRes, studentRes] = await Promise.all([
        subjectsApi.listAssignments({ teacher: teacherName, branchId: branchScope }),
        classesApi.list({ branchId: branchScope }),
        studentsApi.list({ branchId: branchScope }),
      ]);

      const allAssign: SubjectAssignmentItem[] = assignRes.assignments ?? [];
      setAssignments(allAssign);

      // Step 3 — filter classes where this teacher is class teacher (exact match)
      const allClasses: ClassItem[] = clsRes.classes ?? [];
      const nameLower = teacherName.toLowerCase();
      const myClasses = nameLower
        ? allClasses.filter((c) => (c.teacher || "").toLowerCase() === nameLower)
        : [];
      setClasses(myClasses);

      setStudents(studentRes.students ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [user, currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Collect all class-section pairs assigned to this teacher ── */
  const assignedPairs = useMemo(() => {
    const set = new Set<string>();

    // From subject assignments
    assignments.forEach((a) => {
      set.add(`${a.cls.toLowerCase()}||${a.section.toLowerCase()}`);
    });

    // From class teacher role
    classes.forEach((c) => {
      const sections: string[] = Array.isArray(c.sections) ? c.sections : ["A"];
      sections.forEach((s) => set.add(`${c.name.toLowerCase()}||${s.toLowerCase()}`));
    });

    return set;
  }, [assignments, classes]);

  /* ── Build the section labels for the filter dropdown ── */
  const sectionLabels = useMemo(() => {
    const seen = new Set<string>();
    const labels: string[] = [];
    assignments.forEach((a) => {
      const key = `${a.cls}-${a.section}`;
      if (!seen.has(key)) { seen.add(key); labels.push(key); }
    });
    classes.forEach((c) => {
      const secs: string[] = Array.isArray(c.sections) ? c.sections : ["A"];
      secs.forEach((s) => {
        const key = `${c.name}-${s}`;
        if (!seen.has(key)) { seen.add(key); labels.push(key); }
      });
    });
    return labels.sort();
  }, [assignments, classes]);

  /* ── My students = all students whose class-section is in assignedPairs ── */
  const myStudents = useMemo(() => {
    if (assignedPairs.size === 0) return [];
    return students.filter((s) =>
      assignedPairs.has(`${s.cls.toLowerCase()}||${s.section.toLowerCase()}`)
    );
  }, [students, assignedPairs]);

  /* ── Section-filtered view ── */
  const filteredStudents = useMemo(() => {
    if (!sectionFilter) return myStudents;
    const [filterCls, filterSec] = sectionFilter.split("-");
    return myStudents.filter(
      (s) =>
        s.cls.toLowerCase() === (filterCls || "").toLowerCase() &&
        s.section.toLowerCase() === (filterSec || "").toLowerCase()
    );
  }, [myStudents, sectionFilter]);

  /* ── Gender counts ── */
  const maleCount   = useMemo(() => filteredStudents.filter((s) => s.gender === "Male").length,   [filteredStudents]);
  const femaleCount = useMemo(() => filteredStudents.filter((s) => s.gender === "Female").length, [filteredStudents]);

  const teacherName = employee?.name || user?.name || "Teacher";
  const campusName  = currentBranch?.name || user?.branch?.name || "Main Campus";

  /* ── Subject sections summary ── */
  type SectionSummary = { cls: string; section: string; subjects: string[]; role: string };
  const sectionsSummary = useMemo(() => {
    const map = new Map<string, SectionSummary>();

    assignments.forEach((a) => {
      const key = `${a.cls}||${a.section}`;
      if (!map.has(key)) {
        map.set(key, { cls: a.cls, section: a.section, subjects: [], role: "Subject Teacher" });
      }
      const entry = map.get(key)!;
      if (!entry.subjects.includes(a.subject)) entry.subjects.push(a.subject);
    });

    classes.forEach((c) => {
      const secs: string[] = Array.isArray(c.sections) ? c.sections : ["A"];
      secs.forEach((s) => {
        const key = `${c.name}||${s}`;
        if (map.has(key)) {
          map.get(key)!.role = "Class Teacher";
        } else {
          map.set(key, { cls: c.name, section: s, subjects: [], role: "Class Teacher" });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.cls.localeCompare(b.cls) || a.section.localeCompare(b.section)
    );
  }, [assignments, classes]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="My Students"
        subtitle={`Students enrolled in ${teacherName}'s sections · ${campusName}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              className="flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
              onClick={() => {
                // Simple CSV export
                const rows = filteredStudents.map((s) =>
                  [s.studentId || s.admissionNo, s.name, s.cls, s.section, s.gender, s.father || "", s.phone || ""].join(",")
                );
                const csv = ["Student ID,Name,Class,Section,Gender,Father,Phone", ...rows].join("\n");
                const a = document.createElement("a");
                a.href = "data:text/csv," + encodeURIComponent(csv);
                a.download = `my-students-${teacherName.replace(/\s+/g, "-")}.csv`;
                a.click();
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard
          label="My Students"
          value={loading ? "…" : filteredStudents.length}
          Icon={Users}
          tone="blue"
          sub={sectionFilter ? `In ${sectionFilter}` : "Across all my sections"}
        />
        <StatCard
          label="Sections"
          value={sectionsSummary.length}
          Icon={School}
          tone="purple"
          sub="Class-sections assigned"
        />
        <StatCard
          label="Male"
          value={loading ? "…" : maleCount}
          Icon={User}
          tone="green"
          sub="Students"
        />
        <StatCard
          label="Female"
          value={loading ? "…" : femaleCount}
          Icon={User}
          tone="orange"
          sub="Students"
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-error-border)] bg-[var(--theme-error-soft)] px-4 py-3 text-[13px] text-[var(--theme-error-text)] sm:mx-6">
          {error}
        </div>
      )}

      {/* ── My Assigned Sections Summary cards ── */}
      {!loading && sectionsSummary.length > 0 && (
        <div className="px-4 pt-4 sm:px-6">
          <Card pad={false} className="mb-4">
            <CardHead
              title="My Assigned Sections"
              subtitle={`${sectionsSummary.length} section${sectionsSummary.length !== 1 ? "s" : ""} · click a section to filter students`}
              Icon={GraduationCap}
            />
            <div className="flex flex-wrap gap-2 p-4">
              <button
                onClick={() => setSectionFilter("")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  !sectionFilter
                    ? "bg-[var(--theme-primary)] text-white"
                    : "border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:bg-[var(--theme-hover)]"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                All ({myStudents.length})
              </button>
              {sectionsSummary.map((s) => {
                const key   = `${s.cls}-${s.section}`;
                const count = myStudents.filter(
                  (st) =>
                    st.cls.toLowerCase() === s.cls.toLowerCase() &&
                    st.section.toLowerCase() === s.section.toLowerCase()
                ).length;
                const isActive = sectionFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSectionFilter(isActive ? "" : key)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--theme-primary)] text-white"
                        : "border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:bg-[var(--theme-hover)]"
                    }`}
                  >
                    <School className="h-3.5 w-3.5" />
                    {key}
                    {s.subjects.length > 0 && (
                      <span className={`ml-1 ${isActive ? "text-white/80" : "text-[var(--theme-text-muted)]"}`}>
                        · {s.subjects.slice(0, 2).join(", ")}
                        {s.subjects.length > 2 ? "…" : ""}
                      </span>
                    )}
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]"
                      }`}
                    >
                      {count}
                    </span>
                    <Badge
                      label={s.role === "Class Teacher" ? "CT" : "ST"}
                      tone={s.role === "Class Teacher" ? "orange" : "blue"}
                    />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Section dropdown for small screens (hidden when cards are shown) ── */}
      {!loading && sectionsSummary.length > 0 && (
        <div className="hidden px-4 sm:px-6">
          <label className="inline-flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            Section
            <Select
              options={sectionLabels}
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              placeholder="All sections"
              className="w-48"
            />
          </label>
        </div>
      )}

      {/* ── Student Board ── */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-[14px] text-[var(--theme-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading students…
        </div>
      ) : (
        <div className="mt-1">
          <PortalBoard
            title={sectionFilter ? `Students in ${sectionFilter}` : "All My Students"}
            subtitle={
              filteredStudents.length > 0
                ? `${filteredStudents.length} student${filteredStudents.length !== 1 ? "s" : ""} in ${sectionFilter || "your assigned sections"}`
                : assignedPairs.size === 0
                ? "No sections have been assigned to you yet. Contact the admin."
                : `No students enrolled in ${sectionFilter || "your sections"} yet.`
            }
            Icon={Users}
            nameLabel="Student"
            rows={filteredStudents}
            keyOf={(r) => r.id}
            nameOf={(r) => r.name}
            subtitleOf={(r) =>
              `${r.cls} - Section ${r.section} · ${r.studentId || r.admissionNo}`
            }
            searchTextOf={(r) =>
              `${r.name} ${r.studentId} ${r.admissionNo} ${r.cls} ${r.section} ${r.father} ${r.guardian} ${r.phone}`
            }
            searchPlaceholder="Search by name, ID, class or guardian…"
            scopeLabel={sectionFilter || "All my sections"}
            countNoun="students"
            groupBy={(r) => `${r.cls} — Section ${r.section}`}
            groupColorOf={() => "var(--theme-primary)"}
            columns={[
              {
                key: "studentId",
                label: "Student ID",
                width: "130px",
                cell: (r) => r.studentId || r.admissionNo || "—",
              },
              {
                key: "name",
                label: "Student Name",
                width: "minmax(180px,1.3fr)",
                cell: (r) => (
                  <span className="flex items-center gap-2 font-medium">
                    <Avatar name={r.name} size={26} />
                    {r.name}
                  </span>
                ),
              },
              {
                key: "cls",
                label: "Class & Section",
                width: "140px",
                cell: (r) => `${r.cls} (${r.section})`,
              },
              {
                key: "gender",
                label: "Gender",
                width: "100px",
                cell: (r) => r.gender || "—",
              },
              {
                key: "father",
                label: "Father / Guardian",
                width: "minmax(150px,1fr)",
                cell: (r) => r.father || r.guardian || "—",
              },
              {
                key: "phone",
                label: "Phone",
                width: "150px",
                cell: (r) => (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />
                    {r.phone || r.contact || "—"}
                  </span>
                ),
              },
              {
                key: "admission",
                label: "Admission",
                width: "130px",
                cell: (r) => r.admissionDate || "—",
              },
              {
                key: "status",
                label: "Status",
                width: "100px",
                cell: (r) => (
                  <span
                    className={
                      r.status === "Active"
                        ? "font-medium text-[var(--theme-success-text)]"
                        : "text-[var(--theme-text-muted)]"
                    }
                  >
                    {r.status || "Active"}
                  </span>
                ),
              },
            ]}
            detailFields={(r) => [
              { label: "Student ID",     value: r.studentId || r.admissionNo || "—" },
              {
                label: "Name",
                value: (
                  <span className="flex items-center gap-2">
                    <Avatar name={r.name} size={24} />
                    {r.name}
                  </span>
                ),
              },
              { label: "Class",          value: `${r.cls} — Section ${r.section}` },
              { label: "Gender",         value: r.gender || "—" },
              { label: "Father Name",    value: r.father || "—" },
              { label: "Guardian",       value: r.guardian || "—" },
              { label: "Phone",          value: r.phone || r.contact || "—" },
              { label: "Blood Group",    value: r.blood || "—" },
              { label: "Admission Date", value: r.admissionDate || "—" },
              { label: "Session",        value: r.session || "—" },
              { label: "Status",         value: r.status || "Active" },
              {
                label: "My Subjects",
                value: assignments
                  .filter(
                    (a) =>
                      a.cls.toLowerCase() === r.cls.toLowerCase() &&
                      a.section.toLowerCase() === r.section.toLowerCase()
                  )
                  .map((a) => a.subject)
                  .join(", ") || "Class Teacher",
              },
            ]}
            emptyTitle={assignedPairs.size === 0 ? "No sections assigned" : "No students found"}
            emptyMessage={
              assignedPairs.size === 0
                ? "No class sections have been assigned to you yet. Contact the admin to assign subjects or classes."
                : `No students are enrolled in ${sectionFilter || "your sections"} yet.`
            }
            minWidth={980}
          />
        </div>
      )}
    </div>
  );
}
