"use client";

import { type ReactNode } from "react";
import { Download, Printer } from "lucide-react";
import { Btn, Card, CardHead, PageHeader, Select, cn, rs, type IconType } from "./ui";

/* ============================================================================
   Financial report kit — professional report layout (tables + totals) shared by
   the accounting reports (Trial Balance, P&L, Balance Sheet, Ledger, Cash Flow).
   Uses the existing Card / PageHeader / theme tokens. UI only.
   ========================================================================== */

export const money = (n?: number) => (n === undefined || n === null || n === 0 ? "—" : rs(n));
export const moneySigned = (n: number) => (n < 0 ? `(${rs(Math.abs(n))})` : rs(n));

/** Report page: title + optional filter bar + export/print actions. */
export function ReportPage({ title, subtitle, Icon, filters, actions, children }: {
  title: string; subtitle?: string; Icon?: IconType; filters?: ReactNode; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {actions}
            <Btn variant="secondary" Icon={Download} className="hidden sm:inline-flex">Export</Btn>
            <Btn variant="secondary" Icon={Printer} onClick={() => window.print()} className="hidden sm:inline-flex">Print</Btn>
          </>
        }
      />
      <div className="px-4 pb-24 sm:px-6">
        {filters && <div className="flex flex-wrap items-center gap-3 py-3">{filters}</div>}
        <div className="space-y-5">{children}</div>
      </div>
    </>
  );
}

/** Compact labelled filter (used in report and list toolbars). */
export function FilterSelect({ label, options, value, onChange, className = "w-40" }: {
  label: string; options: readonly string[]; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="whitespace-nowrap text-[12px] font-medium text-[var(--theme-text-muted)]">{label}</span>
      <Select options={options} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} className={className} />
    </label>
  );
}

export function ReportCard({ title, subtitle, Icon, right, children, className = "", pad = false }: {
  title?: string; subtitle?: string; Icon?: IconType; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean;
}) {
  return (
    <Card pad={false} className={className}>
      {title && <CardHead title={title} subtitle={subtitle} Icon={Icon} right={right} />}
      <div className={cn("min-w-0", pad && "p-4")}>{children}</div>
    </Card>
  );
}

export type ReportCol = { label: string; align?: "left" | "right"; className?: string };

/** Professional report table (horizontally scrollable on small screens). */
export function ReportTable({ columns, children, minWidth = 620 }: { columns: ReportCol[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[14px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-[var(--theme-border)]">
            {columns.map((c) => (
              <th key={c.label}
                className={cn("px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]",
                  c.align === "right" ? "text-right" : "text-left", c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--theme-border)]">{children}</tbody>
      </table>
    </div>
  );
}

/** Report row. */
export function RRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-[var(--theme-hover)]", className)}>{children}</tr>;
}

/** Report cell. */
export function RC({ children, align = "left", bold, muted, danger, className = "", colSpan }: {
  children: ReactNode; align?: "left" | "right"; bold?: boolean; muted?: boolean; danger?: boolean; className?: string; colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-3 py-2.5",
      align === "right" && "text-right tabular-nums",
      bold && "font-semibold",
      muted && "text-[var(--theme-text-muted)]",
      danger && "text-[var(--theme-danger-text)]",
      className)}>
      {children}
    </td>
  );
}

/** Emphasised total row. */
export function RTotal({ children }: { children: ReactNode }) {
  return (
    <tr className="border-t-2 border-[var(--theme-border-strong)] bg-[var(--theme-sidebar)] font-semibold">
      {children}
    </tr>
  );
}

/** Section band inside a report table (e.g. "INCOME", "ASSETS"). */
export function RSection({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="bg-[var(--theme-sidebar)]">
      <td colSpan={colSpan} className="px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">{label}</td>
    </tr>
  );
}
