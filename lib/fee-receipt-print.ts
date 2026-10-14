import type { FeePaymentItem, FeePaymentPaperSize } from "@/lib/auth/api-client";

function esc(s: string | null | undefined) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number) {
  return `Rs ${Math.round(Number(n) || 0).toLocaleString("en-PK")}`;
}

function formatPaidAt(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return esc(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return esc(iso);
  }
}

function metaCell(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `<div class="meta"><div class="lbl">${esc(label)}</div><div class="val">${esc(value)}</div></div>`;
}

/**
 * Self-contained professional fee receipt HTML for iframe printing.
 * No Tailwind / computed-style cloning — clean CSS only.
 */
export function buildFeeReceiptPrintHtml(
  receipt: FeePaymentItem,
  paperSize: FeePaymentPaperSize = "A4"
): string {
  const school = receipt.school || { name: "School" };
  const lines = Array.isArray(receipt.lines) ? receipt.lines : [];
  const net = Math.max(0, (receipt.grossAmount || 0) - (receipt.discount || 0));
  const isPaid =
    String(receipt.status || "").toUpperCase().includes("PAID") &&
    !String(receipt.status || "").toUpperCase().includes("PARTIAL");
  const thermal = paperSize === "80mm" || paperSize === "58mm";
  const narrow = paperSize === "58mm";

  const page =
    paperSize === "80mm"
      ? "@page { size: 80mm auto; margin: 2mm; }"
      : paperSize === "58mm"
        ? "@page { size: 58mm auto; margin: 1.5mm; }"
        : "@page { size: A4 portrait; margin: 12mm; }";

  const width =
    paperSize === "80mm" ? "72mm" : paperSize === "58mm" ? "52mm" : "170mm";

  const lineRows =
    lines.length > 0
      ? lines
          .map(
            (l) => `<tr>
          <td>${esc(l.particular)}</td>
          ${thermal && narrow ? "" : `<td>${esc(l.frequency || "—")}</td>`}
          <td class="num">${money(l.amount)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="${narrow ? 2 : 3}" class="muted center">Fee charges for ${esc(receipt.period)}</td></tr>`;

  const logo = school.logoUrl
    ? `<img class="logo" src="${esc(school.logoUrl)}" alt="" />`
    : `<div class="logo-fallback">${esc((school.shortName || school.name || "S").slice(0, 1).toUpperCase())}</div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Fee Receipt ${esc(receipt.receiptNo)}</title>
<style>
  ${page}
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff; color: #111;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { padding: ${thermal ? "2mm" : "0"}; }
  .sheet {
    width: ${width};
    max-width: 100%;
    margin: 0 auto;
    border: 1px solid #cbd5e1;
    overflow: hidden;
  }
  .dup {
    background: #fffbeb;
    color: #92400e;
    border-bottom: 2px dashed #b45309;
    text-align: center;
    font-weight: 800;
    letter-spacing: 0.22em;
    font-size: ${narrow ? "8px" : "11px"};
    padding: 6px 8px;
  }
  .head {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: #0f4c81;
    color: #fff;
    padding: ${narrow ? "8px" : "14px 16px"};
  }
  .logo, .logo-fallback {
    width: ${narrow ? "28px" : "48px"};
    height: ${narrow ? "28px" : "48px"};
    border-radius: 6px;
    object-fit: contain;
    background: #fff;
    flex-shrink: 0;
  }
  .logo-fallback {
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.18); color: #fff;
    font-weight: 800; font-size: ${narrow ? "12px" : "18px"};
  }
  .school { flex: 1; min-width: 0; }
  .school h1 {
    margin: 0; font-size: ${narrow ? "11px" : "16px"};
    font-weight: 700; line-height: 1.2;
  }
  .school p {
    margin: 2px 0 0; font-size: ${narrow ? "7px" : "10px"};
    opacity: 0.9; line-height: 1.35;
  }
  .head-right { text-align: right; flex-shrink: 0; }
  .head-right .title {
    font-size: ${narrow ? "8px" : "10px"};
    font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  }
  .head-right .rcp {
    margin-top: 4px; display: inline-block;
    background: rgba(255,255,255,0.16);
    padding: 3px 8px; border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: ${narrow ? "8px" : "11px"}; font-weight: 700;
  }
  .strip {
    display: flex; justify-content: space-between; align-items: center;
    gap: 8px; padding: ${narrow ? "6px 8px" : "10px 16px"};
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .badge {
    display: inline-block; padding: 3px 8px; border-radius: 4px;
    font-size: ${narrow ? "8px" : "10px"}; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: ${isPaid ? "#dcfce7" : "#fef3c7"};
    color: ${isPaid ? "#166534" : "#92400e"};
    border: 1px solid ${isPaid ? "#86efac" : "#fcd34d"};
  }
  .paid-box { text-align: right; }
  .paid-box .tiny {
    font-size: ${narrow ? "7px" : "9px"}; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .paid-box .amt {
    font-size: ${narrow ? "12px" : "16px"}; font-weight: 800; color: #0f4c81;
  }
  .body { padding: ${narrow ? "8px" : "14px 16px"}; }
  .grid {
    display: grid;
    grid-template-columns: ${thermal ? "1fr" : "1fr 1fr 1fr"};
    gap: ${narrow ? "6px" : "10px 14px"};
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: ${narrow ? "6px" : "10px 12px"};
    margin-bottom: ${narrow ? "8px" : "12px"};
  }
  .meta .lbl {
    font-size: ${narrow ? "7px" : "9px"};
    color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
    font-weight: 600; margin-bottom: 1px;
  }
  .meta .val {
    font-size: ${narrow ? "9px" : "12px"};
    font-weight: 650; color: #0f172a;
  }
  .section-title {
    font-size: ${narrow ? "7px" : "9px"};
    font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.08em;
    margin: 0 0 6px;
  }
  table {
    width: 100%; border-collapse: collapse;
    font-size: ${narrow ? "8px" : "11px"};
    margin-bottom: ${narrow ? "8px" : "12px"};
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: ${narrow ? "4px" : "7px 8px"};
    vertical-align: top;
  }
  th {
    background: #e8f1f8; text-align: left; font-weight: 700; color: #0f4c81;
  }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .muted { color: #64748b; }
  .center { text-align: center; }
  .totals {
    width: ${thermal ? "100%" : "240px"};
    margin-left: auto;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    padding: ${narrow ? "6px" : "10px 12px"};
    font-size: ${narrow ? "8px" : "11px"};
  }
  .totals .row {
    display: flex; justify-content: space-between; gap: 12px;
    padding: 3px 0;
  }
  .totals .row span:last-child { font-weight: 600; white-space: nowrap; }
  .totals .paid {
    border-top: 1px solid #94a3b8; margin-top: 4px; padding-top: 6px;
    font-weight: 800; color: #0f4c81; font-size: ${narrow ? "9px" : "12px"};
  }
  .totals .bal { font-weight: 700; }
  .signs {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
    margin-top: ${narrow ? "12px" : "28px"};
    text-align: center; font-size: ${narrow ? "8px" : "10px"}; color: #475569;
  }
  .signs .line {
    border-top: 1px solid #64748b; margin: 36px auto 6px; width: 80%;
  }
  .signs strong { color: #0f172a; }
  .foot {
    margin-top: ${narrow ? "8px" : "14px"};
    padding-top: 8px; border-top: 1px dashed #cbd5e1;
    text-align: center; color: #64748b;
    font-size: ${narrow ? "7px" : "9px"};
  }
</style>
</head>
<body>
  <div class="sheet">
    ${receipt.duplicate ? `<div class="dup">DUPLICATE COPY</div>` : ""}
    <div class="head">
      ${logo}
      <div class="school">
        <h1>${esc(school.name || "School")}</h1>
        ${school.address ? `<p>${esc(school.address)}</p>` : ""}
        <p>${esc([school.phone, school.email, school.website].filter(Boolean).join(" · "))}</p>
      </div>
      <div class="head-right">
        <div class="title">Payment Receipt</div>
        <div class="rcp">${esc(receipt.receiptNo)}</div>
      </div>
    </div>
    <div class="strip">
      <span class="badge">${esc(receipt.status)}</span>
      <div class="paid-box">
        <div class="tiny">Amount Paid</div>
        <div class="amt">${money(receipt.amount)}</div>
      </div>
    </div>
    <div class="body">
      <div class="grid">
        ${metaCell("Student", receipt.studentName)}
        ${metaCell("Admission No", receipt.admissionNo)}
        ${metaCell("Student ID", receipt.studentCode)}
        ${metaCell("Class / Section", `${receipt.cls}-${receipt.section}`)}
        ${metaCell("Session", receipt.session || school.academicSession)}
        ${metaCell("Fee Period", receipt.period)}
        ${metaCell("Invoice No", receipt.invoiceNo)}
        ${metaCell("Payment Date", formatPaidAt(receipt.paidAt))}
        ${metaCell("Payment Method", receipt.method)}
        ${metaCell(
          receipt.method === "Cash" ? "Cash Account" : "Bank Account",
          receipt.cashBankAccountName
            ? receipt.cashBankAccountNumber
              ? `${receipt.cashBankAccountName} (${receipt.cashBankAccountNumber})`
              : receipt.cashBankAccountName
            : ""
        )}
        ${metaCell("Reference / Txn", receipt.reference)}
        ${metaCell("Receipt Voucher", receipt.voucherNo)}
        ${metaCell("Received By", receipt.cashierName || "—")}
      </div>

      <p class="section-title">Fee particulars</p>
      <table>
        <thead>
          <tr>
            <th>Particular</th>
            ${narrow ? "" : "<th>Frequency</th>"}
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Gross Amount</span><span>${money(receipt.grossAmount)}</span></div>
        <div class="row"><span>Discount</span><span>${receipt.discount ? `− ${money(receipt.discount)}` : "—"}</span></div>
        <div class="row"><span>Total Payable</span><span>${money(net)}</span></div>
        <div class="row"><span>Previous Balance</span><span>${money(receipt.previousBalance)}</span></div>
        <div class="row paid"><span>Amount Paid</span><span>${money(receipt.amount)}</span></div>
        <div class="row bal"><span>Remaining Balance</span><span>${money(receipt.remainingBalance)}</span></div>
      </div>

      ${
        thermal
          ? `<p class="foot">Collected by: ${esc(receipt.cashierName || "—")}</p>`
          : `<div class="signs">
              <div><div class="line"></div><strong>Cashier / Collector</strong><div>${esc(receipt.cashierName || "")}</div></div>
              <div><div class="line"></div><strong>Authorized Signatory</strong><div>${esc(school.principal || "")}</div></div>
            </div>`
      }

      <p class="foot">
        Computer-generated payment receipt · ${esc(receipt.receiptNo)}
        ${receipt.duplicate ? " · DUPLICATE COPY" : ""}
        · Please retain for your records.
      </p>
    </div>
  </div>
</body>
</html>`;
}
