"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusPill } from "@/components/board-kit";
import { Btn } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  onlineClassesApi,
  type OnlineClassItem,
} from "@/lib/auth/api-client";
import { formatOnlineClassWhen } from "@/lib/online-classes";

export default function OnlineClassAttendanceReportsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<OnlineClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await onlineClassesApi.list({
        branchId: currentBranchId,
        bucket: "completed",
        sort: "desc",
      });
      setRows(res.classes || []);
      setError(null);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await onlineClassesApi.syncAttendance(id);
      alert(`Synced ${res.matched} record(s). Unmatched: ${res.unmatched?.length || 0}.`);
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold">Attendance Reports</h1>
          <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
            Sync Google Meet participant sessions into student attendance. Unmatched participants stay Pending Verification.
          </p>
        </div>
        <Btn
          onClick={async () => {
            try {
              const res = await onlineClassesApi.syncDue();
              alert(`Processed ${res.processed} class(es). Reminders sent: ${res.reminders?.notified ?? 0}.`);
              await load();
            } catch (err) {
              alert(describeApiError(err).message);
            }
          }}
        >
          Sync due classes
        </Btn>
      </div>
      {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
      {loading ? (
        <p className="text-[13px] text-[var(--theme-text-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[13px] text-[var(--theme-text-muted)]">No completed classes yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--theme-border)] rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={`/online-classes/${row.id}`} className="font-medium hover:underline">
                  {row.title}
                </Link>
                <div className="text-[12px] text-[var(--theme-text-muted)]">
                  {row.cls}-{row.section} · {formatOnlineClassWhen(row.scheduledAt, row.timezone)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill label={row.status} />
                <Btn size="sm" onClick={() => sync(row.id)} loading={syncingId === row.id}>
                  Sync
                </Btn>
                <Link href={`/online-classes/${row.id}`} className="text-[12px] underline">
                  Review
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
