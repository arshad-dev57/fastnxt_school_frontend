/**
 * Opens a clean A4 report in a new window for Print / Save as PDF.
 * Avoids printing the live app chrome (which looks like a screenshot).
 */

import type { PrintMeta } from "@/components/print/print-document";

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableToCsv(table: HTMLTableElement): string {
  const rows = Array.from(table.querySelectorAll("tr"));
  return rows
    .map((tr) =>
      Array.from(tr.querySelectorAll("th,td"))
        .map((cell) => {
          const text = (cell.textContent || "").replace(/\s+/g, " ").trim().replace(/"/g, '""');
          return `"${text}"`;
        })
        .join(","),
    )
    .join("\n");
}

/** Download all report tables inside a container as one CSV file. */
export function exportReportTablesCsv(containerSelector: string, filename: string) {
  const root = document.querySelector(containerSelector);
  if (!root) {
    alert("Nothing to export yet.");
    return;
  }
  const tables = Array.from(root.querySelectorAll("table.report-table, table.print-table"));
  if (tables.length === 0) {
    alert("No report table found to export.");
    return;
  }
  const chunks = tables.map((t, i) => {
    const card = t.closest(".report-card") as HTMLElement | null;
    const heading =
      card?.dataset.printTitle ||
      card?.querySelector(".print-section-title")?.textContent?.trim() ||
      `Section ${i + 1}`;
    return `${heading}\n${tableToCsv(t as HTMLTableElement)}`;
  });
  const blob = new Blob([chunks.join("\n\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function cloneTablesHtml(containerSelector: string): string {
  const root = document.querySelector(containerSelector);
  if (!root) return "<p>No report data available.</p>";

  const cards = Array.from(root.querySelectorAll(".report-card"));
  if (cards.length === 0) {
    // Fallback: all tables
    const tables = Array.from(root.querySelectorAll("table"));
    return tables
      .map((t) => `<div class="section">${(t as HTMLTableElement).outerHTML}</div>`)
      .join("");
  }

  return cards
    .map((card) => {
      const el = card as HTMLElement;
      const title =
        el.dataset.printTitle ||
        (card.querySelector(".print-section-title") as HTMLElement | null)?.textContent?.trim() ||
        "";
      const subtitle =
        el.dataset.printSubtitle ||
        (card.querySelector(".print-section-subtitle") as HTMLElement | null)?.textContent?.trim() ||
        "";
      const table = card.querySelector("table");
      if (!table) return "";
      const clone = table.cloneNode(true) as HTMLTableElement;
      clone.removeAttribute("style");
      clone.querySelectorAll("[style]").forEach((node) => node.removeAttribute("style"));
      return `
        <div class="section">
          ${title ? `<h3>${esc(title)}</h3>` : ""}
          ${subtitle ? `<p class="muted">${esc(subtitle)}</p>` : ""}
          ${clone.outerHTML}
        </div>`;
    })
    .join("");
}

export function openA4PrintWindow(opts: {
  title: string;
  subtitle?: string;
  meta: PrintMeta;
  containerSelector: string;
  preparedBy?: string;
}) {
  const { title, subtitle, meta, containerSelector, preparedBy = "Accounts Office" } = opts;
  const bodyHtml = cloneTablesHtml(containerSelector);
  const contact = [meta.phone, meta.email].filter(Boolean).join(" · ");
  const printed = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const logo = meta.logoUrl
    ? `<img src="${esc(meta.logoUrl)}" alt="" class="logo" />`
    : `<div class="logo-fallback">${esc((meta.shortName || meta.schoolName || "S").charAt(0))}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)} — ${esc(meta.schoolName)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { width: 100%; max-width: 180mm; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand { display: flex; gap: 12px; align-items: center; min-width: 0; }
    .logo { width: 56px; height: 56px; object-fit: contain; }
    .logo-fallback {
      width: 56px; height: 56px; border: 2px solid #000; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800;
    }
    .school { font-size: 18px; font-weight: 700; line-height: 1.2; margin: 0; }
    .meta { color: #444; font-size: 11px; margin: 2px 0 0; }
    .right { text-align: right; font-size: 11px; color: #444; white-space: nowrap; }
    .right strong { display: block; color: #000; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    .sub { color: #555; margin: 0 0 14px; font-size: 11px; }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section h3 {
      margin: 0 0 4px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
    }
    .muted { color: #666; margin: 0 0 8px; font-size: 11px; }
    table { width: 100% !important; min-width: 0 !important; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border-bottom: 1px solid #ccc;
      padding: 7px 8px;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
    }
    th {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      background: #f3f4f6 !important;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td:last-child, th:last-child { text-align: right; font-variant-numeric: tabular-nums; }
    tr.total td, .font-semibold td, .font-bold td { font-weight: 700; }
    footer {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #999;
      font-size: 11px;
      color: #555;
    }
    .sign-line { width: 140px; border-top: 1px solid #000; margin-bottom: 6px; height: 36px; }
    .foot-note { text-align: center; color: #777; font-size: 10px; margin-top: 18px; }
    @media print {
      body { margin: 0; }
      .sheet { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header>
      <div class="brand">
        ${logo}
        <div>
          <p class="school">${esc(meta.schoolName)}</p>
          ${meta.address ? `<p class="meta">${esc(meta.address)}</p>` : ""}
          ${contact ? `<p class="meta">${esc(contact)}</p>` : ""}
        </div>
      </div>
      <div class="right">
        <strong>${esc(title)}</strong>
        Printed: ${esc(printed)}<br/>
        ${meta.session ? `Session: ${esc(meta.session)}` : ""}
      </div>
    </header>
    <h1>${esc(title)}</h1>
    ${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}
    ${bodyHtml}
    <footer>
      <div>
        <div class="sign-line"></div>
        <strong style="color:#000">Prepared by</strong><br/>${esc(preparedBy)}
      </div>
      <div style="text-align:right">
        <div class="sign-line" style="margin-left:auto"></div>
        <strong style="color:#000">Verified by</strong><br/>${esc(meta.principal || "Principal / Admin")}
      </div>
    </footer>
    <p class="foot-note">Computer-generated report · ${esc(meta.schoolName)} · FastNxt<br/>
      Tip: choose "Save as PDF" or "Microsoft Print to PDF" for a full A4 document (not a thermal receipt printer).</p>
  </div>
</body>
</html>`;

  // Hidden iframe — not blocked by pop-up blockers (unlike window.open).
  const iframeId = "bisons-a4-print-frame";
  document.getElementById(iframeId)?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = iframeId;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    alert("Could not prepare the print document. Please try again.");
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const gate = { done: false, pending: 0 };

  const runPrint = () => {
    if (gate.done) return;
    gate.done = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Keep frame briefly so the print dialog can finish reading it.
      window.setTimeout(() => {
        document.getElementById(iframeId)?.remove();
      }, 60_000);
    }
  };

  const imgs = Array.from(doc.images || []);
  if (imgs.length === 0) {
    window.setTimeout(runPrint, 100);
    return;
  }

  gate.pending = imgs.length;
  const onImgReady = () => {
    gate.pending -= 1;
    if (gate.pending <= 0) window.setTimeout(runPrint, 50);
  };
  imgs.forEach((img) => {
    if (img.complete) onImgReady();
    else {
      img.addEventListener("load", onImgReady);
      img.addEventListener("error", onImgReady);
    }
  });
  // Safety timeout if an image hangs
  window.setTimeout(runPrint, 1500);
}
