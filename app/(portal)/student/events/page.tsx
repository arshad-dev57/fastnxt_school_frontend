"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge, Card, CardHead, PageHeader } from "@/components/ui";
import { CalendarBoard } from "@/components/board-views";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_STUDENT, studentEvents } from "@/lib/portal-data";

/* Student Events = the Admin /events module, upcoming entries only. */
const COLORS: Record<string, string> = {
  Upcoming: "var(--theme-info)", Ongoing: "var(--theme-warning)", Completed: "var(--theme-success)",
};

export default function StudentEventsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader title="Events" subtitle="Sports day, exhibitions, competitions and the school calendar." />

      <div className="px-4 pt-4 sm:px-6">
        <Card pad={false} className="mb-5">
          <CardHead title="Event Calendar" subtitle="All upcoming events on one grid" Icon={CalendarDays} />
          <div className="p-3">
            <CalendarBoard
              items={studentEvents}
              getDate={(e) => e.startDate}
              initialMonth="2026-02"
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
        rows={studentEvents}
        keyOf={(r) => r.id}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.type} · ${r.audience}`}
        searchTextOf={(r) => `${r.title} ${r.type} ${r.venue} ${r.audience}`}
        searchPlaceholder="Search event"
        scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
        countNoun="events"
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        columns={[
          { key: "type", label: "Type", width: "120px", cell: (r) => <Badge label={r.type} tone="purple" /> },
          { key: "start", label: "Starts", width: "120px", cell: (r) => r.startDate },
          { key: "end", label: "Ends", width: "120px", cell: (r) => r.endDate },
          { key: "venue", label: "Venue", width: "minmax(150px,1fr)", cell: (r) => (
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />{r.venue}</span>
          ) },
          { key: "audience", label: "Audience", width: "150px", cell: (r) => (
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />{r.audience}</span>
          ) },
          { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Title", value: r.title },
          { label: "Type", value: r.type },
          { label: "Start Date", value: r.startDate },
          { label: "End Date", value: r.endDate },
          { label: "Venue", value: r.venue },
          { label: "Audience", value: r.audience },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No upcoming events"
        emptyMessage="Nothing is scheduled on the school calendar right now."
        minWidth={980}
      />
      <div className="h-24" />
    </div>
  );
}
