"use client";

import { Building2, Layers } from "lucide-react";
import { cn } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";

/* ============================================================================
   Branch UI primitives — shared by every branch-aware module page so the
   campus context reads the same everywhere (pill, column cell, scope bar).
   ========================================================================== */

/** Small campus chip (shows the short code), e.g. "MAIN". */
export function BranchPill({ branchId, className = "" }: { branchId: string; className?: string }) {
  const { availableBranches } = useBranch();
  const branch = availableBranches.find((b) => b.id === branchId);
  if (!branch) return <span className="text-[var(--theme-text-faint)]">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-primary-soft)] px-2 py-0.5 text-[12px] font-medium text-[var(--theme-primary-hover)]", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary)]" />
      {branch.code}
    </span>
  );
}

/** Table-cell friendly variant (icon + campus name). */
export function BranchCell({ branchId }: { branchId: string }) {
  const { availableBranches } = useBranch();
  const branch = availableBranches.find((b) => b.id === branchId);
  return (
    <span className="flex min-w-0 items-center gap-2 text-[14px]">
      <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />
      <span className="truncate">{branch?.name ?? "—"}</span>
    </span>
  );
}

/**
 * Inline scope banner placed at the top of every branch-aware list page.
 * - Single campus → shows which campus the data belongs to.
 * - All Branches → tells the user records are consolidated across campuses.
 */
export function BranchScopeBar({ count, noun = "records", right }: { count?: number; noun?: string; right?: React.ReactNode }) {
  const { currentBranch, isAllBranchesMode, availableBranches } = useBranch();
  const all = isAllBranchesMode();
  return (
    <div className={cn(
      "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-[12.5px]",
      all
        ? "border-[var(--theme-accent-soft)] bg-[var(--theme-accent-soft)]/40 text-[var(--theme-accent-strong)]"
        : "border-[var(--theme-border)] bg-[var(--theme-sidebar)] text-[var(--theme-text-muted)]",
    )}>
      {all ? <Layers className="h-4 w-4 shrink-0" /> : <Building2 className="h-4 w-4 shrink-0" />}
      <span className="font-medium text-[var(--theme-text)]">
        {all ? "All Branches" : currentBranch?.name}
      </span>
      <span className="hidden sm:inline">
        {all
          ? `— consolidated data from ${availableBranches.length} campuses`
          : `— ${currentBranch?.code} campus records only`}
      </span>
      {typeof count === "number" && <span className="ml-auto shrink-0 tabular-nums">{count.toLocaleString()} {noun}</span>}
      {right && <span className="shrink-0">{right}</span>}
    </div>
  );
}
