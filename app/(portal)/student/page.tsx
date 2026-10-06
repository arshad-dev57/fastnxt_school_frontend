"use client";

import Link from "next/link";
import {
  Award, BookOpen, CalendarCheck, CalendarClock, CalendarDays, ChevronRight, Clock,
  Megaphone, NotebookPen, TrendingUp,
} from "lucide-react";
import { Avatar, Badge, Card, CardHead, PageHeader, StatCard, type IconType } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { ProgressMeter } from "@/components/portal/portal-ui";
import {
  PORTAL_STUDENT, STUDENT_FULL_NAME, STUDENT_META, attendanceRate, countBy,
  studentAttendance, studentBookIssues, studentEvents, studentHomework,
  studentNotices, studentResults, studentTimetable,
} from "@/lib/portal-data";
import { UpcomingMeetingsCard } from "@/components/meetings/upcoming-meetings";

/* The Student Portal dashboard is a roll-up of ONLY the modules the Student role
   can view (lib/branch-access.ts): timetable, attendance, exams, results,
   homework, library, events, communication and certificates. Every widget reuses
   an existing Admin card / stat pattern.

   Note: "fees" is deliberately absent — the existing role definition grants the
   fees module to Parent, not Student, so no fee data is surfaced here. */

const QUICK: { label: string; href: string; Icon: IconType }[] = [
  { label: "My Timetable", href: "/student/timetable", Icon: CalendarClock },
  { label: "My Attendance", href: "/student/attendance", Icon: CalendarCheck },
  { label: "My Results", href: "/student/results", Icon: Award },
  { label: "My Homework", href: "/student/homework", Icon: NotebookPen },
];

export default function StudentDashboardPage() {
  const rate = attendanceRate(studentAttendance);
  const attCounts = countBy(studentAttendance, (r) => r.status);
  const latestResult = studentResults[0];
  const openHomework = studentHomework.filter((h) => h.status === "Open" || h.status === "Due Soon");
  const overdueBooks = studentBookIssues.filter((b) => b.status === "Overdue");
  const todaySlots = studentTimetable.filter((s) => s.day === "Monday").sort((a, b) => a.period - b.period);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${PORTAL_STUDENT.first}`}
        subtitle={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section} · ${STUDENT_META.campus} · Session ${PORTAL_STUDENT.session}`}
        actions={
          <div className="flex items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-1.5">
            <Avatar name={STUDENT_FULL_NAME} size={32} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight">{STUDENT_FULL_NAME}</p>
              <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{PORTAL_STUDENT.studentId}</p>
            </div>
          </div>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        {/* KPI ROW — same StatCard grid the Admin dashboard uses */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub={`${attCounts.Present ?? 0} of ${studentAttendance.length} days`} />
          <StatCard label="Latest Result" value={latestResult ? `${latestResult.percentage}%` : "—"} Icon={Award} tone="blue" sub={latestResult ? latestResult.exam : "No results yet"} />
          <StatCard label="Open Homework" value={openHomework.length} Icon={NotebookPen} tone="purple" sub="Due this cycle" />
          <StatCard label="New Notices" value={studentNotices.length} Icon={Megaphone} tone="orange" sub="For your class" />
          <StatCard label="Books Issued" value={studentBookIssues.length} Icon={BookOpen} tone="gray" sub={`${overdueBooks.length} overdue`} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            {/* TODAY'S CLASSES — Monday, straight from the Admin timetable grid */}
            <Card pad={false}>
              <CardHead
                title="Today's classes"
                subtitle="Monday · your period-wise schedule"
                Icon={CalendarClock}
                right={<Link href="/student/timetable" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Full timetable <ChevronRight className="h-4 w-4" /></Link>}
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
                        <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{s.teacher} · {s.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* HOMEWORK — /homework module, own class only */}
            <Card pad={false}>
              <CardHead
                title="Homework & assignments"
                subtitle={`${openHomework.length} still open for ${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
                Icon={NotebookPen}
                right={<Link href="/student/homework" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">View all <ChevronRight className="h-4 w-4" /></Link>}
              />
              {studentHomework.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">No homework assigned yet.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {studentHomework.map((h) => (
                    <div key={h.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{h.title}</p>
                          <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{h.subject} · {h.teacher}</p>
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
            {/* ATTENDANCE SNAPSHOT — Admin attendanceSummary, own records */}
            <Card pad={false}>
              <CardHead title="Attendance snapshot" subtitle="Present, absent, late and leave" Icon={CalendarCheck} />
              <div className="space-y-3 p-4">
                {(["Present", "Absent", "Late", "Leave"] as const).map((k) => (
                  <div key={k}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="text-[var(--theme-text-muted)]">{k}</span>
                      <span className="font-medium tabular-nums">{attCounts[k] ?? 0}</span>
                    </div>
                    <ProgressMeter
                      value={studentAttendance.length ? ((attCounts[k] ?? 0) / studentAttendance.length) * 100 : 0}
                      tone={k === "Present" ? "var(--theme-success)" : k === "Absent" ? "var(--theme-danger)" : k === "Late" ? "var(--theme-warning)" : "var(--theme-info)"}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <UpcomingMeetingsCard scope="student" viewAllHref="/student/meetings" title="My meetings" />

            {/* UPCOMING EVENTS — Admin /events module, in the Student role scope */}
            <Card pad={false}>
              <CardHead
                title="Upcoming events"
                subtitle="What's coming up at school"
                Icon={CalendarDays}
                right={<Link href="/student/events" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">All events <ChevronRight className="h-4 w-4" /></Link>}
              />
              {studentEvents.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">Nothing scheduled right now.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {studentEvents.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium">{e.title}</p>
                        <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{e.venue} · {e.startDate}</p>
                      </div>
                      <Badge label={e.type} tone="purple" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* QUICK LINKS — Admin dashboard "QUICK" pattern */}
            <Card pad={false}>
              <CardHead title="Quick links" Icon={TrendingUp} />
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
