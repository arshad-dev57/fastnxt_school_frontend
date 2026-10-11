"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award, BookOpen, CalendarCheck, CalendarClock, CalendarDays, ChevronRight, Clock,
  Megaphone, NotebookPen, TrendingUp,
} from "lucide-react";
import { Avatar, Badge, Card, CardHead, PageHeader, StatCard, type IconType } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { UpcomingMeetingsCard } from "@/components/meetings/upcoming-meetings";
import {
  attendanceApi,
  eventsApi,
  homeworkApi,
  noticesApi,
  timetableApi,
  type EventItem,
  type HomeworkItem,
  type NoticeItem,
  type StudentAttendanceItem,
  type TimetableSlotItem,
} from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

const QUICK: { label: string; href: string; Icon: IconType }[] = [
  { label: "My Timetable", href: "/student/timetable", Icon: CalendarClock },
  { label: "My Attendance", href: "/student/attendance", Icon: CalendarCheck },
  { label: "My Exams", href: "/student/exams", Icon: Award },
  { label: "My Homework", href: "/student/homework", Icon: NotebookPen },
];

export default function StudentDashboardPage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [attendance, setAttendance] = useState<StudentAttendanceItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlotItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      setLoading(profileLoading);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [att, hw, tt, nt, ev] = await Promise.all([
          attendanceApi.myAttendance().catch(() => ({ attendance: [] as StudentAttendanceItem[] })),
          homeworkApi.list({ cls: student.cls, section: student.section, branchId: student.branchId || undefined }).catch(() => ({ homework: [] as HomeworkItem[] })),
          timetableApi.list({ cls: student.cls, section: student.section, branchId: student.branchId || undefined }).catch(() => ({ slots: [] as TimetableSlotItem[] })),
          noticesApi.list({ cls: student.cls, section: student.section, branchId: student.branchId || undefined }).catch(() => ({ notices: [] as NoticeItem[] })),
          eventsApi.list({ branchId: student.branchId || undefined }).catch(() => ({ events: [] as EventItem[] })),
        ]);
        if (cancelled) return;
        setAttendance(att.attendance ?? []);
        setHomework(hw.homework ?? []);
        setTimetable(tt.slots ?? []);
        setNotices((nt.notices ?? []).filter((n) => (n.status || "").toLowerCase() !== "draft"));
        setEvents(ev.events ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student, profileLoading]);

  const attCounts = useMemo(() => {
    const c: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    for (const r of attendance) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [attendance]);

  const rate = attendance.length
    ? Math.round((((attCounts.Present ?? 0) + (attCounts.Late ?? 0)) / attendance.length) * 100)
    : 0;

  const openHomework = homework.filter((h) => h.status === "Open" || h.status === "Due Soon");
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()] || "Monday";
  const todaySlots = timetable.filter((s) => s.day === todayName).sort((a, b) => a.period - b.period);
  const firstName = (student?.name || "Student").split(/\s+/)[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={
          student
            ? `${scopeLabel} · Session ${student.session}`
            : profileLoading
              ? "Loading your profile…"
              : profileError || "Student portal"
        }
        actions={
          student ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-1.5">
              <Avatar name={student.name} src={student.photo} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold leading-tight">{student.name}</p>
                <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{student.studentId}</p>
              </div>
            </div>
          ) : null
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        {profileError && !student ? (
          <p className="rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[13px] text-[var(--theme-danger-text)]">
            {profileError}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub={`${attCounts.Present ?? 0} of ${attendance.length} days`} />
          <StatCard label="Open Homework" value={openHomework.length} Icon={NotebookPen} tone="purple" sub="Due this cycle" />
          <StatCard label="New Notices" value={notices.length} Icon={Megaphone} tone="orange" sub="For your class" />
          <StatCard label="Today's classes" value={todaySlots.length} Icon={CalendarClock} tone="blue" sub={todayName} />
          <StatCard label="Events" value={events.length} Icon={BookOpen} tone="gray" sub={loading ? "Loading…" : "School calendar"} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <Card pad={false}>
              <CardHead
                title="Today's classes"
                subtitle={`${todayName} · your period-wise schedule`}
                Icon={CalendarClock}
                right={<Link href="/student/timetable" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Full timetable <ChevronRight className="h-4 w-4" /></Link>}
              />
              {todaySlots.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                  {loading ? "Loading…" : "No periods scheduled for today."}
                </p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {todaySlots.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[12px] font-bold text-[var(--theme-primary-hover)]">P{s.period}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{s.subject}</p>
                        <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{s.teacher} · {s.room || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card pad={false}>
              <CardHead
                title="Homework & assignments"
                subtitle={`${openHomework.length} still open for ${scopeLabel}`}
                Icon={NotebookPen}
                right={<Link href="/student/homework" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">View all <ChevronRight className="h-4 w-4" /></Link>}
              />
              {homework.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                  {loading ? "Loading…" : "No homework assigned yet."}
                </p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {homework.slice(0, 5).map((h) => (
                    <div key={h.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{h.title}</p>
                          <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{h.subject} · {h.teacher}</p>
                        </div>
                        <StatusPill label={h.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1">
                          <ProgressMeter value={h.total ? (h.submitted / h.total) * 100 : 0} label={`${h.submitted}/${h.total}`} />
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--theme-text-faint)]">
                          <Clock className="h-3.5 w-3.5" />Due {h.due}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
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
                      value={attendance.length ? ((attCounts[k] ?? 0) / attendance.length) * 100 : 0}
                      tone={k === "Present" ? "var(--theme-success)" : k === "Absent" ? "var(--theme-danger)" : k === "Late" ? "var(--theme-warning)" : "var(--theme-info)"}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <UpcomingMeetingsCard scope="student" viewAllHref="/student/meetings" title="My meetings" />

            <Card pad={false}>
              <CardHead
                title="Upcoming events"
                subtitle="What's coming up at school"
                Icon={CalendarDays}
                right={<Link href="/student/events" className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">All events <ChevronRight className="h-4 w-4" /></Link>}
              />
              {events.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
                  {loading ? "Loading…" : "Nothing scheduled right now."}
                </p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {events.slice(0, 4).map((e) => (
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

            <Card pad={false}>
              <CardHead title="Quick links" Icon={TrendingUp} />
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
    </>
  );
}
