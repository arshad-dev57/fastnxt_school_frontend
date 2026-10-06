"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "./ui";

/* ============================================================================
   Global loading system — theme-aware skeleton shimmer.
   The shimmer styling lives in globals.css (`.skeleton`) and is disabled under
   `prefers-reduced-motion`. All colours come from theme tokens
   (--theme-skeleton / --theme-skeleton-shine) so every skeleton is correct in
   all 15 themes, light or dark.
   ========================================================================== */

export function Skeleton({ className = "", circle = false, style }: { className?: string; circle?: boolean; style?: CSSProperties }) {
  return <div aria-hidden="true" className={cn("skeleton", circle && "rounded-full", className)} style={style} />;
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", lines > 1 && i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 32 }: { size?: number }) {
  return <Skeleton circle className="shrink-0" style={{ width: size, height: size }} />;
}

export function SkeletonPill({ className = "h-6 w-20" }: { className?: string }) {
  return <Skeleton className={cn("rounded-md", className)} />;
}

/** Card frame shimmer (head + body placeholder). */
export function CardSkeleton({ height = 260, className = "" }: { height?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]", className)}>
      <div className="flex items-center gap-2 px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-56" />
        </div>
      </div>
      <div className="px-4 pb-4" style={{ height }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Avatar + text rows — for activity / list cards. */
export function ListSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]", className)}>
      <div className="flex items-center gap-2 px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-36" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-[var(--theme-border)] px-4 py-3">
          <SkeletonAvatar size={32} />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Classic table-page skeleton (fees, users, families, …). */
export function TablePageSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="px-4 pb-24 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 py-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-3 py-3">
          <Skeleton className="h-4 w-4 shrink-0" />
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className="h-4 flex-1" />)}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 border-b border-[var(--theme-border)] px-3 py-3 last:border-b-0">
            <Skeleton className="h-4 w-4 shrink-0" />
            <SkeletonAvatar size={30} />
            {Array.from({ length: cols - 1 }).map((_, c) => <Skeleton key={c} className="h-4 flex-1" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simulates the future real-data fetch for pages that still ship static mock
    data: true for `ms` after mount, then the real content is revealed. */
export function useInitialLoading(ms = 1000) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/** Simulates an async action so action buttons can show their spinner. */
export const simulateDelay = (ms = 600) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** monday-style board page skeleton (Students / Employees / Letters …). */
export function BoardPageSkeleton({ groups = 2, rows = 5, cols = 5 }: { groups?: number; rows?: number; cols?: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg sm:h-9 sm:w-24" />
          <Skeleton className="h-7 w-52 rounded-lg sm:h-9 sm:w-64" />
          <div className="flex-1" />
          <Skeleton className="hidden h-9 w-28 sm:block" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-3 flex gap-4 border-b border-[var(--theme-border)] pb-3">
          {[104, 84, 92].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4" style={{ width: w }} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 py-3">
          {[116, 128, 92, 84, 84, 104].map((w, i) => <Skeleton key={i} className="h-9 rounded-md" style={{ width: w }} />)}
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-4 pb-24 sm:px-6">
        <div className="space-y-8">
          {Array.from({ length: groups }).map((_, g) => (
            <div key={g}>
              <div className="mb-1.5 flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="overflow-hidden rounded-l border-y border-r border-[var(--theme-border)] bg-[var(--theme-surface)]">
                <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-3 py-2.5">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 w-24" />
                  {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className="h-4 flex-1" />)}
                </div>
                {Array.from({ length: rows }).map((_, r) => (
                  <div key={r} className="flex items-center gap-3 border-b border-[var(--theme-border)] px-3 py-2.5 last:border-b-0">
                    <SkeletonAvatar size={30} />
                    <Skeleton className="h-4 w-40" />
                    {Array.from({ length: cols - 1 }).map((_, c) => (
                      c === cols - 2
                        ? <SkeletonPill key={c} className="h-6 w-20" />
                        : <Skeleton key={c} className="h-4 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Dashboard skeleton — KPI row, chart cards and list cards. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-40 rounded-lg sm:h-9 sm:w-52" />
        <div className="flex-1" />
        <Skeleton className="hidden h-9 w-24 sm:block" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-16" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <CardSkeleton height={300} />
          <CardSkeleton height={300} />
          <ListSkeleton rows={3} />
        </div>
        <div className="space-y-5">
          <CardSkeleton height={150} />
          <CardSkeleton height={260} />
          <CardSkeleton height={220} />
          <ListSkeleton rows={4} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CardSkeleton height={430} />
        <CardSkeleton height={400} />
        <CardSkeleton height={380} />
        <CardSkeleton height={390} />
      </div>
    </div>
  );
}
