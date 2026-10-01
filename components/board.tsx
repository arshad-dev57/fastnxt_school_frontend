"use client";

import { type ReactNode } from "react";
import { ChevronDown, Star, Search, MoreHorizontal } from "lucide-react";
import { cn, type IconType } from "./ui";

/* ============================================================================
   Board primitives — monday-style layout shared by the module board pages.
   Mirrors the structure used on the dashboard (app/(app)/dashboard/page.tsx):
   big title row + tabs + toolbar + grouped tables with colored left bars.
   ========================================================================== */

export function Board({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col bg-white">{children}</div>;
}

/* Fixed top area (title + tabs + toolbar) — pads like the dashboard header */
export function BoardBar({ children }: { children: ReactNode }) {
  return <div className="shrink-0 px-4 pt-4 sm:px-6">{children}</div>;
}

/* Scrollable content area holding the grouped tables / cards */
export function BoardBody({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-auto px-4 pb-32 sm:px-6">{children}</div>;
}

export function BoardHead({ title, subtitle, Icon, actions }: {
  title: string; subtitle?: string; Icon?: IconType; actions?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#1D4ED8] sm:flex">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <h1 className="min-w-0 truncate text-[22px] font-bold leading-tight sm:text-[30px]">{title}</h1>
        <ChevronDown className="h-6 w-6 shrink-0 text-[#676879]" />
        <Star className="hidden h-5 w-5 shrink-0 text-[#676879] hover:text-[#FFCB00] sm:block" />
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-[#F5F6F8]" aria-label="More"><MoreHorizontal className="h-5 w-5" /></button>
        </div>
      </div>
      {subtitle && <p className="mt-1 text-[14px] text-[#676879] sm:text-[15px]">{subtitle}</p>}
    </>
  );
}

export function BoardTabs<T extends string>({ tabs, value, onChange }: {
  tabs: readonly T[]; value: T; onChange: (t: T) => void;
}) {
  return (
    <div className="mt-3 flex gap-1 overflow-x-auto border-b border-[#E6E9EF]">
      {tabs.map((t) => (
        <button key={t} type="button" onClick={() => onChange(t)}
          className={cn("relative -mb-px flex shrink-0 items-center whitespace-nowrap rounded-t px-3 pb-3 pt-2 text-[15px] transition-colors hover:bg-[#F5F6F8]",
            value === t ? "font-medium text-[#323338]" : "text-[#676879]")}>
          {t}
          {value === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#2563EB]" />}
        </button>
      ))}
    </div>
  );
}

export function BoardToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1 py-3">{children}</div>;
}

export function BoardSearch({ value, onChange, placeholder = "Search", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("ml-1 flex h-9 min-w-0 shrink-0 items-center gap-2 rounded px-2 hover:bg-[#E6E9EF] focus-within:ring-2 focus-within:ring-[#2563EB]", className)}>
      <Search className="h-5 w-5 shrink-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-24 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-[#9699A6] focus:w-40 sm:w-32" />
    </div>
  );
}

/* Collapsible colored group title (Used by status / type / class groups) */
export function GroupHead({ title, color, count, open = true, onToggle }: {
  title: string; color: string; count?: number; open?: boolean; onToggle?: () => void;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1">
      <button type="button" onClick={onToggle} className="flex h-8 w-8 shrink-0 items-center justify-center rounded hover:bg-[#E6E9EF]" style={{ color }} aria-label="Toggle group">
        <ChevronDown className={cn("h-6 w-6 transition-transform", !open && "-rotate-90")} />
      </button>
      <h2 className="truncate rounded px-1 text-[19px] font-medium" style={{ color }}>{title}</h2>
      {count !== undefined && <span className="ml-1 shrink-0 text-[14px] text-[#9699A6]">{count} {count === 1 ? "item" : "items"}</span>}
    </div>
  );
}

/* Solid colored pill (matches the dashboard status / priority pills) */
export function BoardPill({ label, color, className = "" }: { label: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 min-w-0 items-center justify-center truncate rounded-sm px-2.5 text-[13px] font-medium text-white", className)}
      style={{ background: color }}>{label}</span>
  );
}

/* 44px color-bar cell that anchors each grid row */
export function BarCell({ color, children, className = "" }: { color: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center border-l-[6px]", className)} style={{ borderColor: color }}>
      {children}
    </div>
  );
}

/* Bordered wrapper for a group table (left edge stays open for the color bar) */
export function GroupTable({ children }: { children: ReactNode }) {
  return <div className="rounded-l border-y border-r border-[#E6E9EF]">{children}</div>;
}
