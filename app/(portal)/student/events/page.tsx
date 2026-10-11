"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/ui";
import { CalendarBoard } from "@/components/board-views";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { describeApiError, eventsApi, type EventItem } from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

const COLORS: Record<string, string> = {
  Upcoming: "var(--theme-info)",
  Ongoing: "var(--theme-warning)",
  Completed: "var(--theme-success)",
};

export default function StudentEventsPage() {
  const { student, scopeLabel } = useMyStudent();
  const [rows, setRows] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventsApi.list({
          branchId: student?.branchId || undefined,
        });
        if (!cancelled) setRows(res.events ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(describeApiError(err).message);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student?.branchId]);

  const initialMonth = useMemo(() => {
    const d = rows[0]?.startDate || new Date().toISOString().slice(0, 10);
    return d.slice(0, 7);
  }, [rows]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader title="Events" subtitle="Sports day, exhibitions, competitions and the school calendar." />

      {error ? (
        <p className="px-4 pt-2 text-[13px] text-[var(--theme-danger)] sm:px-6">{error}</p>
      ) : null}

      <div className="px-4 pt-4 sm:px-6">
        <Card pad={false} className="mb-5">
          <CardHead title="Event Calendar" subtitle={loading ? "Loading…" : "All upcoming events on one grid"} Icon={CalendarDays} />
          <div className="p-3">
            <CalendarBoard
              items={rows}
              getDate={(e) => e.startDate}
              initialMonth={initialMonth}
              renderChip={(e) => (
                <span className="block truncate rounded bg-[var(--theme-primary-soft)] px-1.5 py-1 text-[11px] font-medium text-[var(--theme-primary-hover)]">
                  {e.title}
                </span>
              )}
            />
          </div>
        </Card>
      </div>

      <PortalBoard
        title="All Events"
        subtitle="Upcoming events with venue, audience and status."
        Icon={CalendarDays}
        nameLabel="Event"
        rows={rows}
        keyOf={(r) => r.id}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.type} · ${r.audience}`}
        searchTextOf={(r) => `${r.title} ${r.type} ${r.venue} ${r.audience}`}
        searchPlaceholder="Search event"
        scopeLabel={scopeLabel}
        countNoun="events"
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        columns={[
          { key: "type", label: "Type", width: "130px", cell: (r) => r.type },
          { key: "start", label: "Start", width: "120px", cell: (r) => r.startDate },
          { key: "end", label: "End", width: "120px", cell: (r) => r.endDate },
          {
            key: "venue",
            label: "Venue",
            width: "minmax(140px,1fr)",
            cell: (r) => (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />
                {r.venue || "—"}
              </span>
            ),
          },
          {
            key: "audience",
            label: "Audience",
            width: "140px",
            cell: (r) => (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />
                {r.audience}
              </span>
            ),
          },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Title", value: r.title },
          { label: "Type", value: r.type },
          { label: "Start", value: r.startDate },
          { label: "End", value: r.endDate },
          { label: "Venue", value: r.venue || "—" },
          { label: "Audience", value: r.audience },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No events"
        emptyMessage="No school events have been published yet."
      />
    </div>
  );
}
