"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Plus, ArrowUpDown, Filter, FileText, RefreshCw, CheckCircle2, RotateCcw, XCircle, Trash2 } from "lucide-react";
import { Btn, ConfirmDialog, Modal, rs } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton } from "@/components/skeleton";
import { accountsApi, type JournalEntryItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const STATUSES = ["Draft", "Posted", "Cancelled"] as const;
const SORTS = ["Entry #", "Date", "Amount"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export default function JournalEntriesPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<JournalEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<string>("Entry #");
  const [view, setView] = useState<BoardView>("table");
  const [detail, setDetail] = useState<JournalEntryItem | null>(null);
  const [toDelete, setToDelete] = useState<JournalEntryItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.listJournals({ branchId: branchScope });
      setRows(res.entries || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [currentBranchId]);

  const handlePost = async (id: string) => {
    setActionBusy(true);
    try {
      await accountsApi.postJournal(id);
      await fetchEntries();
      if (detail && detail.id === id) {
        const refreshed = await accountsApi.getJournal(id);
        setDetail(refreshed.entry);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to post entry.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async (id: string) => {
    setActionBusy(true);
    try {
      await accountsApi.cancelJournal(id);
      await fetchEntries();
      if (detail && detail.id === id) {
        const refreshed = await accountsApi.getJournal(id);
        setDetail(refreshed.entry);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to cancel entry.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReverse = async (id: string) => {
    setActionBusy(true);
    try {
      await accountsApi.reverseJournal(id);
      await fetchEntries();
      alert("Journal entry reversed successfully.");
      setDetail(null);
    } catch (err: any) {
      alert(err?.message || "Failed to reverse entry.");
    } finally {
      setActionBusy(false);
    }
  };

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => `${r.no} ${r.description} ${r.reference} ${r.by}`.toLowerCase().includes(q.toLowerCase()))
        .filter((r) => (status ? r.status === status : true))
        .sort((a, b) =>
          sort === "Date"
            ? (b.date || "").localeCompare(a.date || "")
            : sort === "Amount"
            ? (b.debit || 0) - (a.debit || 0)
            : (b.no || "").localeCompare(a.no || "")
        ),
    [rows, q, status, sort]
  );

  const groups = useMemo(
    () =>
      STATUSES.map((s) => ({
        key: s,
        label: s,
        color: statusColor(s),
        items: filtered.filter((r) => r.status === s),
      })).filter((g) => g.items.length > 0),
    [filtered]
  );

  const columns: BoardColumn<JournalEntryItem>[] = [
    {
      key: "date",
      label: "Date",
      width: "110px",
      cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.date}</span>,
    },
    {
      key: "description",
      label: "Description",
      width: "minmax(170px,1fr)",
      cell: (r) => <span className="truncate font-medium">{r.description}</span>,
    },
    { key: "reference", label: "Reference", width: "120px", cell: (r) => r.reference || "—" },
    {
      key: "debit",
      label: "Debit",
      width: "120px",
      cell: (r) => <span className="tabular-nums font-semibold">{money(r.debit)}</span>,
    },
    {
      key: "credit",
      label: "Credit",
      width: "120px",
      cell: (r) => <span className="tabular-nums font-semibold">{money(r.credit)}</span>,
    },
    { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
    {
      key: "by",
      label: "Created By",
      width: "minmax(130px,1fr)",
      cell: (r) => <span className="truncate text-[var(--theme-text-muted)]">{r.by || "System"}</span>,
    },
  ];

  if (loading && rows.length === 0) return <BoardPageSkeleton rows={5} cols={7} />;

  const newAction = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={fetchEntries}
        className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <Link
        href="/accounts/journal-entries/new"
        className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
      >
        <Plus className="ic-plus h-[18px] w-[18px]" />
        <span className="hidden sm:inline">New Journal Entry</span>
      </Link>
    </div>
  );

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)] sm:mx-6">
          {error}
        </div>
      )}

      <BoardList<JournalEntryItem>
        title="Journal Entries"
        subtitle="Record and review balanced double-entry accounting transactions."
        Icon={FileText}
        nameLabel="Entry #"
        primaryAction={newAction}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search journal entries"
        views={VIEWS}
        view={view}
        onView={setView}
        groups={groups}
        columns={columns}
        minWidth={1400}
        keyOf={(r) => r.id}
        nameOf={(r) => r.no}
        subtitleOf={(r) => `${r.description} · ${r.reference || "No ref"}`}
        menu={(r) => [
          { label: "View Lines", Icon: Eye, onClick: () => setDetail(r) },
          ...(r.status === "Draft"
            ? [{ label: "Post Entry", Icon: CheckCircle2, onClick: () => handlePost(r.id) }]
            : []),
          ...(r.status === "Posted"
            ? [{ label: "Reverse Entry", Icon: RotateCcw, onClick: () => handleReverse(r.id) }]
            : []),
          ...(r.status !== "Cancelled"
            ? [{ label: "Cancel", Icon: XCircle, danger: true, onClick: () => handleCancel(r.id) }]
            : []),
          ...(r.status === "Draft"
            ? [{ label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) }]
            : []),
        ]}
        mobileRows={(r) => [
          { label: "Date", value: r.date },
          { label: "Status", value: <StatusPill label={r.status} /> },
          { label: "Debit", value: money(r.debit) },
          { label: "Credit", value: money(r.credit) },
          { label: "By", value: r.by || "System" },
        ]}
        emptyTitle="No journal entries"
        emptyMessage="Create a new journal entry to begin recording transactions."
        toolbar={
          <>
            <ToolDropdown
              Icon={Filter}
              label="Status"
              options={STATUSES}
              value={status}
              onChange={setStatus}
              allLabel="All Status"
            />
            <ToolDropdown
              Icon={ArrowUpDown}
              label="Sort"
              options={SORTS}
              value={sort}
              onChange={(v) => setSort(v || "Entry #")}
              allLabel="Entry #"
            />
          </>
        }
      />

      {/* Entry Details Modal with Lines */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        width="max-w-2xl"
        title={detail?.no ?? ""}
        subtitle={detail?.description ?? ""}
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              {detail?.status === "Draft" && (
                <Btn
                  variant="primary"
                  Icon={CheckCircle2}
                  onClick={() => detail && handlePost(detail.id)}
                  loading={actionBusy}
                >
                  Post Entry
                </Btn>
              )}
              {detail?.status === "Posted" && (
                <Btn
                  variant="secondary"
                  Icon={RotateCcw}
                  onClick={() => detail && handleReverse(detail.id)}
                  loading={actionBusy}
                >
                  Reverse
                </Btn>
              )}
              {detail?.status !== "Cancelled" && (
                <Btn
                  variant="secondary"
                  Icon={XCircle}
                  onClick={() => detail && handleCancel(detail.id)}
                  loading={actionBusy}
                >
                  Cancel
                </Btn>
              )}
            </div>
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
              <div className="rounded border border-[var(--theme-border)] p-2">
                <span className="text-[11px] text-[var(--theme-text-muted)]">Date</span>
                <p className="font-medium">{detail.date}</p>
              </div>
              <div className="rounded border border-[var(--theme-border)] p-2">
                <span className="text-[11px] text-[var(--theme-text-muted)]">Reference</span>
                <p className="font-medium">{detail.reference || "—"}</p>
              </div>
              <div className="rounded border border-[var(--theme-border)] p-2">
                <span className="text-[11px] text-[var(--theme-text-muted)]">Status</span>
                <p className="font-medium">{detail.status}</p>
              </div>
              <div className="rounded border border-[var(--theme-border)] p-2">
                <span className="text-[11px] text-[var(--theme-text-muted)]">Created By</span>
                <p className="font-medium">{detail.by || "System"}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-[var(--theme-border)]">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[11px] uppercase tracking-wider text-[var(--theme-text-muted)]">
                  <tr>
                    <th className="p-2.5">Account</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Debit</th>
                    <th className="p-2.5 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {(detail.lines || []).map((l, i) => (
                    <tr key={l.id || i}>
                      <td className="p-2.5 font-medium">{l.account}</td>
                      <td className="p-2.5 text-[var(--theme-text-muted)]">{l.description || "—"}</td>
                      <td className="p-2.5 text-right tabular-nums">{l.debit > 0 ? rs(l.debit) : "—"}</td>
                      <td className="p-2.5 text-right tabular-nums">{l.credit > 0 ? rs(l.credit) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[var(--theme-border)] bg-[var(--theme-surface)] font-semibold">
                  <tr>
                    <td colSpan={2} className="p-2.5">Total</td>
                    <td className="p-2.5 text-right tabular-nums">{rs(detail.debit)}</td>
                    <td className="p-2.5 text-right tabular-nums">{rs(detail.credit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await accountsApi.deleteJournal(toDelete.id);
            await fetchEntries();
          } catch (err: any) {
            alert(err?.message || "Failed to delete entry.");
          }
        }}
        title="Delete journal entry"
        confirmLabel="Delete"
        message={`Delete draft entry ${toDelete?.no}?`}
      />
    </>
  );
}
