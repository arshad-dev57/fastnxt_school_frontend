import type { FeeInvoiceItem, FeeVoucherTemplate } from "@/lib/auth/api-client";

/** Build plain-text payment details encoded in the fee-voucher QR. */
export function buildFeePaymentQrPayload(opts: {
  schoolName: string;
  invoice: Pick<
    FeeInvoiceItem,
    "invoiceNo" | "student" | "studentCode" | "admissionNo" | "cls" | "section" | "period" | "due" | "total" | "discount" | "balance" | "paid"
  >;
  template: Pick<
    FeeVoucherTemplate,
    "bankName" | "bankAccountTitle" | "bankAccountNo" | "bankBranch" | "paymentMobile" | "paymentLink"
  >;
}): string {
  const net = Math.max(0, (opts.invoice.total || 0) - (opts.invoice.discount || 0));
  const balance = opts.invoice.balance ?? net - (opts.invoice.paid || 0);
  const lines = [
    `School: ${opts.schoolName}`,
    `Invoice: ${opts.invoice.invoiceNo}`,
    `Student: ${opts.invoice.student}`,
    opts.invoice.studentCode ? `Student ID: ${opts.invoice.studentCode}` : "",
    opts.invoice.admissionNo ? `Admission No: ${opts.invoice.admissionNo}` : "",
    `Class: ${opts.invoice.cls}-${opts.invoice.section}`,
    `Period: ${opts.invoice.period}`,
    opts.invoice.due ? `Due: ${opts.invoice.due}` : "",
    `Amount Payable: Rs ${Math.round(balance || net)}`,
    opts.template.bankName ? `Bank: ${opts.template.bankName}` : "",
    opts.template.bankAccountTitle ? `Account Title: ${opts.template.bankAccountTitle}` : "",
    opts.template.bankAccountNo ? `Account No: ${opts.template.bankAccountNo}` : "",
    opts.template.bankBranch ? `Branch: ${opts.template.bankBranch}` : "",
    opts.template.paymentMobile ? `JazzCash / EasyPaisa: ${opts.template.paymentMobile}` : "",
    opts.template.paymentLink ? `Pay link: ${opts.template.paymentLink}` : "",
    "Scan to view school fee payment details.",
  ];
  return lines.filter(Boolean).join("\n");
}
