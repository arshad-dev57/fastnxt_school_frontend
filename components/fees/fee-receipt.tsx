"use client";

import { rs } from "@/components/ui";
import type { FeePaymentItem, FeePaymentPaperSize } from "@/lib/auth/api-client";

function formatPaidAt(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function FeeReceiptDocument({
  receipt,
  paperSize = "A4",
}: {
  receipt: FeePaymentItem;
  paperSize?: FeePaymentPaperSize;
}) {
  const school = receipt.school || { name: "School" };
  const lines = receipt.lines?.length ? receipt.lines : [];
  const netPayable = Math.max(0, (receipt.grossAmount || 0) - (receipt.discount || 0));
  const isThermal = paperSize === "80mm" || paperSize === "58mm";
  const compact = paperSize === "58mm";
  const accent = "#0f4c81";
  const isPaid = String(receipt.status || "").toUpperCase().includes("PAID") && !String(receipt.status || "").toUpperCase().includes("PARTIAL");

  return (
    <div
      className={`fee-receipt-print fee-receipt-${paperSize} overflow-hidden bg-white text-black ${
        isThermal ? "fee-receipt-thermal" : "rounded-lg border border-neutral-300 shadow-sm"
      }`}
      data-paper={paperSize}
      data-print-root="fee-receipt"
    >
      {receipt.duplicate ? (
        <div
          className="fee-receipt-duplicate border-b-2 border-dashed border-amber-700 bg-amber-50 px-3 py-1.5 text-center font-extrabold tracking-[0.25em] text-amber-900"
          style={{ fontSize: compact ? 9 : 11 }}
        >
          DUPLICATE COPY
        </div>
      ) : null}

      {/* Letterhead */}
      <div
        className={`flex items-start gap-3 px-4 py-3 text-white ${compact ? "gap-2 px-2 py-2" : ""}`}
        style={{ background: accent }}
      >
        {school.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={school.logoUrl}
            alt=""
            className={`shrink-0 rounded bg-white object-contain p-0.5 ${compact ? "h-9 w-9" : "h-14 w-14"}`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded bg-white/20 font-extrabold ${
              compact ? "h-9 w-9 text-[13px]" : "h-14 w-14 text-[20px]"
            }`}
          >
            {(school.shortName || school.name || "S").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className={`font-bold leading-tight tracking-tight ${compact ? "text-[12px]" : "text-[18px]"}`}>
            {school.name || "School"}
          </h2>
          {school.address ? (
            <p className={`text-white/85 ${compact ? "text-[8px]" : "text-[11px]"}`}>{school.address}</p>
          ) : null}
          <p className={`text-white/80 ${compact ? "text-[8px]" : "text-[11px]"}`}>
            {[school.phone, school.email, school.website].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className={`shrink-0 text-right ${compact ? "text-[8px]" : "text-[11px]"}`}>
          <p className="font-extrabold uppercase tracking-[0.14em]">Payment Receipt</p>
          <p className="mt-1 rounded bg-white/15 px-2 py-0.5 font-mono font-semibold">{receipt.receiptNo}</p>
        </div>
      </div>

      {/* Status + amount strip */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2 ${
          compact ? "px-2 py-1.5" : ""
        }`}
      >
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 font-bold uppercase tracking-wide ${
            compact ? "text-[8px]" : "text-[11px]"
          }`}
          style={{
            background: isPaid ? "#dcfce7" : "#fef3c7",
            color: isPaid ? "#166534" : "#92400e",
            border: `1px solid ${isPaid ? "#86efac" : "#fcd34d"}`,
          }}
        >
          {receipt.status}
        </span>
        <div className={`text-right ${compact ? "text-[10px]" : "text-[13px]"}`}>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Amount Paid</p>
          <p className="font-extrabold tabular-nums" style={{ color: accent }}>
            {rs(receipt.amount)}
          </p>
        </div>
      </div>

      <div className={compact ? "space-y-2 p-2" : "space-y-3 p-4"}>
        {/* Student + payment meta */}
        <div
          className={`grid gap-x-4 gap-y-2 rounded-md border border-neutral-200 bg-white p-2.5 ${
            isThermal ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
          } ${compact ? "text-[9px] p-1.5" : "text-[12px]"}`}
        >
          <Meta label="Student" value={receipt.studentName} compact={compact} />
          {receipt.admissionNo ? <Meta label="Admission No" value={receipt.admissionNo} compact={compact} /> : null}
          {receipt.studentCode ? <Meta label="Student ID" value={receipt.studentCode} compact={compact} /> : null}
          <Meta label="Class / Section" value={`${receipt.cls}-${receipt.section}`} compact={compact} />
          {(receipt.session || school.academicSession) ? (
            <Meta label="Session" value={receipt.session || school.academicSession || ""} compact={compact} />
          ) : null}
          <Meta label="Fee Period" value={receipt.period} compact={compact} />
          <Meta label="Invoice No" value={receipt.invoiceNo} compact={compact} />
          <Meta label="Payment Date" value={formatPaidAt(receipt.paidAt)} compact={compact} />
          <Meta label="Payment Method" value={receipt.method} compact={compact} />
          {receipt.cashBankAccountName ? (
            <Meta
              label={receipt.method === "Cash" ? "Cash Account" : "Bank Account"}
              value={
                receipt.cashBankAccountNumber
                  ? `${receipt.cashBankAccountName} (${receipt.cashBankAccountNumber})`
                  : receipt.cashBankAccountName
              }
              compact={compact}
            />
          ) : null}
          {receipt.reference ? <Meta label="Reference / Txn" value={receipt.reference} compact={compact} /> : null}
          {receipt.voucherNo ? <Meta label="Receipt Voucher" value={receipt.voucherNo} compact={compact} /> : null}
          <Meta label="Received By" value={receipt.cashierName || "—"} compact={compact} />
        </div>

        {/* Fee lines */}
        <div>
          <p
            className={`mb-1 font-semibold uppercase tracking-wide text-neutral-600 ${
              compact ? "text-[8px]" : "text-[10px]"
            }`}
          >
            Fee particulars
          </p>
          <table className={`w-full border-collapse ${compact ? "text-[9px]" : "text-[12px]"}`}>
            <thead>
              <tr style={{ background: `${accent}12` }}>
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Particular</th>
                {!compact ? (
                  <th className="border border-neutral-300 px-2 py-1.5 text-left font-semibold">Frequency</th>
                ) : null}
                <th className="border border-neutral-300 px-2 py-1.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={`${line.particular}-${i}`} className={i % 2 ? "bg-neutral-50" : ""}>
                  <td className="border border-neutral-300 px-2 py-1.5">{line.particular}</td>
                  {!compact ? (
                    <td className="border border-neutral-300 px-2 py-1.5 text-neutral-600">{line.frequency || "—"}</td>
                  ) : null}
                  <td className="border border-neutral-300 px-2 py-1.5 text-right tabular-nums">{rs(line.amount)}</td>
                </tr>
              ))}
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={compact ? 2 : 3}
                    className="border border-neutral-300 px-2 py-3 text-center text-neutral-500"
                  >
                    Fee charges for {receipt.period}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div
          className={`ml-auto w-full rounded-md border border-neutral-300 bg-neutral-50 p-2.5 ${
            isThermal ? "" : "max-w-[280px]"
          } ${compact ? "text-[9px] p-1.5" : "text-[12px]"}`}
        >
          <Row label="Gross Amount" value={rs(receipt.grossAmount)} />
          <Row label="Discount" value={receipt.discount ? `− ${rs(receipt.discount)}` : "—"} />
          <Row label="Total Payable" value={rs(netPayable)} />
          <Row label="Previous Balance" value={rs(receipt.previousBalance)} />
          <div
            className="mt-1 flex justify-between border-t border-neutral-400 pt-1.5 font-extrabold"
            style={{ color: accent }}
          >
            <span>Amount Paid</span>
            <span className="tabular-nums">{rs(receipt.amount)}</span>
          </div>
          <div className="mt-0.5 flex justify-between font-bold text-neutral-800">
            <span>Remaining Balance</span>
            <span className="tabular-nums">{rs(receipt.remainingBalance)}</span>
          </div>
        </div>

        {!isThermal ? (
          <div className="grid grid-cols-2 gap-6 pt-4 text-center text-[11px] text-neutral-700">
            <div className="pt-10">
              <div className="mx-auto mb-1 w-4/5 border-t border-neutral-500" />
              <p className="font-semibold">Cashier / Collector</p>
              {receipt.cashierName ? <p className="text-neutral-500">{receipt.cashierName}</p> : null}
            </div>
            <div className="pt-10">
              <div className="mx-auto mb-1 w-4/5 border-t border-neutral-500" />
              <p className="font-semibold">Authorized Signatory</p>
              {school.principal ? <p className="text-neutral-500">{school.principal}</p> : null}
            </div>
          </div>
        ) : (
          <p className={`text-center text-neutral-600 ${compact ? "text-[8px]" : "text-[10px]"}`}>
            Collected by: {receipt.cashierName || "—"}
          </p>
        )}

        <p
          className={`border-t border-dashed border-neutral-300 pt-2 text-center text-neutral-500 ${
            compact ? "text-[8px]" : "text-[10px]"
          }`}
        >
          This is a computer-generated payment receipt · {receipt.receiptNo}
          {receipt.duplicate ? " · DUPLICATE COPY" : ""} · Please retain for your records.
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div>
      <p className={`font-medium uppercase tracking-wide text-neutral-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>
        {label}
      </p>
      <p className="font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-neutral-600">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
