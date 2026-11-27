"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Video } from "lucide-react";
import { Card, StatCard } from "@/components/ui";
import { OnlineClassList } from "@/components/online-classes/online-class-list";
import { useBranch } from "@/lib/branch-context";
import { describeApiError, onlineClassesApi, type OnlineClassDashboard } from "@/lib/auth/api-client";

export default function OnlineClassesDashboardPage() {
  const { currentBranchId } = useBranch();
  const [dash, setDash] = useState<OnlineClassDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await onlineClassesApi.dashboard({ branchId: currentBranchId });
      setDash(res);
      setError(null);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  }, [currentBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  const s = dash?.summary;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--theme-text)]">Online Classes</h1>
          <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
            Google Meet–backed live sessions with attendance sync.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/online-classes/settings"
            className="inline-flex h-9 items-center rounded border border-[var(--theme-border)] px-3.5 text-[14px]"
          >
            Google Account
          </Link>
          <Link
            href="/online-classes/new"
            className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white"
          >
            <Video className="h-4 w-4" /> Create Online Class
          </Link>
        </div>
      </div>

      {error ? (
        <p className="px-4 text-[13px] text-[var(--theme-danger)] sm:px-6">{error}</p>
      ) : null}

      <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        <StatCard label="Total" value={String(s?.total ?? "—")} />
        <StatCard label="Upcoming" value={String(s?.upcoming ?? "—")} />
        <StatCard label="Live" value={String(s?.live ?? "—")} />
        <StatCard label="Completed" value={String(s?.completed ?? "—")} />
        <StatCard label="Attendance rate" value={s ? `${s.attendanceRate}%` : "—"} />
      </div>

      <div className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        {[
          { href: "/online-classes/upcoming", label: "Upcoming Classes" },
          { href: "/online-classes/live", label: "Live Classes" },
          { href: "/online-classes/completed", label: "Completed" },
          { href: "/online-classes/attendance", label: "Attendance Reports" },
        ].map((item) => (
          <Card key={item.href} className="!p-0">
            <Link href={item.href} className="block px-4 py-3 text-[14px] font-medium hover:bg-[var(--theme-sidebar)]">
              {item.label}
            </Link>
          </Card>
        ))}
      </div>

      <OnlineClassList
        title="Recent & all classes"
        subtitle="Filter by status or search across the campus."
        canManage
        basePath="/online-classes"
      />
    </div>
  );
}
