"use client";

import { useState, type ReactNode } from "react";
import {
  Calendar as CalendarIcon, Check, Columns3, Kanban as KanbanIcon, Search, Table2, X,
} from "lucide-react";
import { cn, type IconType } from "./ui";
import { BoardPill } from "./board";

/* ============================================================================
   Board kit — reusable monday.com-style workspace pieces shared by the
   management/list pages (Students, Employees, Admission Letters, Job Letters).
   Layout only: every page keeps its own data, fields, forms and actions.
   ========================================================================== */

export type BoardView = "table" | "kanban" | "calendar";
const VIEW_ICON: Record<BoardView, IconType> = { table: Table2, kanban: KanbanIcon, calendar: CalendarIcon };

/* ---------------------------------------------------------------- view tabs */
export function ViewTabs({ views, value, onChange }: {
  views: readonly { key: BoardView; label: string }[]; value: BoardView; onChange: (v: BoardView) => void;
}) {
  return (
    <div className="mt-3 flex gap-1 overflow-x-auto border-b border-[var(--theme-border)]">
      {views.map((v) => {
        const I = VIEW_ICON[v.key];
        const active = value === v.key;
        return (
          <button key={v.key} type="button" onClick={() => onChange(v.key)}
            className={cn("relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t px-3 pb-3 pt-2 text-[15px] transition-colors hover:bg-[var(--theme-hover)]",
              active ? "font-medium text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]")}>
            <I className="h-[18px] w-[18px]" />{v.label}
            {active && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[var(--theme-primary)]" />}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------ toolbar: single pick */
export function ToolDropdown({ Icon, label, options, value, onChange, allLabel = "All" }: {
  Icon: IconType; label: string; options: readonly string[]; value: string;
  onChange: (v: string) => void; allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const pick = (o: string) => { onChange(o === allLabel ? "" : o); setOpen(false); };
  return (
    <span className="relative inline-flex shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} title={label}
        className={cn("flex h-9 items-center gap-2 rounded px-2.5 text-[14px] text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-border)]",
          value && "bg-[var(--theme-border)]")}>
        <Icon className="h-5 w-5" />
        <span className="hidden max-w-[110px] truncate sm:inline">{value || label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-48 overflow-y-auto rounded-lg bg-[var(--theme-surface)] p-1 shadow-xl ring-1 ring-[var(--theme-border)]">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
            {[allLabel, ...options].map((o) => {
              const active = o === allLabel ? value === "" : value === o;
              return (
                <button key={o} type="button" onClick={() => pick(o)}
                  className={cn("flex h-9 w-full items-center gap-2 rounded px-2.5 text-left text-[14px] hover:bg-[var(--theme-hover)]", active && "font-medium")}>
                  <Check className={cn("h-4 w-4 shrink-0", active ? "text-[var(--theme-primary)]" : "opacity-0")} />
                  <span className="truncate">{o}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </span>
  );
}

/* ---------------------------------------------------- toolbar: hide columns */
export function ColumnsDropdown({ columns, hidden, onToggle }: {
  columns: readonly { key: string; label: string }[]; hidden: string[]; onToggle: (k: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Hide columns"
        className={cn("flex h-9 items-center gap-2 rounded px-2.5 text-[14px] text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-border)]",
          hidden.length > 0 && "bg-[var(--theme-border)]")}>
        <Columns3 className="h-5 w-5" /><span className="hidden sm:inline">Hide</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-52 overflow-y-auto rounded-lg bg-[var(--theme-surface)] p-1 shadow-xl ring-1 ring-[var(--theme-border)]">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Visible columns</p>
            {columns.map((c) => {
              const shown = !hidden.includes(c.key);
              return (
                <button key={c.key} type="button" onClick={() => onToggle(c.key)}
                  className="flex h-9 w-full items-center gap-2 rounded px-2.5 text-left text-[14px] hover:bg-[var(--theme-hover)]">
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    shown ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white" : "border-[var(--theme-border-strong)]")}>
                    {shown && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- toolbar */
export function BoardToolbarBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1 py-3">{children}</div>;
}

export function BoardInlineSearch({ value, onChange, placeholder = "Search" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex h-9 min-w-0 shrink-0 items-center gap-2 rounded px-2 hover:bg-[var(--theme-border)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
      <Search className="h-5 w-5 shrink-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-28 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-[var(--theme-text-faint)] focus:w-44 sm:w-36" />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="text-[var(--theme-text-faint)] hover:text-[var(--theme-text)]"><X className="h-4 w-4" /></button>}
    </div>
  );
}

/* ------------------------------------------------------ status pill helpers */
export function statusColor(value: string): string {
  const v = value.toLowerCase();
  if (["active", "approved", "generated", "printed", "completed", "done", "present", "paid", "sent"].includes(v)) return "var(--theme-success)";
  if (["inactive", "pending", "draft", "new"].includes(v)) return "var(--theme-pending)";
  if (["rejected", "absent", "overdue", "failed"].includes(v)) return "var(--theme-danger)";
  if (["under review", "review", "working on it", "partially paid"].includes(v)) return "var(--theme-warning)";
  if (["assigned", "in progress"].includes(v)) return "var(--theme-info)";
  return "var(--theme-text-muted)";
}

export function StatusPill({ label, className = "" }: { label: string; className?: string }) {
  return <BoardPill label={label} color={statusColor(label)} className={className} />;
}
