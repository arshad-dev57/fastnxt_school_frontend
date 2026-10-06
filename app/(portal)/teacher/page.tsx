"use client";

import Link from "next/link";
import {
  Award, CalendarCheck, CalendarClock, ChevronRight, Clock, GraduationCap,
  ListChecks, NotebookPen, School, User, type LucideIcon,
} from "lucide-react";
import { Avatar, Card, CardHead, PageHeader, StatCard } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { ProgressMeter } from "@/components/portal/portal-ui";
import {
  PORTAL_TEACHER, TEACHER_META, attendanceRate, teacherAttendanceRegister,
  teacherClasses, teacherExams, teacherHomework, teacherResults, teacherTasks, teacherTimetable,
} from "@/lib/portal-data";
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
  const rate = attendanceRate(teacherAttendanceRegister);
  const openTasks = teacherTasks.filter((t) => t.status !== "Done");
  const todaySlots = teacherTimetable.filter((s) => s.day === "Monday").sort((a, b) => a.period - b.period);
  const avgMarks = teacherResults.length
    ? Math.round((teacherResults.reduce((s, r) => s + r.percentage, 0) / teacherResults.length) * 10) / 10
    : 0;
  const marksEntry = teacherExams.filter((e) => e.status === "Marks Entry");

  return (
    <>
      <PageHeader
        title={`Good day, ${PORTAL_TEACHER.name.split(" ")[0]}`}
        subtitle={`${PORTAL_TEACHER.designation} · ${PORTAL_TEACHER.department} · ${TEACHER_META.campus} · Session ${TEACHER_META.session}`}
        actions={
          <div className="flex items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-1.5">
            <Avatar name={PORTAL_TEACHER.name} size={32} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight">{PORTAL_TEACHER.name}</p>
              <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{PORTAL_TEACHER.employeeId}</p>
            </div>
          </div>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="My Classes" value={teacherClasses.length} Icon={School} tone="blue" sub="Sections you teach" />
          <StatCard label="My Students" value={teacherClasses.reduce((n, c) => n + c.students, 0)} Icon={User} tone="purple" sub="Across all sections" />
          <StatCard label="Class Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub="Latest register" />
          <StatCard label="Class Average" value={`${avgMarks}%`} Icon={Award} tone="green" sub="Published results" />
          <StatCard label="Open Tasks" value={openTasks.length} Icon={ListChecks} tone="red" sub="Not done yet" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            {/* TODAY'S PERIODS — Admin timetable in "Teacher" mode */}
            <Card pad={false}>
              <CardHead
                title="Today's periods"
                subtitle="Monday · your teaching schedule"
                Icon={CalendarClock}
                right={<Link href="/teacher/timetable" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Full timetable <ChevronRight className="h-4 w-4" /></Link>}
              />
              {todaySlots.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">No periods scheduled for today.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {todaySlots.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[12px] font-bold text-[var(--theme-primary-hover)]">P{s.period}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{s.subject}</p>
                        <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{s.cls}-{s.section} · {s.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* MY CLASSES — Admin /classes, own sections only */}
            <Card pad={false}>
              <CardHead
                title="My Classes"
                subtitle="Sections assigned to you and their roster size"
                Icon={School}
                right={<Link href="/teacher/classes" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">View all <ChevronRight className="h-4 w-4" /></Link>}
              />
              <div className="divide-y divide-[var(--theme-border)]">
                {teacherClasses.map((c) => (
                  <div key={c.label} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                      <School className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{c.label}</p>
                      <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{c.students} students enrolled</p>
                    </div>
                    <Link href="/teacher/attendance" className="shrink-0 rounded-full bg-[var(--theme-primary-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-primary-hover)] hover:opacity-90">Mark</Link>
                  </div>
                ))}
              </div>
            </Card>

            {/* HOMEWORK — Admin /homework, authored by this teacher */}
            <Card pad={false}>
              <CardHead
                title="Homework & submissions"
                subtitle={`${teacherHomework.length} assignment${teacherHomework.length === 1 ? "" : "s"} set by you`}
                Icon={NotebookPen}
                right={<Link href="/teacher/homework" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Manage <ChevronRight className="h-4 w-4" /></Link>}
              />
              {teacherHomework.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">You have not set any homework yet.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {teacherHomework.map((h) => (
                    <div key={h.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{h.title}</p>
                          <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{h.cls}-{h.section} · {h.subject}</p>
                        </div>
                        <StatusPill label={h.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1"><ProgressMeter value={h.total ? (h.submitted / h.total) * 100 : 0} label={`${h.submitted}/${h.total}`} /></div>
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--theme-text-faint)]"><Clock className="h-3.5 w-3.5" />Due {h.due}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            {/* EXAMS IN MARKS ENTRY — Admin /exams lifecycle */}
            <Card pad={false}>
              <CardHead title="Exams needing action" subtitle="Marks entry and verification stages" Icon={GraduationCap} />
              <div className="divide-y divide-[var(--theme-border)]">
                {marksEntry.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">No exams are in marks entry right now.</p>
                ) : marksEntry.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{e.name}</p>
                      <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{e.type} · {e.startDate}</p>
                    </div>
                    <StatusPill label={e.status} />
                  </div>
                ))}
              </div>
            </Card>

            <UpcomingMeetingsCard scope="teacher" viewAllHref="/teacher/meetings" />

            {/* MY TASKS — Admin /tasks, own items */}
            <Card pad={false}>
              <CardHead title="My tasks" subtitle={`${openTasks.length} open of ${teacherTasks.length}`} Icon={ListChecks} />
              <div className="divide-y divide-[var(--theme-border)]">
                {teacherTasks.map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{t.title}</p>
                      <StatusPill label={t.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-[var(--theme-text-muted)]">{t.related} · due {t.due}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* QUICK ACTIONS — Admin dashboard "QUICK" pattern */}
            <Card pad={false}>
              <CardHead title="Quick actions" Icon={CalendarCheck} />
              <div className="grid grid-cols-2 gap-2 p-3">
                {QUICK.map((q) => (
                  <Link key={q.href} href={q.href}
                    className="ic-card flex flex-col items-center gap-2 rounded-lg border border-[var(--theme-border)] px-2 py-3 text-center transition-colors hover:bg-[var(--theme-hover)]">
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
    </>
  );
}
