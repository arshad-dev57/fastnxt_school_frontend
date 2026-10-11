"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, GraduationCap, MapPin, User } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import {
  describeApiError,
  examsApi,
  type ExamItem,
  type ExamSlotItem,
} from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

const EXAM_COLORS: Record<string, string> = {
  Scheduled: "var(--theme-info)",
  "Marks Entry": "var(--theme-warning)",
  Verification: "var(--theme-accent-2)",
  Published: "var(--theme-success)",
  Draft: "var(--theme-pending)",
  Notified: "var(--theme-accent-2)",
};

export default function StudentExamsPage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [slots, setSlots] = useState<ExamSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!student) {
      setExams([]);
      setSlots([]);
      setLoading(profileLoading);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [exRes, slotRes] = await Promise.all([
        examsApi.list({ branchId: student.branchId || undefined }),
        examsApi.listSlots({ branchId: student.branchId || undefined }),
      ]);
      const visible = (exRes.exams ?? []).filter((e) => e.status !== "Draft");
      setExams(visible);
      const classSlots = (slotRes.slots ?? []).filter((s) => {
        const clsMatch = s.cls.toLowerCase() === student.cls.toLowerCase();
        const sec = (s.section || "").trim();
        if (!sec) return clsMatch;
        return clsMatch && sec.toLowerCase() === student.section.toLowerCase();
      });
      setSlots(classSlots);
    } catch (err) {
      setError(describeApiError(err).message);
      setExams([]);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [student, profileLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const myExams = useMemo(() => {
    if (!slots.length) {
      return exams.filter((e) => {
        if (!e.classes?.length) return true;
        return e.classes.some((c) => c.toLowerCase() === (student?.cls || "").toLowerCase());
      });
    }
    const ids = new Set(slots.map((s) => s.examId));
    const matched = exams.filter((e) => ids.has(e.id));
    return matched.length ? matched : exams;
  }, [exams, slots, student?.cls]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Examinations"
        subtitle={`Exam schedule and date sheet for ${scopeLabel}.`}
      />

      {(error || profileError) ? (
        <p className="px-4 pt-2 text-[13px] text-[var(--theme-danger)] sm:px-6">{error || profileError}</p>
      ) : null}

      <div className="mt-2">
        <PortalBoard
          title="My Exams"
          subtitle={loading ? "Loading…" : "Exams your class sits, with type, session and current status."}
          Icon={GraduationCap}
          nameLabel="Exam"
          rows={myExams}
          keyOf={(r) => r.id}
          nameOf={(r) => r.name}
          subtitleOf={(r) => `${r.type} · ${r.session}`}
          searchTextOf={(r) => `${r.name} ${r.type} ${r.session} ${r.status}`}
          searchPlaceholder="Search exam"
          scopeLabel={scopeLabel}
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
            { label: "Status", value: r.status },
          ]}
          emptyTitle="No exams scheduled"
          emptyMessage="No examinations have been scheduled for your class yet."
          minWidth={760}
        />
      </div>

      <div className="px-4 pb-24 sm:px-6">
        <Card pad={false} className="mt-2">
          <CardHead
            title="Date Sheet"
            subtitle="Paper-wise schedule with room and invigilator"
            Icon={CalendarDays}
          />
          {slots.length === 0 ? (
            <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
              The date sheet has not been published yet.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="border-y border-[var(--theme-border)] bg-[var(--theme-subtle)] text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">
                    <tr>
                      {["Subject", "Date", "Time", "Room", "Invigilator"].map((h) => (
                        <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--theme-border)]">
                    {slots.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--theme-hover)]">
                        <td className="px-4 py-3 font-medium">{s.subject}</td>
                        <td className="px-4 py-3">{s.date}</td>
                        <td className="px-4 py-3">{s.startTime} – {s.endTime}</td>
                        <td className="px-4 py-3">{s.room || "—"}</td>
                        <td className="px-4 py-3">{s.invigilator || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-[var(--theme-border)] md:hidden">
                {slots.map((s) => (
                  <div key={s.id} className="flex flex-col gap-1 px-4 py-3">
                    <p className="font-medium">{s.subject}</p>
                    <p className="flex items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {s.date} · {s.startTime}–{s.endTime}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]">
                      <MapPin className="h-3.5 w-3.5" />
                      {s.room || "—"}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]">
                      <User className="h-3.5 w-3.5" />
                      {s.invigilator || "—"}
                    </p>
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
