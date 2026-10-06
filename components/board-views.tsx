"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, EmptyState } from "./ui";

/* ============================================================================
   Board views — Kanban, Calendar and the mobile card item. All three render the
   SAME records the page already holds (no new data, no new fields).
   ========================================================================== */

/* ---------------------------------------------------------------- Kanban */
export function KanbanBoard<T>({ columns, renderCard, keyOf }: {
  columns: readonly { key: string; label: string; color: string; items: T[] }[];
  renderCard: (item: T) => ReactNode;
  keyOf: (item: T) => string;
}) {
  const total = columns.reduce((n, c) => n + c.items.length, 0);
  if (total === 0) return <EmptyState title="No items" message="Nothing matches the current search or filters." />;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <section key={col.key} className="flex w-[272px] shrink-0 flex-col">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: col.color }} />
            <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold">{col.label}</h3>
            <span className="shrink-0 text-[12px] text-[var(--theme-text-faint)]">{col.items.length}</span>
          </div>
          <div className="min-h-[80px] space-y-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-2">
            {col.items.length === 0 && <p className="px-1 py-4 text-center text-[12px] text-[var(--theme-text-faint)]">No items</p>}
            {col.items.map((it) => <div key={keyOf(it)}>{renderCard(it)}</div>)}
          </div>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- Calendar */
export function CalendarBoard<T>({ items, getDate, renderChip, initialMonth }: {
  items: T[]; getDate: (i: T) => string; renderChip: (i: T) => ReactNode; initialMonth?: string;
}) {
  const [month, setMonth] = useState(() => initialMonth ?? new Date().toISOString().slice(0, 7));
  const [y, m] = month.split("-").map(Number);
  const startDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();

  const byDay = new Map<number, T[]>();
  for (const it of items) {
    const d = getDate(it);
    if (!d.startsWith(month)) continue;
    const day = Number(d.slice(8, 10));
    byDay.set(day, [...(byDay.get(day) ?? []), it]);
  }
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shift = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded border border-[var(--theme-border)] transition-colors hover:bg-[var(--theme-hover)]"><ChevronLeft className="h-4 w-4" /></button>
        <p className="min-w-[160px] text-[15px] font-semibold">{label}</p>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded border border-[var(--theme-border)] transition-colors hover:bg-[var(--theme-hover)]"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-border)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-[var(--theme-sidebar)] px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="min-h-[92px] bg-[var(--theme-surface)] p-1.5">
            {day && (
              <>
                <p className="mb-1 text-[11px] font-medium text-[var(--theme-text-faint)]">{day}</p>
                <div className="space-y-1">{(byDay.get(day) ?? []).map((it, k) => <div key={k}>{renderChip(it)}</div>)}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ mobile item */
export function MobileItem({ name, subtitle, rows, actions }: {
  name: string; subtitle?: string; rows: { label: string; value: ReactNode }[]; actions?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{name}</p>
          {subtitle && <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{r.label}</dt>
            <dd className="truncate text-[13px]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
