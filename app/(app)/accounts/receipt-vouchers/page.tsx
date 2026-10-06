"use client";

import { ReceiptText } from "lucide-react";
import { VoucherPage } from "@/components/voucher-page";
import { RECEIPT_VOUCHERS } from "@/lib/accounting-mock-data";

export default function ReceiptVouchersPage() {
  return (
    <VoucherPage
      title="Receipt Vouchers"
      subtitle="Track money received by the school."
      Icon={ReceiptText}
      nameLabel="Receipt #"
      partyLabel="Received From"
      accountLabel="Account"
      prefix="RV"
      seed={RECEIPT_VOUCHERS}
      accounts={["Tuition Fees", "Admission Fees", "Transport Fees", "Other Income"]}
      emptyMessage="Adjust your filters or create a new receipt."
    />
  );
}
