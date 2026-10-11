"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Printer } from "lucide-react";
import { Btn, PageHeader } from "@/components/ui";
import { PortalTimetable } from "@/components/portal/portal-timetable";
import { PortalScopeBar } from "@/components/portal/portal-ui";
import { describeApiError, timetableApi, type TimetableSlotItem } from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

export default function StudentTimetablePage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [slots, setSlots] = useState<TimetableSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) {
      setSlots([]);
      setLoading(profileLoading);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await timetableApi.list({
          cls: student.cls,
          section: student.section,
          branchId: student.branchId || undefined,
        });
        if (!cancelled) setSlots(res.slots ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(describeApiError(err).message);
          setSlots([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student, profileLoading]);

  const today = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()] || "Monday";
  }, []);

  return (
    <>
      <PageHeader
        title="My Timetable"
        subtitle={student ? `Weekly period-wise schedule for ${scopeLabel}.` : "Your class timetable"}
        actions={<Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print</Btn>}
      />

      <div className="px-4 pb-24 sm:px-6">
        {(error || profileError) && (
          <p className="mb-3 text-[13px] text-[var(--theme-danger)]">{error || profileError}</p>
        )}
        <PortalScopeBar
          count={slots.length}
          noun="period slots"
          label={scopeLabel}
          Icon={CalendarClock}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
          {student?.session ? (
            <span className="rounded-full bg-[var(--theme-surface)] px-3 py-1.5 ring-1 ring-[var(--theme-border)]">
              Session {student.session}
            </span>
          ) : null}
          {loading ? (
            <span className="rounded-full bg-[var(--theme-surface)] px-3 py-1.5 ring-1 ring-[var(--theme-border)]">Loading…</span>
          ) : null}
        </div>

        <div className="mt-4 print-area">
          <PortalTimetable
            slots={slots}
            title={`${scopeLabel} weekly timetable`}
            subtitle="Subjects, teachers and rooms for every period."
            highlightDay={today}
          />
        </div>
      </div>
    </>
  );
}
