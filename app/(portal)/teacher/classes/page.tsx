"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen, CalendarCheck, GraduationCap, Loader2, RefreshCw, School, Users,
} from "lucide-react";
import { Avatar, Badge, Card, CardHead, PageHeader, StatCard } from "@/components/ui";
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
   My Classes — Teacher Portal
   ---------------------------------------------------------------------------
   Shows ONLY the classes and subject assignments belonging to the logged-in
   teacher. We first resolve the teacher's exact stored name via their employee
   record, then query the backend with `teacher=<name>` so the filtering is
   done server-side rather than guessing on the client.
   ========================================================================== */

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const { currentBranchId, currentBranch } = useBranch();

  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [assignments, setAssignments] = useState<SubjectAssignmentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const branchScope =
        currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      const empRes = await employeesApi.list({ q: user.email, branchId: branchScope });
      const emps: EmployeeItem[] = empRes.employees ?? [];
      const matched =
        emps.find((e) => e.email?.toLowerCase() === user.email.toLowerCase()) ||
        emps.find((e) => e.name?.toLowerCase() === (user.name || "").toLowerCase()) ||
        (emps.length > 0 ? emps[0] : null);
      setEmployee(matched ?? null);

      // Use the exact stored teacher name for server-side filtering
      // Fall back to user.name if employee not found, but DON'T fall back to showing all
      const teacherName = matched?.name || user.name || "";

      // Step 2 — fetch assignments filtered by teacher name on the backend
      const [assignRes, clsRes, studentRes] = await Promise.all([
        subjectsApi.listAssignments({ teacher: teacherName, branchId: branchScope }),
        classesApi.list({ branchId: branchScope }),
        studentsApi.list({ branchId: branchScope }),
      ]);

      const allAssignments: SubjectAssignmentItem[] = assignRes.assignments ?? [];
      setAssignments(allAssignments);

      // Step 3 — filter classes where this teacher is the class teacher (exact name match)
      const allClasses: ClassItem[] = clsRes.classes ?? [];
      const nameLower = teacherName.toLowerCase();
      const myClasses = nameLower
        ? allClasses.filter((c) => (c.teacher || "").toLowerCase() === nameLower)
        : [];
      setClasses(myClasses);

      setStudents(studentRes.students ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, [user, currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* --------------------------------------------------------------------------
     Build the unified "My Sections" list:
     • Subject assignments → class + section + subject
     • Class teacher roles → class + section + "Class Teacher"
     Deduplicate by cls-section-subject key.
  -------------------------------------------------------------------------- */
  const mySections = useMemo(() => {
    type Section = {
      cls: string;
      section: string;
      subject: string;
      teacher: string;
      role: "Subject Teacher" | "Class Teacher";
      studentsCount: number;
    };

    const map = new Map<string, Section>();

    assignments.forEach((a) => {
      const key = `${a.cls}||${a.section}||${a.subject}`;
      if (!map.has(key)) {
        const count = students.filter(
          (s) =>
            s.cls.toLowerCase() === a.cls.toLowerCase() &&
            s.section.toLowerCase() === a.section.toLowerCase()
        ).length;
        map.set(key, {
          cls: a.cls,
          section: a.section,
          subject: a.subject,
          teacher: a.teacher,
          role: "Subject Teacher",
          studentsCount: count,
        });
      }
    });

    classes.forEach((c) => {
      const sections: string[] = Array.isArray(c.sections) ? c.sections : ["A"];
      sections.forEach((sec) => {
        const key = `${c.name}||${sec}||Class Teacher`;
        if (!map.has(key)) {
          const count = students.filter(
            (s) =>
              s.cls.toLowerCase() === c.name.toLowerCase() &&
              s.section.toLowerCase() === sec.toLowerCase()
          ).length;
          map.set(key, {
            cls: c.name,
            section: sec,
            subject: "Class Teacher",
            teacher: c.teacher,
            role: "Class Teacher",
            studentsCount: count || c.students || 0,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.cls.localeCompare(b.cls) || a.section.localeCompare(b.section)
    );
  }, [assignments, classes, students]);

  /* Unique class-section pairs for student filtering */
  const assignedKeys = useMemo(
    () =>
      new Set(
        mySections.map((s) => `${s.cls.toLowerCase()}||${s.section.toLowerCase()}`)
      ),
    [mySections]
  );

  const assignedStudents = useMemo(
    () =>
      assignedKeys.size === 0
        ? []
        : students.filter((s) =>
          assignedKeys.has(`${s.cls.toLowerCase()}||${s.section.toLowerCase()}`)
        ),
    [students, assignedKeys]
  );

  const uniqueSubjects = useMemo(
    () => [...new Set(assignments.map((a) => a.subject))],
    [assignments]
  );

  const totalEnrolled = useMemo(
    () => assignedStudents.length,
    [assignedStudents]
  );

  const teacherName = employee?.name || user?.name || "Teacher";
  const campusName = currentBranch?.name || user?.branch?.name || "Main Campus";

  /* --------------------------------------------------------------------------
     Tone helper for role badge
  -------------------------------------------------------------------------- */
  const roleTone = (role: string) =>
    role === "Class Teacher" ? ("orange" as const) : ("blue" as const);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="My Classes & Teaching Subjects"
        subtitle={`Classes and subjects assigned to ${teacherName} · ${campusName}`}
        actions={
          <button
            id="teacher-classes-refresh"
            onClick={loadData}
            className="flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard
          label="Assigned Sections"
          value={mySections.length}
          Icon={School}
          tone="blue"
          sub="Total class-subject slots"
        />
        <StatCard
          label="Subjects Teaching"
          value={uniqueSubjects.length}
          Icon={BookOpen}
          tone="purple"
          sub="Distinct subjects"
        />
        <StatCard
          label="Students in My Classes"
          value={totalEnrolled}
          Icon={Users}
          tone="green"
          sub="Across all sections"
        />
        <StatCard
          label="Class Teacher Of"
          value={classes.length}
          Icon={GraduationCap}
          tone="orange"
          sub="Home-room classes"
        />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-error-border)] bg-[var(--theme-error-soft)] px-4 py-3 text-[13px] text-[var(--theme-error-text)] sm:mx-6">
          {error}
        </div>
      )}

      {/* ── Assigned Classes & Subject Cards ── */}
      <div className="px-4 pt-4 sm:px-6">
        <Card pad={false} className="mb-5">
          <CardHead
            title="My Assigned Classes & Subjects"
            subtitle={
              loading
                ? "Loading…"
                : `${mySections.length} section${mySections.length !== 1 ? "s" : ""} assigned to ${teacherName}`
            }
            Icon={School}
          />

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-[14px] text-[var(--theme-text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading assigned classes…
            </div>
          ) : mySections.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <School className="h-10 w-10 text-[var(--theme-text-faint)]" />
              <p className="text-[15px] font-medium text-[var(--theme-text)]">
                No classes assigned yet
              </p>
              <p className="max-w-xs text-[13px] text-[var(--theme-text-muted)]">
                No subject assignments or class teacher roles were found for{" "}
                <strong>{teacherName}</strong>. Please contact the admin to assign
                classes and subjects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {mySections.map((s) => (
                <div
                  key={`${s.cls}||${s.section}||${s.subject}`}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                      <School className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold leading-tight">
                        {s.cls}
                        <span className="ml-1 text-[var(--theme-text-muted)]">·</span>
                        <span className="ml-1 text-[var(--theme-text-muted)]">Section {s.section}</span>
                      </p>
                      <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--theme-primary)]">
                        {s.subject}
                      </p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="flex items-center gap-2">
                    <Badge label={s.role} tone={roleTone(s.role)} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-3 text-[12px] text-[var(--theme-text-muted)]">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {s.studentsCount} students
                    </span>
                    <span className="truncate font-medium text-[var(--theme-text)]">
                      {teacherName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Student Roster ── */}
      <PortalBoard
        title="Students in My Classes"
        subtitle={
          assignedStudents.length > 0
            ? `${assignedStudents.length} students enrolled across your ${mySections.length} section(s)`
            : "No students found in your assigned classes"
        }
        Icon={Users}
        nameLabel="Student"
        rows={assignedStudents}
        keyOf={(r) => r.id}
        nameOf={(r) => r.name}
        subtitleOf={(r) =>
          `${r.cls} - Section ${r.section} · ${r.studentId || r.admissionNo}`
        }
        searchTextOf={(r) =>
          `${r.name} ${r.studentId} ${r.admissionNo} ${r.cls} ${r.section} ${r.father}`
        }
        searchPlaceholder="Search by name, ID or class…"
        scopeLabel="My sections"
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
            width: "minmax(180px,1.2fr)",
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
            width: "150px",
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
            width: "140px",
            cell: (r) => r.phone || r.contact || "—",
          },
          {
            key: "status",
            label: "Status",
            width: "110px",
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
          { label: "Student ID", value: r.studentId || r.admissionNo },
          {
            label: "Name",
            value: (
              <span className="flex items-center gap-2">
                <Avatar name={r.name} size={24} />
                {r.name}
              </span>
            ),
          },
          { label: "Class", value: `${r.cls} — Section ${r.section}` },
          { label: "Gender", value: r.gender || "—" },
          { label: "Father Name", value: r.father || "—" },
          { label: "Guardian", value: r.guardian || "—" },
          { label: "Phone / Contact", value: r.phone || r.contact || "—" },
          { label: "Admission Date", value: r.admissionDate || "—" },
          { label: "Status", value: r.status || "Active" },
        ]}
        emptyTitle="No students found"
        emptyMessage="No students are enrolled in your assigned class sections."
        minWidth={920}
      />
    </div>
  );
}
