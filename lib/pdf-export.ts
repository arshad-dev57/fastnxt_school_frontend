/**
 * Export on-screen report tables to a branded A4 PDF
 * (same flow as accounting-web-app: createBrandedReport + jspdf-autotable + download).
 */

export type PdfTableSection = {
  title?: string;
  subtitle?: string;
  head: string[];
  body: (string | number)[][];
};

function cellText(el: Element): string {
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

/** Pull report sections from the live DOM (ReportCard + ReportTable). */
export function collectReportSections(containerSelector: string): PdfTableSection[] {
  const root = document.querySelector(containerSelector);
  if (!root) return [];

  const cards = Array.from(root.querySelectorAll(".report-card"));
  const sections: PdfTableSection[] = [];

  const pushTable = (table: HTMLTableElement, title?: string, subtitle?: string) => {
    const head = Array.from(table.querySelectorAll("thead th")).map(cellText);
    const body = Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map(cellText),
    );
    if (head.length === 0 && body.length === 0) return;
    // Normalize row column counts to head length when possible
    const cols = head.length || Math.max(...body.map((r) => r.length), 0);
    const normalizedHead = head.length ? head : Array.from({ length: cols }, (_, i) => `Col ${i + 1}`);
    const normalizedBody = body.map((row) => {
      const next = row.slice(0, cols);
      while (next.length < cols) next.push("");
      return next;
    });
    sections.push({ title, subtitle, head: normalizedHead, body: normalizedBody });
  };

  if (cards.length > 0) {
    cards.forEach((card) => {
      const el = card as HTMLElement;
      const title = el.dataset.printTitle || el.querySelector(".print-section-title")?.textContent?.trim() || "";
      const subtitle =
        el.dataset.printSubtitle || el.querySelector(".print-section-subtitle")?.textContent?.trim() || "";
      const table = card.querySelector("table.report-table, table") as HTMLTableElement | null;
      if (table) pushTable(table, title || undefined, subtitle || undefined);
    });
  } else {
    Array.from(root.querySelectorAll("table.report-table, table.print-table")).forEach((t, i) => {
      pushTable(t as HTMLTableElement, `Section ${i + 1}`);
    });
  }

  return sections;
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return [30, 58, 138];
  const n = parseInt(cleaned, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Download a branded PDF built from report table sections. */
export async function downloadBrandedPdf(opts: {
  reportTitle: string;
  subtitle?: string;
  sections: PdfTableSection[];
  filename?: string;
  orientation?: "portrait" | "landscape";
}): Promise<void> {
  if (!opts.sections.length) {
    alert("No report data to export yet.");
    return;
  }

  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;
  const { createBrandedReport } = await import("@/lib/pdf-branding");

  const { doc, margin, pageWidth, startY, accentHex, finalize } = await createBrandedReport({
    reportTitle: opts.reportTitle,
    orientation: opts.orientation || "portrait",
  });

  const accentRgb = hexToRgbTuple(accentHex);
  let y = startY;

  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(opts.subtitle, pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  for (const section of opts.sections) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = margin + 10;
    }

    if (section.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text(section.title, margin, y);
      y += 5;
    }
    if (section.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(section.subtitle, margin, y);
      y += 4;
    }

    autoTable(doc, {
      startY: y,
      head: [section.head],
      body: section.body,
      theme: "striped",
      headStyles: {
        fillColor: accentRgb,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: { fontSize: 9, cellPadding: 2.5, overflow: "linebreak" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });

    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y) + 10;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const safe = opts.reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  finalize({
    filename: opts.filename || `${safe || "report"}-${stamp}.pdf`,
  });
}

/** One-click: scrape ReportPage DOM → branded PDF download. */
export async function downloadReportPdfFromDom(opts: {
  reportTitle: string;
  subtitle?: string;
  containerSelector: string;
  filename?: string;
}): Promise<void> {
  const sections = collectReportSections(opts.containerSelector);
  await downloadBrandedPdf({
    reportTitle: opts.reportTitle,
    subtitle: opts.subtitle,
    sections,
    filename: opts.filename,
  });
}
