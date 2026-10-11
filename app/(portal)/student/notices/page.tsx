"use client";

import { useEffect, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { describeApiError, noticesApi, type NoticeItem } from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

const COLORS: Record<string, string> = {
  Draft: "var(--theme-pending)",
  Scheduled: "var(--theme-info)",
  Sent: "var(--theme-success)",
  Published: "var(--theme-success)",
  Failed: "var(--theme-danger)",
};

export default function StudentNoticesPage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [rows, setRows] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (profileLoading) {
        setLoading(true);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await noticesApi.list({
          cls: student?.cls,
          section: student?.section,
          branchId: student?.branchId || undefined,
        });
        const visible = (res.notices ?? []).filter((n) => {
          const st = (n.status || "").toLowerCase();
          if (st === "draft") return false;
          const aud = (n.audience || "").toLowerCase();
          if (aud && !["students", "all", "parents", "everyone", "both"].some((a) => aud.includes(a))) {
            return false;
          }
          return true;
        });
        if (!cancelled) setRows(visible);
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
  }, [student, profileLoading]);

  return (
    <>
      {(error || profileError) && (
        <p className="px-4 pt-3 text-[13px] text-[var(--theme-danger)] sm:px-6">{error || profileError}</p>
      )}
      <PortalBoard
        title="Notices"
        subtitle={loading ? "Loading notices…" : "Circulars and announcements for students and parents."}
        Icon={Megaphone}
        nameLabel="Notice"
        rows={rows}
        keyOf={(r) => r.id}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.type} · to ${r.audience}`}
        searchTextOf={(r) => `${r.title} ${r.audience} ${r.channel} ${r.type} ${r.content || ""}`}
        searchPlaceholder="Search notice"
        scopeLabel={scopeLabel}
        countNoun="notices"
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        columns={[
          { key: "type", label: "Type", width: "130px", cell: (r) => r.type },
          { key: "channel", label: "Channel", width: "140px", cell: (r) => r.channel },
          { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
          {
            key: "audience",
            label: "Audience",
            width: "minmax(150px,1fr)",
            cell: (r) => (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />
                {r.audience}
              </span>
            ),
          },
          { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Title", value: r.title },
          { label: "Type", value: r.type },
          { label: "Audience", value: r.audience },
          { label: "Channel", value: r.channel },
          { label: "Date", value: r.date },
          { label: "Content", value: r.content || "—" },
          { label: "Reach", value: String(r.reach ?? 0) },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No notices"
        emptyMessage="No published notices for your class right now."
      />
    </>
  );
}
