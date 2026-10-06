"use client";

import { type ReactNode } from "react";
import { cn, EmptyState, RowMenu, Td, Th, type IconType } from "./ui";
import { BarCell, Board, BoardBar, BoardBody, BoardHead, GroupHead, GroupTable } from "./board";
import { BoardInlineSearch, BoardToolbarBar, ViewTabs, type BoardView } from "./board-kit";
import { KanbanBoard, MobileItem } from "./board-views";

/* ============================================================================
   Config-driven monday-style board list shared by the accounting list pages
   (Journal Entries, Receipt / Payment Vouchers, Fee Receivables, Budgets …).
   The board UI lives here ONCE; each page supplies only its data + columns.
   ========================================================================== */

export type BoardColumn<T> = { key: string; label: string; width: string; cell: (r: T) => ReactNode };
export type BoardGroup<T> = { key: string; label: string; color: string; items: T[] };
export type BoardMenu = { label: string; Icon: IconType; onClick: () => void; danger?: boolean };

export type BoardListProps<T> = {
  title: string;
  subtitle: string;
  Icon: IconType;
  primaryAction?: ReactNode;
  nameLabel: string;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  /** Page-owned filter / sort controls (ToolDropdowns, etc.). */
  toolbar?: ReactNode;
  /** Optional banner rendered under the title (e.g. the branch scope bar). */
  notice?: ReactNode;
  views?: readonly { key: BoardView; label: string }[];
  view: BoardView;
  onView: (v: BoardView) => void;
  groups: BoardGroup<T>[];
  columns: BoardColumn<T>[];
  keyOf: (r: T) => string;
  nameOf: (r: T) => string;
  subtitleOf?: (r: T) => string;
  menu: (r: T) => BoardMenu[];
  mobileRows: (r: T) => { label: string; value: ReactNode }[];
  onRowClick?: (r: T) => void;
  emptyTitle: string;
  emptyMessage: string;
  minWidth?: number;
};

export function BoardList<T>({
  title, subtitle, Icon, primaryAction, nameLabel, search, onSearch, searchPlaceholder, toolbar, notice,
  views, view, onView, groups, columns, keyOf, nameOf, subtitleOf, menu, mobileRows, onRowClick,
  emptyTitle, emptyMessage, minWidth = 1000,
}: BoardListProps<T>) {
  const tmpl = `44px minmax(190px,1.5fr) ${columns.map((c) => c.width).join(" ")} 64px`;
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Board>
      <BoardBar>
        <BoardHead title={title} subtitle={subtitle} Icon={Icon} actions={primaryAction} />
        {notice}
        <ViewTabs views={views ?? [{ key: "table", label: "Main table" }]} value={view} onChange={onView} />
        <BoardToolbarBar>
          <span className="mr-1 hidden sm:inline-flex">{primaryAction}</span>
          <BoardInlineSearch value={search} onChange={onSearch} placeholder={searchPlaceholder ?? "Search"} />
          {toolbar}
        </BoardToolbarBar>
      </BoardBar>

      <BoardBody>
        {view === "table" && (
          total === 0 ? <EmptyState Icon={Icon} title={emptyTitle} message={emptyMessage} /> : (
            <div className="space-y-8" style={{ minWidth }}>
              {groups.map((g) => (
                <section key={g.key}>
                  <GroupHead title={g.label} color={g.color} count={g.items.length} />
                  <div className="hidden md:block">
                    <GroupTable>
                      <div className="grid border-b border-[var(--theme-border)] bg-[var(--theme-surface)]" style={{ gridTemplateColumns: tmpl }}>
                        <BarCell color={g.color} />
                        <Th>{nameLabel}</Th>
                        {columns.map((c) => <Th key={c.key} className="border-l border-[var(--theme-border)]">{c.label}</Th>)}
                        <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                      </div>
                      {g.items.map((r) => (
                        <div key={keyOf(r)} onClick={() => onRowClick?.(r)}
                          className={cn("row grid border-b border-[var(--theme-border)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]", onRowClick && "cursor-pointer")}
                          style={{ gridTemplateColumns: tmpl }}>
                          <BarCell color={g.color} className="py-2.5" />
                          <Td className="min-w-0 font-medium"><span className="truncate">{nameOf(r)}</span></Td>
                          {columns.map((c) => <Td key={c.key} className="min-w-0 border-l border-[var(--theme-border)]">{c.cell(r)}</Td>)}
                          <Td className="justify-center border-l border-[var(--theme-border)]">
                            <span onClick={(e) => e.stopPropagation()}><RowMenu items={menu(r)} /></span>
                          </Td>
                        </div>
                      ))}
                    </GroupTable>
                  </div>
                  <div className="space-y-3 md:hidden">
                    {g.items.map((r) => (
                      <MobileItem key={keyOf(r)} name={nameOf(r)} subtitle={subtitleOf?.(r)}
                        actions={<RowMenu items={menu(r)} />} rows={mobileRows(r)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {view === "kanban" && (
          <KanbanBoard columns={groups} keyOf={keyOf}
            renderCard={(r) => (
              <button type="button" onClick={() => onRowClick?.(r)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left shadow-sm transition-colors hover:bg-[var(--theme-hover)]">
                <span className="block truncate text-[14px] font-medium">{nameOf(r)}</span>
                {subtitleOf && <span className="mt-0.5 block truncate text-[12px] text-[var(--theme-text-muted)]">{subtitleOf(r)}</span>}
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  {mobileRows(r).slice(0, 2).map((row) => (
                    <span key={row.label} className="truncate text-[12px] text-[var(--theme-text-faint)]">{row.value}</span>
                  ))}
                </span>
              </button>
            )} />
        )}
      </BoardBody>
    </Board>
  );
}
