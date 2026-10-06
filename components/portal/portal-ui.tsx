"use client";

import { type ReactNode } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/components/ui";
import { BoardPill } from "@/components/board";

/** Campus / scope banner — same shape as the Admin `BranchScopeBar`. */
export function PortalScopeBar({ count, noun = "records", label, Icon = Building2 }: {
  count?: number; noun?: string; label: string; Icon?: React.ElementType;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-3 py-2 text-[12.5px] text-[var(--theme-text-muted)]">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-medium text-[var(--theme-text)]">{label}</span>
      <span className="hidden sm:inline">— your own records only</span>
      {typeof count === "number" && <span className="ml-auto shrink-0 tabular-nums">{count.toLocaleString()} {noun}</span>}
    </div>
  );
}

/** Label / value tile — identical markup to the Admin student + employee detail tiles. */
export function InfoTile({ label, value, className = "" }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-lg border border-[var(--theme-border)] px-3 py-2", className)}>
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <div className="truncate text-[14px] font-medium">{value}</div>
    </div>
  );
}

/** Read-only field row used across the profile views. */
export function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] py-2.5 last:border-b-0">
      <span className="shrink-0 text-[13px] text-[var(--theme-text-muted)]">{label}</span>
      <span className="min-w-0 truncate text-[14px] font-medium text-right">{value}</span>
    </div>
  );
}

/** Thin progress meter — same bar styling the Admin fee board uses. */
export function ProgressMeter({ value, tone = "var(--theme-success)", label }: {
  value: number; tone?: string; label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--theme-border)]">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${clamped}%`, background: tone }} />
      </div>
      {label !== undefined && <span className="w-12 shrink-0 text-right text-[13px] tabular-nums text-[var(--theme-text-muted)]">{label}</span>}
    </div>
  );
}

/** Key / value list used inside detail modals (Admin `detailFields` shape). */
export function DetailGrid({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map((f) => <InfoTile key={f.label} label={f.label} value={f.value} />)}
    </div>
  );
}

/** Compact status chip built on the Admin `BoardPill` (solid, theme-aware). */
export function TonePill({ label, color }: { label: string; color: string }) {
  return <BoardPill label={label} color={color} />;
}
