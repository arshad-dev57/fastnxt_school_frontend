"use client";

import { Banknote } from "lucide-react";
import { VoucherPage } from "@/components/voucher-page";

export default function PaymentVouchersPage() {
  return (
    <VoucherPage
      title="Payment Vouchers"
      subtitle="Track and post money paid by the school."
      Icon={Banknote}
      nameLabel="Voucher #"
      partyLabel="Paid To"
      accountLabel="Expense Account"
      prefix="PV"
      kind="Payment"
      emptyMessage="Adjust your filters or create a new payment voucher."
    />
  );
}
