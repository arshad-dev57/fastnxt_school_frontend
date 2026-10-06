"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { BoardList, type BoardColumn, type BoardMenu } from "@/components/board-list";
import type { BoardView } from "@/components/board-kit";
import { Btn, Modal, type IconType } from "@/components/ui";
import { TablePageSkeleton } from "@/components/skeleton";
import { DetailGrid, PortalScopeBar } from "@/components/portal/portal-ui";

/* ===========================================================================
   PortalBoard — the single list surface every portal table page uses.

   It is a thin wrapper over the Admin's own `BoardList` (board-list.tsx), so
   grouping, the colour bar, the kanban view, the mobile cards and the row menu
   all come from the existing Admin component rather than a parallel build.
   Search / view / detail state is held here exactly as `BranchBoard` does it.
   ========================================================================== */

const PALETTE = [
  "var(--theme-primary)", "var(--theme-accent)", "var(--theme-success)", "var(--theme-warning)",
  "var(--theme-danger)", "var(--theme-info)", "var(--theme-accent-2)", "var(--theme-success-text)",
];

const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export type PortalBoardProps<T> = {
  title: string;
  subtitle: string;
  Icon: IconType;
  nameLabel: string;
  rows: T[];
  keyOf: (r: T) => string;
  nameOf: (r: T) => string;
  subtitleOf?: (r: T) => string;
  searchTextOf?: (r: T) => string;
  searchPlaceholder?: string;
  columns: BoardColumn<T>[];
  groupBy?: (r: T) => string;
  groupColorOf?: (key: string) => string;
  detailFields?: (r: T) => { label: string; value: ReactNode }[];
  /**
   * Curated rows for the phone card. When omitted the board falls back to the
   * column set, so the mobile card always carries the same information as the
   * desktop table (the Admin pages pass an explicit, hand-picked subset).
   */
  mobileRows?: (r: T) => { label: string; value: ReactNode }[];
  menu?: (r: T) => BoardMenu[];
  primaryAction?: ReactNode;
  toolbar?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  countNoun?: string;
  scopeLabel: string;
  minWidth?: number;
  loading?: boolean;
};

export function PortalBoard<T extends { id: string }>({
  title, subtitle, Icon, nameLabel, rows, keyOf, nameOf, subtitleOf, searchTextOf, searchPlaceholder,
  columns, groupBy, groupColorOf, detailFields, mobileRows, menu, primaryAction, toolbar,
  emptyTitle, emptyMessage, countNoun, scopeLabel, minWidth, loading,
}: PortalBoardProps<T>) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<BoardView>("table");
  const [detail, setDetail] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => (searchTextOf?.(r) ?? nameOf(r)).toLowerCase().includes(term));
  }, [rows, q, searchTextOf, nameOf]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: "all", label: nameLabel, items: filtered, color: "var(--theme-primary)" }];
    const map = new Map<string, T[]>();
    for (const r of filtered) map.set(groupBy(r), [...(map.get(groupBy(r)) ?? []), r]);
    return [...map.entries()].map(([key, items], i) => ({
      key, label: key, items,
      color: groupColorOf?.(key) ?? PALETTE[i % PALETTE.length],
    }));
  }, [filtered, groupBy, groupColorOf, nameLabel]);

  if (loading) return <TablePageSkeleton rows={6} cols={Math.min(columns.length + 1, 6)} />;

  const rowMenu = (r: T): BoardMenu[] => {
    const items = menu?.(r) ?? [];
    return detailFields ? [...items, { label: "View", Icon: Eye, onClick: () => setDetail(r) }] : items;
  };

  /* Phone cards reuse the exact same cells the desktop table shows. */
  const rowsFor = mobileRows ?? ((r: T) => columns.map((c) => ({ label: c.label, value: c.cell(r) })));

  return (
    <>
      <BoardList<T>
        title={title}
        subtitle={subtitle}
        Icon={Icon}
        primaryAction={primaryAction}
        nameLabel={nameLabel}
        search={q}
        onSearch={setQ}
        searchPlaceholder={searchPlaceholder}
        toolbar={toolbar}
        notice={<PortalScopeBar count={filtered.length} noun={countNoun} label={scopeLabel} />}
        views={VIEWS}
        view={view}
        onView={setView}
        groups={groups}
        columns={columns}
        keyOf={keyOf}
        nameOf={nameOf}
        subtitleOf={subtitleOf}
        menu={rowMenu}
        mobileRows={rowsFor}
        onRowClick={detailFields ? (r) => setDetail(r) : undefined}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        minWidth={minWidth}
      />

      {detailFields && (
        <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? nameOf(detail) : "Record"} subtitle={detail?.id} width="max-w-xl"
          footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
          {detail && <DetailGrid fields={detailFields(detail)} />}
        </Modal>
      )}
    </>
  );
}
