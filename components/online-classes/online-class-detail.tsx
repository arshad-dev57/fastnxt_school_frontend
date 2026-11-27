"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Btn, Field, Input, Select, Textarea } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import {
  describeApiError,
  onlineClassesApi,
  type OnlineClassItem,
  type OnlineClassParticipant,
} from "@/lib/auth/api-client";
import { formatOnlineClassWhen } from "@/lib/online-classes";

type Props = {
  id: string;
  basePath: string;
  canManage?: boolean;
  showJoin?: boolean;
};

const ATTENDANCE_OPTIONS = ["Present", "Late", "Absent", "Partial", "Pending Verification"] as const;

export function OnlineClassDetail({ id, basePath, canManage = false, showJoin = false }: Props) {
  const [row, setRow] = useState<OnlineClassItem | null>(null);
  const [participants, setParticipants] = useState<OnlineClassParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", scheduledLocal: "", durationMinutes: "45" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onlineClassesApi.get(id);
      setRow(res.class);
      setParticipants(res.participants || []);
      const local = res.class.scheduledAt ? new Date(res.class.scheduledAt) : null;
      const pad = (n: number) => String(n).padStart(2, "0");
      const scheduledLocal = local
        ? `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`
        : "";
      setDraft({
        title: res.class.title,
        description: res.class.description || "",
        scheduledLocal,
        durationMinutes: String(res.class.durationMinutes || 45),
      });
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async () => {
    setBusy(true);
    try {
      const res = await onlineClassesApi.join(id);
      if (res.meetingUrl) window.open(res.meetingUrl, "_blank", "noopener,noreferrer");
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!row) return;
    setBusy(true);
    try {
      await onlineClassesApi.update(id, {
        title: draft.title,
        description: draft.description,
        durationMinutes: Math.max(15, Number(draft.durationMinutes) || 45),
        scheduledAt: draft.scheduledLocal ? new Date(draft.scheduledLocal).toISOString() : row.scheduledAt,
      });
      setEditing(false);
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    const reason = prompt("Cancellation reason (optional)") || undefined;
    setBusy(true);
    try {
      await onlineClassesApi.cancel(id, reason);
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const syncAttendance = async () => {
    setBusy(true);
    try {
      const res = await onlineClassesApi.syncAttendance(id);
      alert(`Sync finished. Matched ${res.matched} participant(s). Unmatched: ${res.unmatched?.length || 0}.`);
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const correct = async (participantId: string, attendanceStatus: string) => {
    try {
      await onlineClassesApi.correctParticipant(participantId, { attendanceStatus });
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  if (loading) {
    return <div className="px-4 py-10 text-center text-[13px] text-[var(--theme-text-muted)]">Loading class…</div>;
  }
  if (error || !row) {
    return (
      <div className="space-y-3 px-4 py-6 sm:px-6">
        <p className="text-[13px] text-[var(--theme-danger)]">{error || "Class not found."}</p>
        <Link href={basePath} className="text-[13px] underline">
          Back to Online Classes
        </Link>
      </div>
    );
  }

  const canJoinNow = row.status !== "Cancelled" && Boolean(row.meetingUrl);

  return (
    <div className="space-y-5 px-4 pb-12 pt-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={basePath} className="text-[12px] text-[var(--theme-text-muted)] hover:underline">
            ← Online Classes
          </Link>
          <h1 className="mt-1 text-[22px] font-semibold text-[var(--theme-text)]">{row.title}</h1>
          <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
            {row.cls}-{row.section} · {row.subjectName || "General"} · {row.teacherName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={row.status} />
          {showJoin && canJoinNow ? (
            <Btn variant="primary" onClick={join} loading={busy} Icon={ExternalLink}>
              Join Class
            </Btn>
          ) : null}
          {canManage ? (
            <>
              <Btn variant="secondary" onClick={() => setEditing((v) => !v)} disabled={busy}>
                {editing ? "Close edit" : "Edit / Reschedule"}
              </Btn>
              <Btn variant="secondary" onClick={syncAttendance} loading={busy} Icon={RefreshCw}>
                Sync Attendance
              </Btn>
              {row.status !== "Cancelled" ? (
                <Btn variant="danger" onClick={cancel} disabled={busy}>
                  Cancel
                </Btn>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-[13px]">
          <h2 className="mb-3 text-[14px] font-semibold">Class details</h2>
          {editing ? (
            <div className="space-y-3">
              <Field label="Title">
                <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
              </Field>
              <Field label="Scheduled at">
                <Input
                  type="datetime-local"
                  value={draft.scheduledLocal}
                  onChange={(e) => setDraft((d) => ({ ...d, scheduledLocal: e.target.value }))}
                />
              </Field>
              <Field label="Duration (minutes)">
                <Input
                  type="number"
                  min={15}
                  value={draft.durationMinutes}
                  onChange={(e) => setDraft((d) => ({ ...d, durationMinutes: e.target.value }))}
                />
              </Field>
              <Field label="Description">
                <Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              </Field>
              <Btn variant="primary" onClick={save} loading={busy}>
                Save changes
              </Btn>
            </div>
          ) : (
            <dl className="space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--theme-text-muted)]">When</dt>
                <dd>{formatOnlineClassWhen(row.scheduledAt, row.timezone)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--theme-text-muted)]">Duration</dt>
                <dd>{row.durationMinutes} minutes</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--theme-text-muted)]">Timezone</dt>
                <dd>{row.timezone}</dd>
              </div>
              <div>
                <dt className="mb-1 text-[var(--theme-text-muted)]">Instructions</dt>
                <dd className="whitespace-pre-wrap">{row.description || "—"}</dd>
              </div>
              {row.cancelReason ? (
                <div>
                  <dt className="mb-1 text-[var(--theme-text-muted)]">Cancel reason</dt>
                  <dd>{row.cancelReason}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>

        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-[13px]">
          <h2 className="mb-3 text-[14px] font-semibold">Meeting</h2>
          <dl className="space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--theme-text-muted)]">Meet code</dt>
              <dd className="font-mono">{row.meetingCode || "—"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[var(--theme-text-muted)]">Meeting URL</dt>
              <dd className="break-all">
                {row.meetingUrl ? (
                  <a href={row.meetingUrl} target="_blank" rel="noreferrer" className="text-[var(--theme-primary)] underline">
                    {row.meetingUrl}
                  </a>
                ) : (
                  "Not available"
                )}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-[var(--theme-text-muted)]">Space</dt>
              <dd className="break-all font-mono text-[12px]">{row.meetingSpaceName || "—"}</dd>
            </div>
          </dl>
          {showJoin ? (
            <div className="mt-4 rounded-lg bg-[var(--theme-sidebar)] p-3 text-[12px] text-[var(--theme-text-muted)]">
              Join opens 15 minutes before the scheduled start. Your join attempt is recorded for attendance.
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="border-b border-[var(--theme-border)] px-4 py-3">
          <h2 className="text-[14px] font-semibold">Enrolled students / attendance</h2>
        </div>
        {participants.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[var(--theme-text-muted)]">No participants enrolled yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--theme-border)]">
            {participants.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <div>
                  <div className="font-medium text-[var(--theme-text)]">
                    {p.studentName}
                    {p.studentCode ? ` · ${p.studentCode}` : ""}
                  </div>
                  <div className="text-[12px] text-[var(--theme-text-muted)]">
                    {p.attendedMinutes || 0} min · joins {p.joinAttempts || 0}
                    {p.googleDisplayName ? ` · Google: ${p.googleDisplayName}` : ""}
                    {p.manuallyVerified ? " · manually verified" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill label={p.attendanceStatus} />
                  {canManage ? (
                    <Select
                      value={p.attendanceStatus}
                      onChange={(e) => correct(p.id, e.target.value)}
                      options={[...ATTENDANCE_OPTIONS]}
                      className="w-[180px]"
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
