"use client";

import { useRef, useState } from "react";
import { Printer, Copy, X } from "lucide-react";
import { Btn, Modal, Select } from "@/components/ui";
import { FeeReceiptDocument } from "@/components/fees/fee-receipt";
import { printHtml } from "@/lib/print-element";
import { buildFeeReceiptPrintHtml } from "@/lib/fee-receipt-print";
import {
  describeApiError,
  feesApi,
  type FeePaymentItem,
  type FeePaymentPaperSize,
} from "@/lib/auth/api-client";

const PAPER_OPTIONS: FeePaymentPaperSize[] = ["A4", "80mm", "58mm"];
const PAPER_PREF_KEY = "bisons.feeReceipt.paperSize";

function readPaperPref(): FeePaymentPaperSize {
  if (typeof window === "undefined") return "A4";
  const v = window.localStorage.getItem(PAPER_PREF_KEY);
  if (v === "A4" || v === "80mm" || v === "58mm") return v;
  return "A4";
}

/** Print a professional self-contained receipt (no style cloning). */
export function printFeeReceipt(receipt: FeePaymentItem, paperSize: FeePaymentPaperSize = "A4") {
  const html = buildFeeReceiptPrintHtml(receipt, paperSize);
  printHtml(html);
}

export function FeeReceiptPreviewModal({
  open,
  receipt,
  onClose,
  title = "Fee Receipt",
  allowDuplicate = true,
}: {
  open: boolean;
  receipt: FeePaymentItem | null;
  onClose: () => void;
  title?: string;
  allowDuplicate?: boolean;
}) {
  const [paperSize, setPaperSize] = useState<FeePaymentPaperSize>(() => readPaperPref());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [override, setOverride] = useState<FeePaymentItem | null>(null);
  const wasOpen = useRef(false);

  if (open && !wasOpen.current) {
    wasOpen.current = true;
    const pref = readPaperPref();
    if (pref !== paperSize) setPaperSize(pref);
  } else if (!open && wasOpen.current) {
    wasOpen.current = false;
  }

  const current = open ? (override?.id === receipt?.id ? override : receipt) : null;

  const handleClose = () => {
    setOverride(null);
    setError(null);
    setBusy(false);
    onClose();
  };

  const onPaperChange = (next: FeePaymentPaperSize) => {
    setPaperSize(next);
    try {
      window.localStorage.setItem(PAPER_PREF_KEY, next);
    } catch {
      /* ignore */
    }
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
              onChange={(e) => onPaperChange(e.target.value as FeePaymentPaperSize)}
              options={PAPER_OPTIONS}
              className="w-28"
            />
          </div>
          <Btn variant="secondary" Icon={X} onClick={handleClose}>Close</Btn>
          {allowDuplicate ? (
            current?.duplicate ? (
              <Btn variant="secondary" disabled={busy} onClick={handleOriginal}>Show Original</Btn>
            ) : (
              <Btn variant="secondary" Icon={Copy} loading={busy} onClick={handleDuplicate}>
                Duplicate Copy
              </Btn>
            )
          ) : null}
          <Btn
            variant="primary"
            Icon={Printer}
            onClick={() => current && printFeeReceipt(current, paperSize)}
            disabled={!current}
          >
            Print / PDF
          </Btn>
        </>
      }
    >
      {error ? <p className="mb-2 text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
      {current ? (
        <div className="mx-auto max-w-[640px]">
          <FeeReceiptDocument receipt={current} paperSize={paperSize} />
        </div>
      ) : (
        <p className="py-8 text-center text-[13px] text-[var(--theme-text-muted)]">No receipt selected.</p>
      )}
    </Modal>
  );
}
