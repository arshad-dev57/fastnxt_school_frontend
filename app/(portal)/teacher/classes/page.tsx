"use client";

import { CalendarCheck, School, Users } from "lucide-react";
import { Avatar, Card, CardHead, PageHeader, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { PORTAL_TEACHER, TEACHER_META, attendanceRate, teacherAttendanceRegister, teacherClasses, teacherTimetable } from "@/lib/portal-data";

/* Teacher Classes = the Admin /classes module restricted to sections this
   teacher owns (role scope "own"). The Admin ClassRow names a class teacher;
   here the same sections are derived from the Admin timetable. */
export default function TeacherClassesPage() {
  const totalStudents = teacherClasses.reduce((n, c) => n + c.students, 0);
  const rate = attendanceRate(teacherAttendanceRegister);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader title="My Classes" subtitle={`Sections assigned to ${PORTAL_TEACHER.name} · ${TEACHER_META.campus}`} />

      <div className="grid grid-cols-3 gap-3 px-4 pt-4 sm:px-6">
        <StatCard label="Sections" value={teacherClasses.length} Icon={School} tone="blue" sub="Taught by you" />
        <StatCard label="Students" value={totalStudents} Icon={Users} tone="purple" sub="Total enrolment" />
        <StatCard label="Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub="Latest register" />
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <Card pad={false} className="mb-5">
          <CardHead title="Section overview" subtitle="Roster size, attendance and weekly periods" Icon={School} />
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {teacherClasses.map((c) => {
              const periods = teacherTimetable.filter((s) => s.cls === c.cls && s.section === c.section).length;
              const att = attendanceRate(teacherAttendanceRegister.filter((r) => r.cls === c.cls && r.section === c.section));
              return (
                <div key={c.label} className="rounded-lg border border-[var(--theme-border)] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                      <School className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold">{c.label}</p>
                      <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{periods} periods / week</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <ProgressMeter value={att} label={`${att}%`} />
                    <p className="text-[12px] text-[var(--theme-text-faint)]">{c.students} students enrolled</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <PortalBoard
        title="Class Register"
        subtitle="Students in your own sections, straight from the Admin student directory."
        Icon={Users}
        nameLabel="Student"
        rows={teacherClasses.flatMap((c) => c.members)}
        keyOf={(r) => r.id}
        nameOf={(r) => r.name}
        subtitleOf={(r) => `${r.cls}-${r.section} · ${r.id}`}
        searchTextOf={(r) => `${r.name} ${r.id} ${r.cls} ${r.section} ${r.guardian}`}
        searchPlaceholder="Search student"
        scopeLabel="My sections"
        countNoun="students"
        groupBy={(r) => `${r.cls}-${r.section}`}
        groupColorOf={() => "var(--theme-primary)"}
        columns={[
          { key: "id", label: "Student ID", width: "120px", cell: (r) => r.id },
          { key: "cls", label: "Class", width: "120px", cell: (r) => `${r.cls}-${r.section}` },
          { key: "gender", label: "Gender", width: "100px", cell: (r) => r.gender },
          { key: "guardian", label: "Guardian", width: "minmax(150px,1fr)", cell: (r) => r.guardian },
          { key: "contact", label: "Phone", width: "150px", cell: (r) => r.contact },
          { key: "status", label: "Status", width: "120px", cell: (r) => (
            <span className={r.status === "Active" ? "text-[var(--theme-success-text)]" : "text-[var(--theme-text-muted)]"}>{r.status}</span>
          ) },
        ]}
        detailFields={(r) => [
          { label: "Student ID", value: r.id },
          { label: "Name", value: <span className="flex items-center gap-2"><Avatar name={r.name} size={24} />{r.name}</span> },
          { label: "Class", value: `${r.cls}-${r.section}` },
          { label: "Gender", value: r.gender },
          { label: "Guardian", value: r.guardian },
          { label: "Phone", value: r.contact },
          { label: "Admission Date", value: r.admissionDate },
          { label: "Status", value: r.status },
        ]}
        emptyTitle="No students"
        emptyMessage="No students are assigned to your sections yet."
        minWidth={900}
      />
    </div>
  );
}
