"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeeInvoiceItem, FeeVoucherTemplate } from "@/lib/auth/api-client";
import { buildFeePaymentQrPayload } from "@/lib/fee-payment-qr";

/** Invoice number barcode (Code 128-style bars via a compact SVG pattern). */
export function InvoiceBarcode({ value, accent = "#1e3a8a" }: { value: string; accent?: string }) {
  const bars = useMemo(() => encodeBarcodeBars(value || "0"), [value]);
  const width = bars.length;
  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <svg viewBox={`0 0 ${width} 40`} className="h-8 w-[140px]" role="img" aria-label={`Barcode ${value}`}>
        {bars.map((on, i) =>
          on ? <rect key={i} x={i} y={0} width={1} height={40} fill={accent} /> : null,
        )}
      </svg>
      <p className="font-mono text-[9px] font-semibold tracking-wider text-neutral-700">{value}</p>
    </div>
  );
}

/** Payment QR with school bank / mobile payment details for parents. */
export function FeePaymentQr({
  invoice,
  template,
  schoolName,
  size = 96,
}: {
  invoice: FeeInvoiceItem;
  template: FeeVoucherTemplate;
  schoolName: string;
  size?: number;
}) {
  const [src, setSrc] = useState<string>("");
  const payload = useMemo(
    () =>
      buildFeePaymentQrPayload({
        schoolName,
        invoice,
        template,
      }),
    [schoolName, invoice, template],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(payload, {
          margin: 1,
          width: size * 2,
          errorCorrectionLevel: "M",
          color: { dark: "#111111", light: "#ffffff" },
        });
        if (!cancelled) setSrc(url);
      } catch {
        if (!cancelled) setSrc("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payload, size]);

  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 text-[9px] text-neutral-500"
        style={{ width: size, height: size }}
      >
        QR
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Fee payment QR"
      width={size}
      height={size}
      className="rounded border border-neutral-200 bg-white"
      style={{ width: size, height: size }}
    />
  );
}

/** Compact binary pattern so each invoice number looks unique on print. */
function encodeBarcodeBars(text: string): number[] {
  const seed = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 7);
  const out: number[] = [1, 1, 1, 0, 1, 0, 1];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i) + ((seed + i * 31) % 13);
    for (let bit = 0; bit < 8; bit += 1) {
      out.push((code >> bit) & 1 ? 1 : 0);
      if (bit % 2 === 1) out.push(0);
    }
    out.push(0, 1, 0);
  }
  out.push(1, 0, 1, 1, 1);
  return out;
}
