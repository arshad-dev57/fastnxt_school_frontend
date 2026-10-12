"use client";

import { useId, useState, type ReactNode } from "react";
import { Download, FileDown, LoaderCircle } from "lucide-react";
import { Btn, Card, CardHead, PageHeader, Select, cn, rs, type IconType } from "./ui";
import { exportReportTablesCsv } from "@/lib/print-report";
import { downloadReportPdfFromDom } from "@/lib/pdf-export";

/* ============================================================================
   Financial report kit — screen UI + accounting-style branded PDF (jsPDF) + CSV.
   ========================================================================== */

export const money = (n?: number) => (n === undefined || n === null || n === 0 ? "—" : rs(n));
export const moneySigned = (n: number) => (n < 0 ? `(${rs(Math.abs(n))})` : rs(n));

/** Report page: Export = CSV, Print/PDF = branded A4 PDF download (like accounting-web-app). */
export function ReportPage({
  title,
  subtitle,
  Icon,
  filters,
  actions,
  children,
  printSubtitle,
  preparedBy,
}: {
  title: string;
  subtitle?: string;
  Icon?: IconType;
  filters?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  printSubtitle?: string;
  preparedBy?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const containerId = `report-export-root-${uid}`;
  const [pdfBusy, setPdfBusy] = useState(false);

  const handleExportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    exportReportTablesCsv(`#${containerId}`, `${safe || "report"}-${stamp}.csv`);
  };

  const handlePdf = async () => {
    setPdfBusy(true);
    try {
      await downloadReportPdfFromDom({
        reportTitle: title,
        subtitle: printSubtitle || subtitle,
        containerSelector: `#${containerId}`,
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={
            <>
              {actions}
              <Btn variant="secondary" Icon={Download} onClick={handleExportCsv} className="hidden sm:inline-flex">
                Export
              </Btn>
              <Btn
                variant="primary"
                Icon={pdfBusy ? LoaderCircle : FileDown}
                onClick={handlePdf}
                disabled={pdfBusy}
                className="hidden sm:inline-flex"
              >
                {pdfBusy ? "Preparing…" : "PDF"}
              </Btn>
            </>
          }
        />
        <div className="px-4 sm:px-6">
          {filters ? <div className="flex flex-wrap items-center gap-3 py-3">{filters}</div> : null}
        </div>
      </div>

      <div className="px-4 pb-24 pt-2 sm:px-6">
        <div id={containerId} className="report-print-shell space-y-5">
          {children}
        </div>
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
    <div className={cn("report-card", className)} data-print-title={title || undefined} data-print-subtitle={subtitle || undefined}>
      <Card pad={false}>
        {title && (
          <div className="no-print">
            <CardHead title={title} subtitle={subtitle} Icon={Icon} right={right} />
          </div>
        )}
        <span className="print-section-title sr-only">{title}</span>
        {subtitle ? <span className="print-section-subtitle sr-only">{subtitle}</span> : null}
        <div className={cn("min-w-0", pad && "p-4")}>{children}</div>
      </Card>
    </div>
  );
}

export type ReportCol = { label: string; align?: "left" | "right"; className?: string };

/** Professional report table (horizontally scrollable on small screens). */
export function ReportTable({ columns, children, minWidth = 620 }: { columns: ReportCol[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full border-collapse text-[14px]" style={{ minWidth }}>
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
    <tr className="border-t-2 border-[var(--theme-border-strong)] bg-[var(--theme-sidebar)] font-semibold total">
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
