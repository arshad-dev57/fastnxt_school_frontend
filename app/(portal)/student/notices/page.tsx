"use client";

import { Megaphone, Users } from "lucide-react";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_STUDENT, studentNotices } from "@/lib/portal-data";

/* Student Notices = the Admin /communication module, read-only. The Student
   role holds only "view" on communication, so there is no compose action here. */
const COLORS: Record<string, string> = {
  Draft: "var(--theme-pending)", Scheduled: "var(--theme-info)",
  Sent: "var(--theme-success)", Failed: "var(--theme-danger)",
};

export default function StudentNoticesPage() {
  return (
    <PortalBoard
      title="Notices"
      subtitle="Circulars and announcements published for students and parents."
      Icon={Megaphone}
      nameLabel="Notice"
      rows={studentNotices}
      keyOf={(r) => r.id}
      nameOf={(r) => r.title}
      subtitleOf={(r) => `${r.type} · to ${r.audience}`}
      searchTextOf={(r) => `${r.title} ${r.audience} ${r.channel} ${r.type}`}
      searchPlaceholder="Search notice"
      scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
      countNoun="notices"
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      columns={[
        { key: "type", label: "Type", width: "130px", cell: (r) => r.type },
        { key: "channel", label: "Channel", width: "140px", cell: (r) => r.channel },
        { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
        { key: "audience", label: "Audience", width: "minmax(150px,1fr)", cell: (r) => (
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />{r.audience}</span>
        ) },
        { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Title", value: r.title },
        { label: "Type", value: r.type },
        { label: "Audience", value: r.audience },
        { label: "Channel", value: r.channel },
        { label: "Date", value: r.date },
        { label: "Reach", value: r.reach.toLocaleString() },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No notices"
      emptyMessage="No notices have been published for students yet."
      minWidth={880}
    />
  );
}
