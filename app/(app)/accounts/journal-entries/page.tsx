"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Plus, ArrowUpDown, Layers, Filter, FileText } from "lucide-react";
import { Btn, ConfirmDialog, Modal } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton, simulateDelay, useInitialLoading } from "@/components/skeleton";
import { JOURNAL_ENTRIES, type JournalEntry } from "@/lib/accounting-mock-data";

const STATUSES = ["Draft", "Posted", "Cancelled"] as const;
const SORTS = ["Entry #", "Date", "Amount"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export default function JournalEntriesPage() {
  const [rows, setRows] = useState<JournalEntry[]>(JOURNAL_ENTRIES);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<string>("Entry #");
  const [view, setView] = useState<BoardView>("table");
  const [detail, setDetail] = useState<JournalEntry | null>(null);
  const [toDelete, setToDelete] = useState<JournalEntry | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => `${r.no} ${r.description} ${r.reference} ${r.by}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sort === "Date" ? a.date.localeCompare(b.date) : sort === "Amount" ? b.debit - a.debit : a.no.localeCompare(b.no))),
  [rows, q, status, sort]);

  const groups = useMemo(() => STATUSES.map((s) => ({
    key: s, label: s, color: statusColor(s), items: filtered.filter((r) => r.status === s),
  })).filter((g) => g.items.length > 0), [filtered]);

  const columns: BoardColumn<JournalEntry>[] = [
    { key: "date", label: "Date", width: "120px", cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.date}</span> },
    { key: "description", label: "Description", width: "minmax(170px,1fr)", cell: (r) => <span className="truncate">{r.description}</span> },
    { key: "reference", label: "Reference", width: "120px", cell: (r) => r.reference },
    { key: "debit", label: "Debit", width: "130px", cell: (r) => <span className="tabular-nums">{money(r.debit)}</span> },
    { key: "credit", label: "Credit", width: "130px", cell: (r) => <span className="tabular-nums">{money(r.credit)}</span> },
    { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
    { key: "by", label: "Created By", width: "minmax(140px,1fr)", cell: (r) => <span className="truncate text-[var(--theme-text-muted)]">{r.by}</span> },
  ];

  const loading = useInitialLoading();
  if (loading) return <BoardPageSkeleton rows={5} cols={7} />;

  const newAction = (
    <Link href="/accounts/journal-entries/new"
      className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
      <Plus className="ic-plus h-[18px] w-[18px]" /><span className="hidden sm:inline">New Journal Entry</span>
    </Link>
  );

  return (
    <>
      <BoardList<JournalEntry>
        title="Journal Entries"
        subtitle="Record and review accounting transactions."
        Icon={FileText}
        nameLabel="Entry #"
        primaryAction={newAction}
        search={q} onSearch={setQ} searchPlaceholder="Search entries"
        views={VIEWS} view={view} onView={setView}
        groups={groups} columns={columns} minWidth={1400}
        keyOf={(r) => r.id}
        nameOf={(r) => r.no}
        subtitleOf={(r) => r.description}
        onRowClick={setDetail}
        menu={(r) => [{ label: "View", Icon: Eye, onClick: () => setDetail(r) }]}
        mobileRows={(r) => [
          { label: "Date", value: r.date },
          { label: "Status", value: <StatusPill label={r.status} /> },
          { label: "Debit", value: money(r.debit) },
          { label: "Credit", value: money(r.credit) },
        ]}
        emptyTitle="No journal entries"
        emptyMessage="Adjust your filters or create a new journal entry."
        toolbar={
          <>
            <ToolDropdown Icon={Filter} label="Status" options={STATUSES} value={status} onChange={setStatus} allLabel="All Status" />
            <ToolDropdown Icon={ArrowUpDown} label="Sort" options={SORTS} value={sort} onChange={(v) => setSort(v || "Entry #")} allLabel="Entry #" />
            <ToolDropdown Icon={Layers} label="Date" options={["This Month", "Last Month", "This Quarter"]} value="" onChange={() => {}} allLabel="All Dates" />
          </>
        }
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.no ?? ""} subtitle="Journal entry"
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (
          <div className="grid grid-cols-2 gap-3">
            <Info label="Date" value={detail.date} />
            <Info label="Reference" value={detail.reference} />
            <Info label="Description" value={detail.description} />
            <Info label="Status" value={detail.status} />
            <Info label="Debit" value={money(detail.debit)} />
            <Info label="Credit" value={money(detail.credit)} />
            <Info label="Created By" value={detail.by} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => { await simulateDelay(); setRows((p) => p.filter((r) => r.id !== toDelete?.id)); }}
        title="Delete entry" confirmLabel="Delete" message={`Delete ${toDelete?.no}?`} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="truncate text-[14px] font-medium">{value}</p>
    </div>
  );
}
