"use client";

import { CalendarClock, Download, Printer } from "lucide-react";
import { Btn, PageHeader } from "@/components/ui";
import { PortalTimetable } from "@/components/portal/portal-timetable";
import { PortalScopeBar } from "@/components/portal/portal-ui";
import { PORTAL_STUDENT, STUDENT_META, studentTimetable } from "@/lib/portal-data";
import { PERIOD_TIMES } from "@/lib/school-mock-data";

/* Student Timetable = the Admin /timetable module viewed in "Class" mode,
   scoped to the signed-in student's own class-section. */
export default function StudentTimetablePage() {
  return (
    <>
      <PageHeader
        title="My Timetable"
        subtitle={`Weekly period-wise schedule for ${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}.`}
        actions={
          <>
            <Btn variant="secondary" Icon={Download}>Download</Btn>
            <Btn variant="primary" Icon={Printer}>Print</Btn>
          </>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        <PortalScopeBar count={studentTimetable.length} noun="period slots" label={PORTAL_STUDENT.cls + "-" + PORTAL_STUDENT.section} Icon={CalendarClock} />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
          <span className="rounded-full bg-[var(--theme-surface)] px-3 py-1.5 ring-1 ring-[var(--theme-border)]">{STUDENT_META.campus}</span>
          <span className="rounded-full bg-[var(--theme-surface)] px-3 py-1.5 ring-1 ring-[var(--theme-border)]">Session {PORTAL_STUDENT.session}</span>
          <span className="rounded-full bg-[var(--theme-surface)] px-3 py-1.5 ring-1 ring-[var(--theme-border)]">
            Day starts {PERIOD_TIMES[1].start}
          </span>
        </div>

        <div className="mt-4">
          <PortalTimetable
            slots={studentTimetable}
            title={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section} weekly timetable`}
            subtitle="Subjects, teachers and rooms for every period."
          />
        </div>
      </div>
    </>
  );
}
