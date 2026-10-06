"use client";

import { CalendarDays, GraduationCap, MapPin, User } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_STUDENT, studentExamSchedule, studentExams } from "@/lib/portal-data";

/* Student Examinations = the Admin /exams + /exams/schedule modules, limited to
   exams this student's class actually sits. */
const EXAM_COLORS: Record<string, string> = {
  Scheduled: "var(--theme-info)", "Marks Entry": "var(--theme-warning)",
  Verification: "var(--theme-accent-2)", Published: "var(--theme-success)", Draft: "var(--theme-pending)",
};

export default function StudentExamsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Examinations"
        subtitle={`Exam schedule and date sheet for ${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}.`}
      />

      <div className="mt-2">
        <PortalBoard
          title="My Exams"
          subtitle="Exams your class sits, with type, session and current status."
          Icon={GraduationCap}
          nameLabel="Exam"
          rows={studentExams}
          keyOf={(r) => r.id}
          nameOf={(r) => r.name}
          subtitleOf={(r) => `${r.type} · ${r.session}`}
          searchTextOf={(r) => `${r.name} ${r.type} ${r.session} ${r.status}`}
          searchPlaceholder="Search exam"
          scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
          countNoun="exams"
          groupBy={(r) => r.status}
          groupColorOf={(k) => EXAM_COLORS[k]}
          columns={[
            { key: "type", label: "Type", width: "120px", cell: (r) => r.type },
            { key: "session", label: "Session", width: "120px", cell: (r) => r.session },
            { key: "start", label: "Start", width: "120px", cell: (r) => r.startDate },
            { key: "end", label: "End", width: "120px", cell: (r) => r.endDate },
            { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Exam", value: r.name },
            { label: "Type", value: r.type },
            { label: "Session", value: r.session },
            { label: "Start", value: r.startDate },
            { label: "End", value: r.endDate },
            { label: "Status", value: <StatusPill label={r.status} /> },
          ]}
          emptyTitle="No exams scheduled"
          emptyMessage="No examinations have been scheduled for your class yet."
          minWidth={760}
        />
      </div>

      <div className="px-4 pb-24 sm:px-6">
        {/* DATE SHEET — Admin /exams/schedule, own class only */}
        <Card pad={false} className="mt-2">
          <CardHead title="Date Sheet" subtitle="Paper-wise schedule with room and invigilator" Icon={CalendarDays} />
          {studentExamSchedule.length === 0 ? (
            <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">The date sheet has not been published yet.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="border-y border-[var(--theme-border)] bg-[var(--theme-subtle)] text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">
                    <tr>{["Subject", "Date", "Time", "Room", "Invigilator"].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--theme-border)]">
                    {studentExamSchedule.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--theme-hover)]">
                        <td className="px-4 py-3 font-medium">{s.subject}</td>
                        <td className="px-4 py-3">{s.date}</td>
                        <td className="px-4 py-3">{s.startTime} – {s.endTime}</td>
                        <td className="px-4 py-3">{s.room}</td>
                        <td className="px-4 py-3">{s.invigilator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 p-3 md:hidden">
                {studentExamSchedule.map((s) => (
                  <div key={s.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
                    <p className="text-[15px] font-medium">{s.subject}</p>
                    <p className="mt-0.5 text-[13px] text-[var(--theme-text-muted)]">{s.exam} · {s.date}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-[var(--theme-text-faint)]">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.room}</span>
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{s.invigilator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
