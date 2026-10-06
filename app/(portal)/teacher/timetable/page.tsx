"use client";

import { useState } from "react";
import { CalendarClock, Printer } from "lucide-react";
import { Btn, PageHeader, StatCard, Card, CardHead } from "@/components/ui";
import { PortalTimetable } from "@/components/portal/portal-timetable";
import { PortalScopeBar } from "@/components/portal/portal-ui";
import { PORTAL_TEACHER, TEACHER_META, teacherClassSections, teacherTimetable } from "@/lib/portal-data";

/* Teacher Timetable = the Admin /timetable module in "Teacher" mode. The Admin
   page offers Class / Teacher / Room grouping; a teacher already IS the
   grouping key, so this is the same grid filtered to their own slots. */
export default function TeacherTimetablePage() {
  const [day, setDay] = useState("Monday");
  const dayCount = teacherTimetable.filter((s) => s.day === day).length;

  return (
    <>
      <PageHeader
        title="My Timetable"
        subtitle={`Weekly teaching schedule for ${PORTAL_TEACHER.name}.`}
        actions={<Btn variant="primary" Icon={Printer}>Print</Btn>}
      />

      <div className="px-4 pb-24 sm:px-6">
        <PortalScopeBar count={teacherTimetable.length} noun="period slots" label={PORTAL_TEACHER.name} Icon={CalendarClock} />

        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
          <StatCard label="Weekly Periods" value={teacherTimetable.length} Icon={CalendarClock} tone="blue" sub={TEACHER_META.campus} />
          <StatCard label="Sections" value={teacherClassSections.length} Icon={CalendarClock} tone="purple" sub="You teach" />
          <StatCard label="Subjects" value={TEACHER_META.subjects.length} Icon={CalendarClock} tone="green" />
          <StatCard label={`${day} Periods`} value={dayCount} Icon={CalendarClock} tone="orange" sub="Today" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PortalTimetable
              slots={teacherTimetable}
              title="Weekly teaching timetable"
              subtitle="Each cell shows the class-section and room for that period."
              highlightDay={day}
            />
          </div>

          <Card pad={false}>
            <CardHead title="Classes & rooms" subtitle="What each period covers" Icon={CalendarClock} />
            <div className="divide-y divide-[var(--theme-border)]">
              {teacherTimetable
                .slice()
                .sort((a, b) => a.day.localeCompare(b.day) || a.period - b.period)
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[12px] font-bold text-[var(--theme-primary-hover)]">P{s.period}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{s.subject}</p>
                      <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{s.cls}-{s.section} · {s.room}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-[var(--theme-text-faint)]">{s.day.slice(0, 3)}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
