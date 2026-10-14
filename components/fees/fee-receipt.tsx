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

  return (
    <div
      className={`fee-receipt-print fee-receipt-${paperSize} bg-white text-black ${
        isThermal ? "fee-receipt-thermal" : ""
      }`}
      data-paper={paperSize}
    >
      {receipt.duplicate ? (
        <div className="fee-receipt-duplicate mb-2 border-2 border-dashed border-neutral-700 px-2 py-1 text-center text-[11px] font-extrabold tracking-[0.2em] text-neutral-800">
          DUPLICATE COPY
        </div>
      ) : null}

      <div className={`flex items-start gap-2 border-b border-neutral-800 pb-2 ${compact ? "gap-1.5" : ""}`}>
        {school.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={school.logoUrl}
            alt=""
            className={`shrink-0 rounded object-contain ${compact ? "h-8 w-8" : "h-12 w-12"}`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded bg-neutral-900 font-extrabold text-white ${
              compact ? "h-8 w-8 text-[12px]" : "h-12 w-12 text-[18px]"
            }`}
          >
            {(school.shortName || school.name || "S").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className={`font-bold leading-tight ${compact ? "text-[12px]" : "text-[16px]"}`}>
            {school.name || "School"}
          </h2>
          {school.address ? (
            <p className={`text-neutral-700 ${compact ? "text-[9px]" : "text-[11px]"}`}>{school.address}</p>
          ) : null}
          <p className={`text-neutral-700 ${compact ? "text-[9px]" : "text-[11px]"}`}>
            {[school.phone, school.email, school.website].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className={`shrink-0 text-right ${compact ? "text-[9px]" : "text-[11px]"}`}>
          <p className="font-extrabold uppercase tracking-wide">Fee Receipt</p>
          <p className="mt-0.5 font-mono font-semibold">{receipt.receiptNo}</p>
        </div>
      </div>

      <div
        className={`mt-2 grid gap-x-3 gap-y-1 ${
          isThermal ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
        } ${compact ? "text-[9px]" : "text-[11px]"}`}
      >
        <Meta label="Student" value={receipt.studentName} compact={compact} />
        {receipt.admissionNo ? <Meta label="Admission No" value={receipt.admissionNo} compact={compact} /> : null}
        {receipt.studentCode ? <Meta label="Student ID" value={receipt.studentCode} compact={compact} /> : null}
        <Meta label="Class" value={`${receipt.cls}-${receipt.section}`} compact={compact} />
        {(receipt.session || school.academicSession) ? (
          <Meta label="Session" value={receipt.session || school.academicSession || ""} compact={compact} />
        ) : null}
        <Meta label="Fee Period" value={receipt.period} compact={compact} />
        <Meta label="Invoice No" value={receipt.invoiceNo} compact={compact} />
        <Meta label="Payment Date" value={formatPaidAt(receipt.paidAt)} compact={compact} />
        <Meta label="Method" value={receipt.method} compact={compact} />
        {receipt.reference ? <Meta label="Reference / Txn" value={receipt.reference} compact={compact} /> : null}
        {receipt.voucherNo ? <Meta label="RV No" value={receipt.voucherNo} compact={compact} /> : null}
        <Meta label="Cashier" value={receipt.cashierName || "—"} compact={compact} />
      </div>

      <div className={`mt-2 inline-block rounded border border-neutral-800 px-2 py-0.5 font-bold uppercase tracking-wide ${compact ? "text-[9px]" : "text-[11px]"}`}>
        {receipt.status}
      </div>

      <table className={`mt-2 w-full border-collapse ${compact ? "text-[9px]" : "text-[11px]"}`}>
        <thead>
          <tr>
            <th className="border border-neutral-400 bg-neutral-100 px-1.5 py-1 text-left">Particular</th>
            {!compact ? (
              <th className="border border-neutral-400 bg-neutral-100 px-1.5 py-1 text-left">Freq.</th>
            ) : null}
            <th className="border border-neutral-400 bg-neutral-100 px-1.5 py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={`${line.particular}-${i}`}>
              <td className="border border-neutral-300 px-1.5 py-1">{line.particular}</td>
              {!compact ? (
                <td className="border border-neutral-300 px-1.5 py-1 text-neutral-600">{line.frequency || "—"}</td>
              ) : null}
              <td className="border border-neutral-300 px-1.5 py-1 text-right">{rs(line.amount)}</td>
            </tr>
          ))}
          {lines.length === 0 ? (
            <tr>
              <td colSpan={compact ? 2 : 3} className="border border-neutral-300 px-1.5 py-2 text-center text-neutral-500">
                Fee charges for {receipt.period}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className={`ml-auto mt-2 w-full space-y-0.5 ${isThermal ? "" : "max-w-[260px]"} ${compact ? "text-[9px]" : "text-[11px]"}`}>
        <Row label="Gross Amount" value={rs(receipt.grossAmount)} />
        <Row label="Discount" value={receipt.discount ? `− ${rs(receipt.discount)}` : "—"} />
        <Row label="Total Payable" value={rs(netPayable)} />
        <Row label="Previous Balance" value={rs(receipt.previousBalance)} />
        <div className="flex justify-between border-t border-neutral-400 pt-1 font-bold">
          <span>Amount Paid</span>
          <span>{rs(receipt.amount)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Remaining Balance</span>
          <span>{rs(receipt.remainingBalance)}</span>
        </div>
      </div>

      {!isThermal ? (
        <div className="mt-6 grid grid-cols-2 gap-4 text-center text-[10px] text-neutral-700">
          <div className="pt-8">
            <div className="mx-auto mb-1 w-4/5 border-t border-neutral-400" />
            <p className="font-medium">Cashier / Collector</p>
            {receipt.cashierName ? <p className="text-neutral-500">{receipt.cashierName}</p> : null}
          </div>
          <div className="pt-8">
            <div className="mx-auto mb-1 w-4/5 border-t border-neutral-400" />
            <p className="font-medium">Authorized Signatory</p>
          </div>
        </div>
      ) : (
        <p className={`mt-3 text-center text-neutral-600 ${compact ? "text-[8px]" : "text-[10px]"}`}>
          Collected by: {receipt.cashierName || "—"}
        </p>
      )}

      <p className={`mt-3 border-t border-dashed border-neutral-300 pt-1 text-center text-neutral-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>
        Computer-generated fee receipt · {receipt.receiptNo}
        {receipt.duplicate ? " · DUPLICATE COPY" : ""}
      </p>
    </div>
  );
}

function Meta({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div>
      <p className={`uppercase tracking-wide text-neutral-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>{label}</p>
      <p className="font-medium text-neutral-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
