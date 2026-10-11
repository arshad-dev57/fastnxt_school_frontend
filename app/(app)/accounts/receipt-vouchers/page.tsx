"use client";

import { ReceiptText } from "lucide-react";
import { VoucherPage } from "@/components/voucher-page";

export default function ReceiptVouchersPage() {
  return (
    <VoucherPage
      title="Receipt Vouchers"
      subtitle="Track and post money received by the school."
      Icon={ReceiptText}
      nameLabel="Receipt #"
      partyLabel="Received From"
      accountLabel="Account"
      prefix="RV"
      kind="Receipt"
      emptyMessage="Adjust your filters or create a new receipt voucher."
    />
  );
}
