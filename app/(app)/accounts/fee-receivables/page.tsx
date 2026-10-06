"use client";

import { useMemo, useState } from "react";
import { Filter, ArrowUpDown, HandCoins } from "lucide-react";
import { StatCard, rs } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton, useInitialLoading } from "@/components/skeleton";
import { RECEIVABLES, type Receivable } from "@/lib/accounting-mock-data";

const STATUSES = ["Paid", "Partial", "Pending", "Overdue"] as const;
const CLASSES = ["Grade 5", "Grade 6", "Grade 7", "Grade 8"];
const SECTIONS = ["A", "B"];
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export default function FeeReceivablesPage() {
  const [rows] = useState<Receivable[]>(RECEIVABLES);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [view, setView] = useState<BoardView>("table");

  const filtered = useMemo(() => rows
    .filter((r) => `${r.student} ${r.sid} ${r.invoice}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true))
    .filter((r) => (cls ? r.cls === cls : true))
    .filter((r) => (section ? r.section === section : true)),
  [rows, q, status, cls, section]);

  const total = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdue = rows.filter((r) => r.status === "Overdue").reduce((s, r) => s + r.outstanding, 0);
  const currentDue = rows.filter((r) => r.status === "Pending" || r.status === "Partial").reduce((s, r) => s + r.outstanding, 0);
  const collected = rows.reduce((s, r) => s + r.paid, 0);

  const groups = useMemo(() => STATUSES.map((s) => ({
    key: s, label: s, color: statusColor(s), items: filtered.filter((r) => r.status === s),
  })).filter((g) => g.items.length > 0), [filtered]);

  const columns: BoardColumn<Receivable>[] = [
    { key: "sid", label: "Student ID", width: "120px", cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.sid}</span> },
    { key: "cls", label: "Class", width: "130px", cell: (r) => `${r.cls}-${r.section}` },
    { key: "invoice", label: "Invoice", width: "120px", cell: (r) => r.invoice },
    { key: "due", label: "Due Date", width: "120px", cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.dueDate}</span> },
    { key: "total", label: "Total Fee", width: "130px", cell: (r) => <span className="tabular-nums">{money(r.total)}</span> },
    { key: "paid", label: "Paid", width: "130px", cell: (r) => <span className="tabular-nums">{money(r.paid)}</span> },
    { key: "out", label: "Outstanding", width: "140px", cell: (r) => <span className="tabular-nums font-medium">{money(r.outstanding)}</span> },
    { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
  ];

  const loading = useInitialLoading();
  if (loading) return <BoardPageSkeleton rows={5} cols={8} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:px-6 lg:grid-cols-4">
        <StatCard label="Total Receivable" value={rs(total)} Icon={HandCoins} tone="blue" sub="All outstanding balances" />
        <StatCard label="Current Due" value={rs(currentDue)} Icon={HandCoins} tone="orange" sub="Pending & partial invoices" />
        <StatCard label="Overdue" value={rs(overdue)} Icon={HandCoins} tone="red" sub="Past due date" />
        <StatCard label="Collected This Month" value={rs(collected)} Icon={HandCoins} tone="green" sub="October 2026" />
      </div>

      <BoardList<Receivable>
        title="Fee Receivables"
        subtitle="Outstanding student fees, dues and collection status."
        Icon={HandCoins}
        nameLabel="Student"
        search={q} onSearch={setQ} searchPlaceholder="Search students"
        views={VIEWS} view={view} onView={setView}
        groups={groups} columns={columns} minWidth={1480}
        keyOf={(r) => r.id}
        nameOf={(r) => r.student}
        subtitleOf={(r) => `${r.sid} · ${r.cls}-${r.section}`}
        menu={() => []}
        mobileRows={(r) => [
          { label: "Invoice", value: r.invoice },
          { label: "Status", value: <StatusPill label={r.status} /> },
          { label: "Outstanding", value: money(r.outstanding) },
          { label: "Due", value: r.dueDate },
        ]}
        emptyTitle="No receivables"
        emptyMessage="No student fee records match your filters."
        toolbar={
          <>
            <ToolDropdown Icon={Filter} label="Class" options={CLASSES} value={cls} onChange={setCls} allLabel="All Classes" />
            <ToolDropdown Icon={Filter} label="Section" options={SECTIONS} value={section} onChange={setSection} allLabel="All Sections" />
            <ToolDropdown Icon={Filter} label="Status" options={STATUSES} value={status} onChange={setStatus} allLabel="All Status" />
            <ToolDropdown Icon={ArrowUpDown} label="Due Date" options={["This Week", "This Month", "Overdue"]} value="" onChange={() => {}} allLabel="All Dates" />
          </>
        }
      />
    </div>
  );
}
