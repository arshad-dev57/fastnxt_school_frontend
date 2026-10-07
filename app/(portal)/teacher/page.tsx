"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award, BookOpen, CalendarCheck, CalendarClock, ChevronRight, Clock,
  GraduationCap, ListChecks, Loader2, NotebookPen, RefreshCw, School,
  User, type LucideIcon,
} from "lucide-react";
import { Avatar, Card, CardHead, PageHeader, StatCard } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi, subjectsApi, employeesApi,
  type ClassItem, type SubjectAssignmentItem, type EmployeeItem,
} from "@/lib/auth/api-client";
import { UpcomingMeetingsCard } from "@/components/meetings/upcoming-meetings";

/* The Teacher Portal dashboard rolls up ONLY the modules the Teacher role can
   view (lib/branch-access.ts): dashboard, timetable, attendance, homework,
   exams, results, communication and tasks — scope "own" (own classes). */

const QUICK: { label: string; href: string; Icon: LucideIcon }[] = [
  { label: "Mark Attendance", href: "/teacher/attendance", Icon: CalendarCheck },
  { label: "Homework", href: "/teacher/homework", Icon: NotebookPen },
  { label: "Exams & Results", href: "/teacher/exams", Icon: GraduationCap },
  { label: "My Tasks", href: "/teacher/tasks", Icon: ListChecks },
];

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { currentBranchId, currentBranch } = useBranch();

  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [assignments, setAssignments] = useState<SubjectAssignmentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      const [empRes, assignRes, clsRes] = await Promise.all([
        employeesApi.list({ q: user.email, branchId: branchScope }),
        subjectsApi.listAssignments({ branchId: branchScope }),
        classesApi.list({ branchId: branchScope }),
      ]);

      const emps: EmployeeItem[] = empRes.employees ?? [];
      const matched =
        emps.find((e) => e.email?.toLowerCase() === user.email.toLowerCase()) ||
        emps.find((e) => e.name?.toLowerCase() === (user.name || "").toLowerCase()) ||
        (emps.length > 0 ? emps[0] : null);
      setEmployee(matched ?? null);

      const allAssign: SubjectAssignmentItem[] = assignRes.assignments ?? [];
      const myAssign = allAssign.filter(
        (a) =>
          a.teacher?.toLowerCase().includes((user.name || "").toLowerCase()) ||
          a.teacher?.toLowerCase().includes(user.email.toLowerCase())
      );
      setAssignments(myAssign.length > 0 ? myAssign : allAssign.slice(0, 10));

      const allClasses: ClassItem[] = clsRes.classes ?? [];
      const nameLower = (user.name || "").toLowerCase();
      const myClasses = allClasses.filter((c) => (c.teacher || "").toLowerCase().includes(nameLower));
      setClasses(myClasses.length > 0 ? myClasses : allClasses.slice(0, 4));
    } catch {
      // fail silently on dashboard
    } finally {
      setLoading(false);
    }
  }, [user, currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayName = employee?.name || user?.name || "Teacher";
  const firstName = displayName.split(" ")[0];
  const campusName = currentBranch?.name || user?.branch?.name || user?.school?.name || "Main Campus";
  const schoolName = user?.school?.name || "";

  // Unique class-sections from subject assignments
  const mySections = useMemo(() => {
    const seen = new Set<string>();
    const result: { cls: string; section: string; subject: string }[] = [];
    assignments.forEach((a) => {
      const key = `${a.cls}-${a.section}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ cls: a.cls, section: a.section, subject: a.subject });
      }
    });
    // also add class teacher assignments
    classes.forEach((c) => {
      const sections = Array.isArray(c.sections) ? c.sections : ["A"];
      sections.forEach((s: string) => {
        const key = `${c.name}-${s}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ cls: c.name, section: s, subject: "Class Teacher" });
        }
      });
    });
    return result;
  }, [assignments, classes]);

  const totalStudents = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.students || 0), 0);
  }, [classes]);

  const uniqueSubjects = useMemo(() => [...new Set(assignments.map((a) => a.subject))], [assignments]);

  // Mock open tasks count (could connect to tasks API later)
  const openTasksCount = 3;

  return (
    <>
      <PageHeader
        title={loading ? `Welcome back` : `Good day, ${firstName}`}
        subtitle={`${employee?.designation || "Teacher"} · ${employee?.department || "Staff"} · ${campusName}${schoolName ? ` · ${schoolName}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-1.5 border border-[var(--theme-border)]">
              <Avatar name={displayName} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold leading-tight">{displayName}</p>
                <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{employee?.employeeId || user?.email || ""}</p>
              </div>
            </div>
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center p-16 text-[var(--theme-text-muted)]">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          Loading your dashboard…
        </div>
      ) : (
        <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="My Classes" value={mySections.length} Icon={School} tone="blue" sub="Sections you teach" />
            <StatCard label="My Students" value={totalStudents || mySections.length * 30} Icon={User} tone="purple" sub="Across all sections" />
            <StatCard label="Subjects" value={uniqueSubjects.length} Icon={BookOpen} tone="green" sub="Teaching load" />
            <StatCard label="Assignments" value={assignments.length} Icon={Award} tone="orange" sub="Subject assignments" />
            <StatCard label="Open Tasks" value={openTasksCount} Icon={ListChecks} tone="red" sub="Not done yet" />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              {/* MY CLASSES */}
              <Card pad={false}>
                <CardHead
                  title="My Classes & Sections"
                  subtitle="Classes and subject sections assigned to you"
                  Icon={School}
                  right={
                    <Link href="/teacher/classes" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                      View all <ChevronRight className="h-4 w-4" />
                    </Link>
                  }
                />
                {mySections.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                    No class assignments found. Please contact the admin to assign classes.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--theme-border)]">
                    {mySections.slice(0, 5).map((s) => (
                      <div key={`${s.cls}-${s.section}-${s.subject}`} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                          <School className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{s.cls} — Section {s.section}</p>
                          <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{s.subject}</p>
                        </div>
                        <Link
                          href="/teacher/attendance"
                          className="shrink-0 rounded-full bg-[var(--theme-primary-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-primary-hover)] hover:opacity-90"
                        >
                          Mark
                        </Link>
                      </div>
                    ))}
                    {mySections.length > 5 && (
                      <div className="px-4 py-2.5 text-center">
                        <Link href="/teacher/classes" className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                          +{mySections.length - 5} more sections →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* SUBJECTS TAUGHT */}
              <Card pad={false}>
                <CardHead
                  title="Subjects I Teach"
                  subtitle={`${uniqueSubjects.length} subject${uniqueSubjects.length !== 1 ? "s" : ""} across your sections`}
                  Icon={BookOpen}
                  right={
                    <Link href="/teacher/classes" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                      Details <ChevronRight className="h-4 w-4" />
                    </Link>
                  }
                />
                {uniqueSubjects.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                    No subject assignments found yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                    {assignments.slice(0, 8).map((a) => (
                      <div key={`${a.cls}-${a.section}-${a.subject}`} className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium">{a.subject}</p>
                          <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{a.cls} - Section {a.section}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* TIMETABLE TODAY */}
              <Card pad={false}>
                <CardHead
                  title="Today's Schedule"
                  subtitle={`Monday · your teaching schedule · ${campusName}`}
                  Icon={CalendarClock}
                  right={
                    <Link href="/teacher/timetable" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                      Full timetable <ChevronRight className="h-4 w-4" />
                    </Link>
                  }
                />
                {mySections.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                    No periods scheduled. Check the timetable page.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--theme-border)]">
                    {mySections.slice(0, 4).map((s, i) => (
                      <div key={`${s.cls}-${s.section}-${s.subject}-${i}`} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[12px] font-bold text-[var(--theme-primary-hover)]">
                          P{i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{s.subject}</p>
                          <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{s.cls}-{s.section}</p>
                        </div>
                        <span className="flex items-center gap-1 text-[12px] text-[var(--theme-text-faint)]">
                          <Clock className="h-3.5 w-3.5" />
                          Period {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-5">
              {/* UPCOMING MEETINGS */}
              <UpcomingMeetingsCard scope="teacher" viewAllHref="/teacher/meetings" />

              {/* MY TASKS */}
              <Card pad={false}>
                <CardHead title="My Tasks" subtitle={`${openTasksCount} open tasks`} Icon={ListChecks} />
                <div className="divide-y divide-[var(--theme-border)]">
                  {[
                    { id: 1, title: "Prepare mid-term question paper", due: "Oct 15", status: "In Progress", related: "Grade 8 Science" },
                    { id: 2, title: "Submit attendance records", due: "Oct 10", status: "Pending", related: "All Classes" },
                    { id: 3, title: "Grade homework submissions", due: "Oct 12", status: "In Progress", related: "Grade 6 Math" },
                  ].map((t) => (
                    <div key={t.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{t.title}</p>
                        <StatusPill label={t.status} />
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[var(--theme-text-muted)]">
                        <Clock className="h-3 w-3" /> {t.related} · due {t.due}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* HOMEWORK QUICK STATS */}
              <Card pad={false}>
                <CardHead
                  title="Homework Overview"
                  subtitle="Across your sections"
                  Icon={NotebookPen}
                  right={
                    <Link href="/teacher/homework" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                      Manage <ChevronRight className="h-4 w-4" />
                    </Link>
                  }
                />
                <div className="space-y-3 p-4">
                  {mySections.slice(0, 3).map((s) => (
                    <div key={`hw-${s.cls}-${s.section}`}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium">{s.cls}-{s.section} · {s.subject}</span>
                        <span className="text-[var(--theme-text-muted)]">0/30</span>
                      </div>
                      <ProgressMeter value={0} label="No submissions yet" />
                    </div>
                  ))}
                  {mySections.length === 0 && (
                    <p className="text-center text-[13px] text-[var(--theme-text-muted)]">No homework data yet.</p>
                  )}
                </div>
              </Card>

              {/* QUICK ACTIONS */}
              <Card pad={false}>
                <CardHead title="Quick Actions" Icon={CalendarCheck} />
                <div className="grid grid-cols-2 gap-2 p-3">
                  {QUICK.map((q) => (
                    <Link
                      key={q.href}
                      href={q.href}
                      className="ic-card flex flex-col items-center gap-2 rounded-lg border border-[var(--theme-border)] px-2 py-3 text-center transition-colors hover:bg-[var(--theme-hover)]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                        <q.Icon className="ic-lift h-[18px] w-[18px]" />
                      </span>
                      <span className="text-[12px] font-medium leading-tight">{q.label}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
