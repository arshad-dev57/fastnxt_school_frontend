"use client";

import { useState } from "react";
import { Printer, Copy, X } from "lucide-react";
import { Btn, Modal, Select } from "@/components/ui";
import { FeeReceiptDocument } from "@/components/fees/fee-receipt";
import {
  describeApiError,
  feesApi,
  type FeePaymentItem,
  type FeePaymentPaperSize,
} from "@/lib/auth/api-client";

const PAPER_OPTIONS: FeePaymentPaperSize[] = ["A4", "80mm", "58mm"];

const PAGE_CSS: Record<FeePaymentPaperSize, string> = {
  A4: "@page { size: A4 portrait; margin: 12mm; }",
  "80mm": "@page { size: 80mm auto; margin: 2mm; }",
  "58mm": "@page { size: 58mm auto; margin: 1.5mm; }",
};

export function printFeeReceipt(paperSize: FeePaymentPaperSize = "A4") {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const styleId = "fee-receipt-page-style";
  document.getElementById(styleId)?.remove();
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = PAGE_CSS[paperSize] || PAGE_CSS.A4;
  document.head.appendChild(style);

  const cls = `printing-fee-receipt-${paperSize}`;
  document.body.classList.add(cls);

  const cleanup = () => {
    document.body.classList.remove(cls);
    document.getElementById(styleId)?.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  setTimeout(cleanup, 2500);
}

export function FeeReceiptPreviewModal({
  open,
  receipt,
  onClose,
  title = "Fee Receipt",
}: {
  open: boolean;
  receipt: FeePaymentItem | null;
  onClose: () => void;
  title?: string;
}) {
  const [paperSize, setPaperSize] = useState<FeePaymentPaperSize>("A4");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Overlay version after Duplicate Copy / Show Original — null means use `receipt` prop. */
  const [override, setOverride] = useState<FeePaymentItem | null>(null);

  const current = open ? (override?.id === receipt?.id ? override : receipt) : null;

  const handleClose = () => {
    setOverride(null);
    setError(null);
    setBusy(false);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!current?.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await feesApi.reprintReceipt(current.id);
      setOverride(res.receipt);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleOriginal = async () => {
    if (!current?.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await feesApi.getReceipt(current.id, { duplicate: false });
      setOverride(res.receipt);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={current ? `${current.receiptNo} · ${current.studentName}` : undefined}
      width="max-w-3xl"
      footer={
        <>
          <div className="mr-auto flex items-center gap-2">
            <span className="text-[12px] text-[var(--theme-text-muted)]">Paper</span>
            <Select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as FeePaymentPaperSize)}
              options={PAPER_OPTIONS}
              className="w-28"
            />
          </div>
          <Btn variant="secondary" Icon={X} onClick={handleClose}>Close</Btn>
          {current?.duplicate ? (
            <Btn variant="secondary" disabled={busy} onClick={handleOriginal}>Show Original</Btn>
          ) : (
            <Btn variant="secondary" Icon={Copy} loading={busy} onClick={handleDuplicate}>
              Duplicate Copy
            </Btn>
          )}
          <Btn variant="primary" Icon={Printer} onClick={() => printFeeReceipt(paperSize)} disabled={!current}>
            Print / PDF
          </Btn>
        </>
      }
    >
      {error ? <p className="mb-2 text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
      {current ? (
        <FeeReceiptDocument receipt={current} paperSize={paperSize} />
      ) : (
        <p className="py-8 text-center text-[13px] text-[var(--theme-text-muted)]">No receipt selected.</p>
      )}
    </Modal>
  );
}
