"use client";

import { useMemo, useState } from "react";
import { Filter, ArrowUpDown, Target } from "lucide-react";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton, useInitialLoading } from "@/components/skeleton";
import { BUDGETS, type BudgetRow } from "@/lib/accounting-mock-data";

const STATUSES = ["Active", "Inactive", "Completed", "Over Budget"] as const;
const YEARS = ["2026-2027", "2025-2026"];
const SORTS = ["Budget Name", "Budget Amount", "Remaining"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export default function BudgetsPage() {
  const [rows] = useState<BudgetRow[]>(BUDGETS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<string>("Budget Name");
  const [view, setView] = useState<BoardView>("table");

  const filtered = useMemo(() => rows
    .filter((r) => `${r.name} ${r.department} ${r.year}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true))
    .filter((r) => (year ? r.year === year : true))
    .sort((a, b) => (sort === "Budget Amount" ? b.budget - a.budget : sort === "Remaining" ? b.remaining - a.remaining : a.name.localeCompare(b.name))),
  [rows, q, status, year, sort]);

  const groups = useMemo(() => STATUSES.map((s) => ({
    key: s, label: s, color: statusColor(s), items: filtered.filter((r) => r.status === s),
  })).filter((g) => g.items.length > 0), [filtered]);

  const columns: BoardColumn<BudgetRow>[] = [
    { key: "year", label: "Financial Year", width: "140px", cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.year}</span> },
    { key: "department", label: "Department", width: "minmax(150px,1fr)", cell: (r) => r.department },
    { key: "budget", label: "Budget Amount", width: "150px", cell: (r) => <span className="tabular-nums">{money(r.budget)}</span> },
    { key: "actual", label: "Actual", width: "140px", cell: (r) => <span className="tabular-nums">{money(r.actual)}</span> },
    { key: "remaining", label: "Remaining", width: "140px", cell: (r) => <span className={`tabular-nums ${r.remaining < 0 ? "text-[var(--theme-danger-text)]" : ""}`}>{money(r.remaining)}</span> },
    { key: "status", label: "Status", width: "140px", cell: (r) => <StatusPill label={r.status} /> },
  ];

  const loading = useInitialLoading();
  if (loading) return <BoardPageSkeleton rows={5} cols={6} />;

  return (
    <BoardList<BudgetRow>
      title="Budgets"
      subtitle="Plan and track department budgets for the school."
      Icon={Target}
      nameLabel="Budget Name"
      search={q} onSearch={setQ} searchPlaceholder="Search budgets"
      views={VIEWS} view={view} onView={setView}
      groups={groups} columns={columns} minWidth={1300}
      keyOf={(r) => r.id}
      nameOf={(r) => r.name}
      subtitleOf={(r) => `${r.department} · ${r.year}`}
      menu={() => []}
      mobileRows={(r) => [
        { label: "Budget", value: money(r.budget) },
        { label: "Status", value: <StatusPill label={r.status} /> },
        { label: "Remaining", value: money(r.remaining) },
      ]}
      emptyTitle="No budgets"
      emptyMessage="Adjust your filters or create a new budget."
      toolbar={
        <>
          <ToolDropdown Icon={Filter} label="Financial Year" options={YEARS} value={year} onChange={setYear} allLabel="All Years" />
          <ToolDropdown Icon={Filter} label="Status" options={STATUSES} value={status} onChange={setStatus} allLabel="All Status" />
          <ToolDropdown Icon={ArrowUpDown} label="Sort" options={SORTS} value={sort} onChange={(v) => setSort(v || "Budget Name")} allLabel="Budget Name" />
        </>
      }
    />
  );
}
