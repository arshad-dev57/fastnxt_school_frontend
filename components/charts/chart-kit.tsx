"use client";

import { type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Card, CardHead, EmptyState, cn, type IconType } from "@/components/ui";

/* ============================================================================
   Reusable chart presentation kit — keeps every dashboard chart consistent
   with the existing BisonsEduCore360 card / typography / spacing language.
   ========================================================================== */

/** A themed card that frames a chart (title, description, optional filter). */
export function ChartCard({ title, subtitle, Icon, right, children, className = "" }: {
  title: string; subtitle?: string; Icon?: IconType; right?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <Card pad={false} className={cn("flex min-w-0 flex-col", className)}>
      <CardHead title={title} subtitle={subtitle} Icon={Icon} right={right} />
      <div className="min-w-0 flex-1 px-2 pb-3 sm:px-3">{children}</div>
    </Card>
  );
}

/** Fixed-height, fully responsive chart viewport (prevents horizontal overflow). */
export function ChartBox({ height = 260, children }: { height?: number; children: ReactNode }) {
  return <div className="w-full" style={{ height }}>{children}</div>;
}

/** Rendered instead of a broken/empty chart when a period has no data. */
export function ChartEmpty({ message = "There is no data for the selected period.", Icon = Inbox, height = 240 }: {
  message?: string; Icon?: IconType; height?: number;
}) {
  return <div className="flex items-center justify-center" style={{ height }}><EmptyState Icon={Icon} title="No data available" message={message} /></div>;
}

/** Compact coloured legend used beside donuts / multi-series charts. */
const LEGEND_COLS: Record<number, string> = {
  1: "space-y-1.5",
  2: "grid grid-cols-2 gap-x-4 gap-y-1.5",
  3: "grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3",
  4: "grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4",
};

export function ChartLegend({ items, columns = 1 }: {
  items: { label: string; color: string; value?: string }[]; columns?: 1 | 2 | 3 | 4;
}) {
  return (
    <ul className={cn(LEGEND_COLS[columns] ?? LEGEND_COLS[1])}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-[12px]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
          <span className="min-w-0 flex-1 truncate text-[var(--theme-text-muted)]">{it.label}</span>
          {it.value && <span className="shrink-0 font-medium text-[var(--theme-text)]">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Small summary tile (e.g. "Total Collected", "Collection Rate"). */
export function ChartStat({ label, value, tone = "default", Icon }: {
  label: string; value: string; tone?: "default" | "success" | "warning" | "danger"; Icon?: IconType;
}) {
  const color =
    tone === "success" ? "var(--theme-success-text)"
    : tone === "warning" ? "var(--theme-warning-text)"
    : tone === "danger" ? "var(--theme-danger-text)"
    : "var(--theme-text)";
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-[16px] font-bold" style={{ color }}>
        {Icon && <Icon className="h-4 w-4 shrink-0" />}{value}
      </p>
    </div>
  );
}

/** Compact segmented control used for chart period / range filters. */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: readonly { key: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-lg border border-[var(--theme-border)] p-0.5">
      {options.map((o) => (
        <button key={o.key} type="button" onClick={() => onChange(o.key)} aria-pressed={value === o.key}
          className={cn("rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
            value === o.key ? "bg-[var(--theme-primary)] text-white" : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
