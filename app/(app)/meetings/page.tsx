"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { meetingsApi, type MeetingItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog, Textarea } from "@/components/ui";

const COLORS: Record<string, string> = { Scheduled: "var(--theme-info)", Live: "var(--theme-warning)", Completed: "var(--theme-success)", Cancelled: "var(--theme-danger)" };

export default function MeetingsPage() {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(MeetingItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<MeetingItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await meetingsApi.list({ branchId: branchScope });
      setRows((res.meetings || []).map(r => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await meetingsApi.delete(toDelete.id);
      setRows(p => p.filter(r => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BranchBoard<MeetingItem & { branchId: string }>
        title="Meetings & Appointments"
        subtitle="Schedule and track staff meetings, PTMs and academic sessions."
        Icon={Users}
        nameLabel="Meeting"
        countNoun="meetings"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status || "Scheduled"}
        groupColorOf={(k) => COLORS[k] || "var(--theme-info)"}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.date || "—"} at ${r.time || "—"} · Organizer: ${r.organizer || "Admin"}`}
        searchTextOf={(r) => `${r.title} ${r.organizer} ${r.venue} ${r.description} ${(r.participants || []).join(" ")}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link
              href="/meetings/new"
              className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Plus className="h-[16px] w-[16px]" /> Schedule Meeting
            </Link>
          </div>
        }
        menu={(r) => [
          { label: "Edit Meeting", Icon: Pencil, onClick: () => router.push(`/meetings/new?id=${r.id}`) },
          { label: "Delete Meeting", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          {
            key: "title",
            label: "Meeting Title",
            width: "minmax(200px, 1.5fr)",
            cell: (r) => (
              <div>
                <div className="font-semibold text-[var(--theme-text)]">{r.title}</div>
                {r.description && (
                  <div className="line-clamp-1 text-[12px] text-[var(--theme-text-muted)]">{r.description}</div>
                )}
              </div>
            ),
          },
          {
            key: "date",
            label: "Date & Time",
            width: "150px",
            cell: (r) => (
              <div className="text-[13px]">
                <div className="font-medium text-[var(--theme-text)]">{r.date || "—"}</div>
                <div className="text-[12px] text-[var(--theme-text-muted)]">{r.time || "—"}</div>
              </div>
            ),
          },
          { key: "organizer", label: "Organizer", width: "130px", cell: (r) => r.organizer || "Admin" },
          {
            key: "venue",
            label: "Location / Venue",
            width: "minmax(160px, 1fr)",
            cell: (r) => (
              <div className="text-[13px]">
                <span className="font-medium">{r.venue || "Campus"}</span>
              </div>
            ),
          },
          {
            key: "participants",
            label: "Participants",
            width: "180px",
            cell: (r) => {
              const parts = Array.isArray(r.participants) ? r.participants : [];
              if (parts.length === 0) return <span className="text-[12px] text-[var(--theme-text-faint)]">None listed</span>;
              return (
                <div className="flex flex-wrap gap-1">
                  {parts.slice(0, 2).map((p, idx) => (
                    <span key={idx} className="inline-block rounded-full bg-[var(--theme-subtle)] px-2 py-0.5 text-[11px] font-medium">
                      {p}
                    </span>
                  ))}
                  {parts.length > 2 && (
                    <span className="inline-block rounded-full bg-[var(--theme-primary-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--theme-primary)]">
                      +{parts.length - 2} more
                    </span>
                  )}
                </div>
              );
            },
          },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status || "Scheduled"} /> },
        ]}
        detailFields={(r) => [
          { label: "Meeting Title", value: r.title },
          { label: "Date & Time", value: `${r.date || "—"} at ${r.time || "—"}` },
          { label: "Venue / Location", value: r.venue || "Not specified" },
          { label: "Organizer", value: r.organizer || "Admin" },
          { label: "Status", value: r.status || "Scheduled" },
          { label: "Description / Agenda", value: r.description || "No agenda details provided." },
          {
            label: "Invited Participants",
            value: Array.isArray(r.participants) && r.participants.length > 0
              ? r.participants.join(", ")
              : "No specific participants listed",
          },
        ]}
        mobileRows={(r) => [
          { label: "When", value: `${r.date} ${r.time}` },
          { label: "Venue", value: r.venue },
          { label: "Organizer", value: r.organizer },
          { label: "Participants", value: Array.isArray(r.participants) ? `${r.participants.length} invited` : "—" },
          { label: "Status", value: <StatusPill label={r.status || "Scheduled"} /> },
        ]}
        emptyTitle="No meetings scheduled"
        emptyMessage="No meetings match the current campus scope."
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message={`Remove the meeting "${toDelete?.title}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}