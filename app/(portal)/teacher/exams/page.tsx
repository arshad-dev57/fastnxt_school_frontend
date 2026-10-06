"use client";

import { Award, CalendarDays, GraduationCap, MapPin, User } from "lucide-react";
import { Card, CardHead, PageHeader, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_TEACHER, teacherExamDuties, teacherExams, teacherResults } from "@/lib/portal-data";

/* Teacher Exams & Results = the Admin /exams, /exams/schedule and /results
   modules limited to this teacher's sections. Marks entry is a Teacher action
   (the Admin exam lifecycle has an explicit "Marks Entry" status). */
const EXAM_COLORS: Record<string, string> = {
  Scheduled: "var(--theme-info)", "Marks Entry": "var(--theme-warning)",
  Verification: "var(--theme-accent-2)", Published: "var(--theme-success)", Draft: "var(--theme-pending)",
};
const gradeColor = (g: string) =>
  g.startsWith("A") ? "var(--theme-success)" : g.startsWith("B") ? "var(--theme-info)" : g.startsWith("C") ? "var(--theme-warning)" : "var(--theme-danger)";

export default function TeacherExamsPage() {
  const avg = teacherResults.length
    ? Math.round((teacherResults.reduce((s, r) => s + r.percentage, 0) / teacherResults.length) * 10) / 10
    : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader title="Exams & Results" subtitle={`Exam lifecycle, duties and class results for ${PORTAL_TEACHER.name}.`} />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Exams" value={teacherExams.length} Icon={GraduationCap} tone="blue" sub="This session" />
        <StatCard label="Marks Entry" value={teacherExams.filter((e) => e.status === "Marks Entry").length} Icon={GraduationCap} tone="orange" sub="Needs your input" />
        <StatCard label="Duties" value={teacherExamDuties.length} Icon={CalendarDays} tone="purple" sub="Invigilation assigned" />
        <StatCard label="Class Average" value={`${avg}%`} Icon={Award} tone="green" sub="Published results" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="Examinations"
          subtitle="Exam lifecycle — schedule, marks entry, verification and publication."
          Icon={GraduationCap}
          nameLabel="Exam"
          rows={teacherExams}
          keyOf={(r) => r.id}
          nameOf={(r) => r.name}
          subtitleOf={(r) => `${r.type} · ${r.session}`}
          searchTextOf={(r) => `${r.name} ${r.type} ${r.session} ${r.status}`}
          searchPlaceholder="Search exam"
          scopeLabel="My campus"
          countNoun="exams"
          groupBy={(r) => r.status}
          groupColorOf={(k) => EXAM_COLORS[k]}
          columns={[
            { key: "type", label: "Type", width: "120px", cell: (r) => r.type },
            { key: "session", label: "Session", width: "120px", cell: (r) => r.session },
            { key: "start", label: "Start", width: "120px", cell: (r) => r.startDate },
            { key: "end", label: "End", width: "120px", cell: (r) => r.endDate },
            { key: "classes", label: "Classes", width: "90px", cell: (r) => r.classes },
            { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Exam", value: r.name },
            { label: "Type", value: r.type },
            { label: "Session", value: r.session },
            { label: "Start", value: r.startDate },
            { label: "End", value: r.endDate },
            { label: "Classes", value: r.classes },
            { label: "Status", value: <StatusPill label={r.status} /> },
          ]}
          menu={(r) => (r.status === "Marks Entry" ? [{ label: "Enter marks", Icon: Award, onClick: () => {} }] : [])}
          emptyTitle="No exams"
          emptyMessage="No examinations are scheduled this session."
          minWidth={860}
        />
      </div>

      <div className="px-4 pb-24 pt-2 sm:px-6">
        {/* INVIGILATION DUTIES — Admin /exams/schedule */}
        <Card pad={false} className="mb-5">
          <CardHead title="My Exam Duties" subtitle="Invigilation assigned to you" Icon={CalendarDays} />
          {teacherExamDuties.length === 0 ? (
            <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">No invigilation duties assigned.</p>
          ) : (
            <div className="divide-y divide-[var(--theme-border)]">
              {teacherExamDuties.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{d.subject}</p>
                    <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{d.exam} · {d.cls}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]"><CalendarDays className="h-3.5 w-3.5" />{d.date}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]"><MapPin className="h-3.5 w-3.5" />{d.room}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]"><User className="h-3.5 w-3.5" />{d.invigilator}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CLASS RESULTS — Admin /results, own sections */}
        <Card pad={false}>
          <CardHead title="Class Results" subtitle="Published results for your sections" Icon={Award} />
          {teacherResults.length === 0 ? (
            <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">No results published for your sections yet.</p>
          ) : (
            <div className="divide-y divide-[var(--theme-border)]">
              {teacherResults.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.student}</p>
                    <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{r.cls}-{r.section} · {r.exam}</p>
                  </div>
                  <div className="w-32 shrink-0"><ProgressMeter value={r.percentage} tone={gradeColor(r.grade)} label={`${r.percentage}%`} /></div>
                  <span className="w-10 shrink-0 text-right text-[14px] font-semibold" style={{ color: gradeColor(r.grade) }}>{r.grade}</span>
                  <span className="w-12 shrink-0 text-right text-[13px] text-[var(--theme-text-muted)]">#{r.position}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
