"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, ExternalLink, RefreshCw, Video } from "lucide-react";
import { Btn, SearchBox, Select } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  onlineClassesApi,
  type OnlineClassItem,
} from "@/lib/auth/api-client";
import {
  formatOnlineClassWhen,
  onlineClassSearchText,
} from "@/lib/online-classes";

type Bucket = "all" | "upcoming" | "live" | "completed" | "history";

type Props = {
  title: string;
  subtitle?: string;
  bucket?: Bucket;
  basePath?: string;
  canManage?: boolean;
  showJoin?: boolean;
};

const STATUS_OPTIONS = ["Scheduled", "Live", "Completed", "Cancelled"] as const;

export function OnlineClassList({
  title,
  subtitle,
  bucket = "all",
  basePath = "/online-classes",
  canManage = false,
  showJoin = false,
}: Props) {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<OnlineClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onlineClassesApi.list({
        branchId: currentBranchId,
        bucket: bucket === "all" ? undefined : bucket,
        status: status || undefined,
        sort: "asc",
      });
      setRows(res.classes || []);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, bucket, status]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => onlineClassSearchText(r).toLowerCase().includes(needle));
  }, [rows, q]);

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      const res = await onlineClassesApi.join(id);
      if (res.meetingUrl) window.open(res.meetingUrl, "_blank", "noopener,noreferrer");
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-4 px-4 pb-10 pt-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--theme-text)]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="ghost" onClick={load} disabled={loading} Icon={RefreshCw}>
            Refresh
          </Btn>
          {canManage ? (
            <Link
              href={`${basePath}/new`}
              className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Video className="h-4 w-4" /> Create Class
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search title, subject, teacher…" className="min-w-[220px] flex-1" />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[...STATUS_OPTIONS]}
          placeholder="All statuses"
          className="w-[160px]"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-[var(--theme-danger)]/30 bg-[var(--theme-danger)]/10 px-3 py-2 text-[13px] text-[var(--theme-danger)]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-[var(--theme-border)] px-4 py-10 text-center text-[13px] text-[var(--theme-text-muted)]">
          Loading online classes…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--theme-border)] px-4 py-10 text-center">
          <CalendarClock className="mx-auto mb-2 h-8 w-8 text-[var(--theme-text-muted)]" />
          <p className="text-[14px] font-medium text-[var(--theme-text)]">No online classes found</p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
            {canManage ? "Create a class after connecting Google Meet in settings." : "Check back when your teacher schedules a session."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_110px_120px] gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)] md:grid">
            <span>Class</span>
            <span>When</span>
            <span>Teacher / Subject</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <ul className="divide-y divide-[var(--theme-border)]">
            {filtered.map((row) => (
              <li key={row.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1.4fr_1fr_1fr_110px_120px] md:items-center md:gap-3">
                <div>
                  <Link href={`${basePath}/${row.id}`} className="font-semibold text-[var(--theme-text)] hover:underline">
                    {row.title}
                  </Link>
                  <div className="text-[12px] text-[var(--theme-text-muted)]">
                    {row.cls}-{row.section} · {row.durationMinutes} min
                  </div>
                </div>
                <div className="text-[13px] text-[var(--theme-text)]">
                  {formatOnlineClassWhen(row.scheduledAt, row.timezone)}
                </div>
                <div className="text-[13px]">
                  <div className="text-[var(--theme-text)]">{row.teacherName || "—"}</div>
                  <div className="text-[12px] text-[var(--theme-text-muted)]">{row.subjectName || "General"}</div>
                </div>
                <div>
                  <StatusPill label={row.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`${basePath}/${row.id}`}
                    className="inline-flex h-8 items-center rounded border border-[var(--theme-border)] px-2.5 text-[12px] text-[var(--theme-text)] hover:bg-[var(--theme-sidebar)]"
                  >
                    View
                  </Link>
                  {showJoin && row.status !== "Cancelled" && row.meetingUrl ? (
                    <button
                      type="button"
                      disabled={joiningId === row.id}
                      onClick={() => handleJoin(row.id)}
                      className="inline-flex h-8 items-center gap-1 rounded bg-[var(--theme-primary)] px-2.5 text-[12px] font-medium text-white disabled:opacity-60"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {joiningId === row.id ? "…" : "Join"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
