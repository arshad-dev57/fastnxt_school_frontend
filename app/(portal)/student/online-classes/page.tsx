"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OnlineClassList } from "@/components/online-classes/online-class-list";
import { describeApiError, onlineClassesApi, type OnlineClassItem } from "@/lib/auth/api-client";
import { formatOnlineClassWhen, isTodayInTz } from "@/lib/online-classes";
import { StatusPill } from "@/components/board-kit";

export default function StudentOnlineClassesPage() {
  const [today, setToday] = useState<OnlineClassItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    try {
      const res = await onlineClassesApi.list({ sort: "asc" });
      setToday((res.classes || []).filter((c) => isTodayInTz(c.scheduledAt, c.timezone) && c.status !== "Cancelled"));
      setError(null);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const live = useMemo(() => today.filter((c) => c.status === "Live"), [today]);

  return (
    <div className="space-y-6 pb-10">
      <div className="px-4 pt-4 sm:px-6">
        <h1 className="text-[22px] font-semibold">Online Classes</h1>
        <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
          Today&apos;s sessions, live classes, and upcoming Google Meet lessons for your section.
        </p>
      </div>

      {error ? <p className="px-4 text-[13px] text-[var(--theme-danger)] sm:px-6">{error}</p> : null}

      <section className="px-4 sm:px-6">
        <h2 className="mb-2 text-[14px] font-semibold">Today</h2>
        {today.length === 0 ? (
          <p className="text-[13px] text-[var(--theme-text-muted)]">No online classes scheduled for today.</p>
        ) : (
          <ul className="divide-y divide-[var(--theme-border)] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
            {today.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px]">
                <div>
                  <Link href={`/student/online-classes/${row.id}`} className="font-medium hover:underline">
                    {row.title}
                  </Link>
                  <div className="text-[12px] text-[var(--theme-text-muted)]">
                    {row.subjectName || "General"} · {row.teacherName} · {formatOnlineClassWhen(row.scheduledAt, row.timezone)} · {row.durationMinutes} min
                  </div>
                </div>
                <StatusPill label={row.status} />
              </li>
            ))}
          </ul>
        )}
        {live.length ? (
          <p className="mt-2 text-[12px] text-[var(--theme-warning)]">{live.length} live now — open a class to join.</p>
        ) : null}
      </section>

      <OnlineClassList
        title="All my online classes"
        subtitle="Upcoming, live, and completed sessions you are enrolled in."
        basePath="/student/online-classes"
        showJoin
      />
    </div>
  );
}
