"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { BoardList, type BoardColumn, type BoardMenu } from "@/components/board-list";
import { BoardInlineSearch, statusColor, type BoardView } from "@/components/board-kit";
import { TablePageSkeleton } from "@/components/skeleton";
import { useBranch } from "@/lib/branch-context";
import { Btn, Modal, type IconType } from "@/components/ui";
import { BranchCell, BranchScopeBar } from "./branch-ui";

/* ============================================================================
   BranchBoard — one branch-aware list board shared by every module page.
   It applies the global campus scope, prepends a Branch column in All-Branches
   mode, and keeps the existing monday-style table / kanban presentation.
   ========================================================================== */

export type BranchRecord = { id: string; branchId?: string | null };

const PALETTE = [
  "var(--theme-primary)", "var(--theme-accent)", "var(--theme-success)", "var(--theme-warning)",
  "var(--theme-danger)", "var(--theme-info)", "var(--theme-accent-2)", "var(--theme-success-text)",
];

const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export function BranchBoard<T extends BranchRecord>({
  title, subtitle, Icon, rows, columns, groupBy, groupColorOf, nameOf, subtitleOf, keyOf, searchTextOf,
  menu, detailFields, nameLabel, mobileRows, primaryAction, toolbar, emptyTitle, emptyMessage, searchPlaceholder, minWidth, loading, countNoun,
}: {
  title: string;
  subtitle: string;
  Icon: IconType;
  rows: T[];
  columns: BoardColumn<T>[];
  groupBy?: (r: T) => string;
  groupColorOf?: (key: string) => string | undefined;
  nameOf: (r: T) => string;
  subtitleOf?: (r: T) => string;
  keyOf?: (r: T) => string;
  searchTextOf?: (r: T) => string;
  menu?: (r: T) => BoardMenu[];
  detailFields?: (r: T) => { label: string; value: ReactNode }[];
  nameLabel?: string;
  mobileRows: (r: T) => { label: string; value: ReactNode }[];
  primaryAction?: ReactNode;
  toolbar?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchPlaceholder?: string;
  minWidth?: number;
  loading?: boolean;
  countNoun?: string;
}) {
  const { currentBranchId } = useBranch();
  const [q, setQ] = useState("");
  const [view, setView] = useState<BoardView>("table");
  const [detail, setDetail] = useState<T | null>(null);
  const all = currentBranchId === "all";

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => all || r.branchId === currentBranchId)
      .filter((r) => (term ? (searchTextOf?.(r) ?? nameOf(r)).toLowerCase().includes(term) : true));
  }, [rows, q, all, currentBranchId, searchTextOf, nameOf]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: "all", label: "All records", color: "var(--theme-primary)", items: filtered }];
    const map = new Map<string, T[]>();
    for (const r of filtered) map.set(groupBy(r), [...(map.get(groupBy(r)) ?? []), r]);
    return [...map.keys()].sort().map((k, i) => ({
      key: k,
      label: k,
      items: map.get(k)!,
      color: groupColorOf?.(k) ?? statusColor(k) ?? PALETTE[i % PALETTE.length],
    }));
  }, [filtered, groupBy, groupColorOf]);

  const cols = useMemo<BoardColumn<T>[]>(() => {
    if (!all) return columns;
    return [{ key: "__branch", label: "Branch", width: "150px", cell: (r) => <BranchCell branchId={r.branchId || ""} /> }, ...columns];
  }, [all, columns]);

  if (loading) return <TablePageSkeleton rows={6} cols={Math.min(cols.length + 1, 6)} />;

  const rowMenu = (r: T): BoardMenu[] => {
    const items = menu?.(r) ?? [];
    return detailFields ? [...items, { label: "View", Icon: Eye, onClick: () => setDetail(r) }] : items;
  };

  return (
    <>
      <BoardList<T>
        title={title}
        subtitle={subtitle}
        Icon={Icon}
        primaryAction={primaryAction}
        nameLabel={nameLabel ?? "Record"}
        search={q}
        onSearch={setQ}
        searchPlaceholder={searchPlaceholder}
        toolbar={toolbar}
        notice={<BranchScopeBar count={filtered.length} noun={countNoun} />}
        views={VIEWS}
        view={view}
        onView={setView}
        groups={groups}
        columns={cols}
        keyOf={keyOf ?? ((r) => r.id)}
        nameOf={nameOf}
        subtitleOf={subtitleOf}
        menu={rowMenu}
        mobileRows={mobileRows}
        onRowClick={detailFields ? (r) => setDetail(r) : undefined}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        minWidth={minWidth}
      />

      {detailFields && (
        <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? nameOf(detail) : "Record"} subtitle={detail?.id} width="max-w-xl"
          footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
          {detail && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detailFields(detail).map((f) => (
                <div key={f.label} className="min-w-0 rounded-lg border border-[var(--theme-border)] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{f.label}</p>
                  <p className="truncate text-[14px] font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

/** Search input factory used inside `toolbar` on module pages. */
export function BranchSearch(props: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <BoardInlineSearch {...props} />;
}
