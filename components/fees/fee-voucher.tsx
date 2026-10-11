"use client";

import { rs } from "@/components/ui";
import type {
  FeeInvoiceItem,
  FeeVoucherSchoolInfo,
  FeeVoucherTemplate,
} from "@/lib/auth/api-client";
import { DEFAULT_FEE_VOUCHER_TEMPLATE } from "@/lib/auth/api-client";

type CopyKind = "bank" | "student" | "school";

const COPY_META: { key: CopyKind; labelKey: keyof FeeVoucherTemplate }[] = [
  { key: "bank", labelKey: "copyBank" },
  { key: "student", labelKey: "copyStudent" },
  { key: "school", labelKey: "copySchool" },
];

export function FeeVoucherDocument({
  invoice,
  template,
  school,
  previewSingle,
}: {
  invoice: FeeInvoiceItem;
  template?: Partial<FeeVoucherTemplate> | null;
  school?: FeeVoucherSchoolInfo | null;
  /** Settings page live preview — show one sample copy only */
  previewSingle?: boolean;
}) {
  const t = { ...DEFAULT_FEE_VOUCHER_TEMPLATE, ...(template || {}) };
  const copies = previewSingle ? COPY_META.slice(0, 1) : COPY_META;

  return (
    <div className="fee-voucher-print space-y-4 bg-white text-black">
      {copies.map(({ key, labelKey }, idx) => (
        <div key={key}>
          <VoucherCopy
            invoice={invoice}
            template={t}
            school={school}
            copyLabel={String(t[labelKey] || key.toUpperCase())}
            copyKind={key}
          />
          {!previewSingle && idx < copies.length - 1 ? (
            <div className="my-3 border-t border-dashed border-neutral-400 text-center text-[10px] uppercase tracking-widest text-neutral-500">
              ✂ Cut here
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function VoucherCopy({
  invoice,
  template: t,
  school,
  copyLabel,
  copyKind,
}: {
  invoice: FeeInvoiceItem;
  template: FeeVoucherTemplate;
  school?: FeeVoucherSchoolInfo | null;
  copyLabel: string;
  copyKind: CopyKind;
}) {
  const accent = t.accentColor || "#1e3a8a";
  const lines = invoice.lines?.length ? invoice.lines : [];
  const net = Math.max(0, (invoice.total || 0) - (invoice.discount || 0));
  const schoolName = school?.name || "School";

  return (
    <div
      className="rounded border-2 bg-white p-3 text-[12px] leading-snug sm:p-4"
      style={{ borderColor: accent }}
    >
      <div className="mb-2 flex items-start justify-between gap-3 border-b pb-2" style={{ borderColor: accent }}>
        <div className="flex min-w-0 items-start gap-2">
          {t.showLogo ? (
            school?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logoUrl} alt="" className="h-12 w-12 rounded object-contain" />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded text-[18px] font-extrabold text-white"
                style={{ background: accent }}
              >
                {(school?.shortName || schoolName).slice(0, 1).toUpperCase()}
              </div>
            )
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-bold" style={{ color: accent }}>
              {schoolName}
            </h2>
            {t.showAddress && school?.address ? (
              <p className="text-[11px] text-neutral-600">{school.address}</p>
            ) : null}
            <p className="text-[11px] text-neutral-600">
              {[
                t.showPhone ? school?.phone : null,
                t.showEmail ? school?.email : null,
                t.showWebsite ? school?.website : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: accent }}>
            {t.title}
          </p>
          <p
            className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            {copyLabel}
          </p>
          <p className="mt-1 font-mono text-[11px] font-semibold">{invoice.invoiceNo}</p>
        </div>
      </div>

      {t.headerNote ? (
        <p className="mb-2 rounded bg-neutral-50 px-2 py-1 text-[11px] text-neutral-700">{t.headerNote}</p>
      ) : null}

      <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
        <Meta label="Student" value={invoice.student} />
        <Meta label="Class" value={`${invoice.cls}-${invoice.section}`} />
        <Meta label="Period" value={invoice.period} />
        <Meta label="Status" value={invoice.status} />
        <Meta label="Issue" value={invoice.issue} />
        <Meta label="Due" value={invoice.due} />
        {invoice.studentCode ? <Meta label="Student ID" value={invoice.studentCode} /> : null}
      </div>

      {(t.bankName || t.bankAccountNo || t.bankAccountTitle || t.bankBranch) && (
        <div className="mb-2 rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-[11px]">
          <p className="mb-0.5 font-semibold" style={{ color: accent }}>
            Bank Deposit Details
          </p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {t.bankName ? <Meta label="Bank" value={t.bankName} /> : null}
            {t.bankAccountTitle ? <Meta label="A/C Title" value={t.bankAccountTitle} /> : null}
            {t.bankAccountNo ? <Meta label="A/C No" value={t.bankAccountNo} /> : null}
            {t.bankBranch ? <Meta label="Branch" value={t.bankBranch} /> : null}
          </div>
        </div>
      )}

      <table className="mb-2 w-full border-collapse text-[11px]">
        <thead>
          <tr style={{ background: `${accent}14` }}>
            <th className="border border-neutral-300 px-2 py-1 text-left">Particular</th>
            <th className="border border-neutral-300 px-2 py-1 text-left">Frequency</th>
            <th className="border border-neutral-300 px-2 py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={`${line.particular}-${i}`}>
              <td className="border border-neutral-300 px-2 py-1">{line.particular}</td>
              <td className="border border-neutral-300 px-2 py-1 text-neutral-600">{line.frequency || "—"}</td>
              <td className="border border-neutral-300 px-2 py-1 text-right">{rs(line.amount)}</td>
            </tr>
          ))}
          {lines.length === 0 ? (
            <tr>
              <td colSpan={3} className="border border-neutral-300 px-2 py-2 text-center text-neutral-500">
                Fee charges for {invoice.period}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="mb-2 ml-auto w-full max-w-[240px] space-y-0.5 text-[11px]">
        <Row label="Subtotal" value={rs(invoice.total)} />
        {t.showDiscount ? (
          <Row
            label={invoice.discountName ? `Discount (${invoice.discountName})` : "Discount"}
            value={invoice.discount ? `− ${rs(invoice.discount)}` : "—"}
          />
        ) : null}
        <div className="flex justify-between border-t border-neutral-300 pt-1 text-[12px] font-bold">
          <span>Payable</span>
          <span>{rs(net)}</span>
        </div>
        {t.showPaidBalance ? (
          <>
            <Row label="Paid" value={rs(invoice.paid)} />
            <div className="flex justify-between font-bold">
              <span>Balance</span>
              <span>{rs(invoice.balance)}</span>
            </div>
          </>
        ) : null}
      </div>

      {t.instructions ? (
        <p className="mb-2 text-[10px] text-neutral-600">
          <span className="font-semibold">Note:</span> {t.instructions}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[10px] text-neutral-700">
        {[t.signatureLeft, t.signatureCenter, t.signatureRight].map((label) => (
          <div key={label} className="pt-6">
            <div className="mx-auto mb-1 w-4/5 border-t border-neutral-400" />
            <p className="font-medium">{label}</p>
          </div>
        ))}
      </div>

      {t.footerNote ? (
        <p className="mt-2 border-t border-dashed border-neutral-300 pt-1 text-center text-[10px] text-neutral-500">
          {t.footerNote}
          {copyKind === "bank" ? " · For bank use only" : ""}
        </p>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</p>
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

/** Sample invoice used on the settings editor preview. */
export function sampleFeeInvoice(): FeeInvoiceItem {
  return {
    id: "preview",
    invoiceNo: "INV-2026-0001",
    student: "Sample Student",
    studentCode: "STD-1001",
    cls: "Grade 10",
    section: "A",
    period: "Oct 2026",
    issue: "2026-10-01",
    due: "2026-10-10",
    total: 12000,
    discount: 500,
    paid: 0,
    balance: 11500,
    status: "Pending",
    discountName: "Sibling",
    lines: [
      { particular: "Tuition Fee", amount: 8000, frequency: "Monthly" },
      { particular: "Transport Fee", amount: 2000, frequency: "Monthly" },
      { particular: "Computer Fee", amount: 2000, frequency: "Monthly" },
    ],
  };
}
