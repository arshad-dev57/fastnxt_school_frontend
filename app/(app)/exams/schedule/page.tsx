"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { EXAM_SCHEDULE, type ExamScheduleRow } from "@/lib/school-mock-data";

export default function ExamSchedulePage() {
  return (
    <BranchBoard<ExamScheduleRow>
      title="Examination Date Sheet"
      subtitle="Subject-wise exam timetable with halls and invigilators for the campus."
      Icon={CalendarDays}
      nameLabel="Paper"
      countNoun="papers"
      rows={EXAM_SCHEDULE}
      groupBy={(r) => r.exam}
      nameOf={(r) => `${r.cls} · ${r.subject}`}
      subtitleOf={(r) => `${r.date} · ${r.startTime}–${r.endTime}`}
      searchTextOf={(r) => `${r.cls} ${r.subject} ${r.exam} ${r.room} ${r.invigilator}`}
      primaryAction={
        <Link href="/exams" className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
          ← All Exams
        </Link>
      }
      columns={[
        { key: "date", label: "Date", width: "130px", cell: (r) => r.date },
        { key: "time", label: "Time", width: "140px", cell: (r) => `${r.startTime}–${r.endTime}` },
        { key: "room", label: "Hall", width: "110px", cell: (r) => r.room },
        { key: "inv", label: "Invigilator", width: "minmax(140px,1fr)", cell: (r) => r.invigilator },
      ]}
      detailFields={(r) => [
        { label: "Exam", value: r.exam },
        { label: "Class", value: r.cls },
        { label: "Subject", value: r.subject },
        { label: "Date", value: r.date },
        { label: "Time", value: `${r.startTime} – ${r.endTime}` },
        { label: "Hall", value: r.room },
        { label: "Invigilator", value: r.invigilator },
      ]}
      mobileRows={(r) => [
        { label: "Date", value: r.date },
        { label: "Time", value: `${r.startTime}–${r.endTime}` },
        { label: "Hall", value: r.room },
        { label: "Invigilator", value: r.invigilator },
      ]}
      emptyTitle="No scheduled papers"
      emptyMessage="No exam papers match the current campus scope."
    />
  );
}
