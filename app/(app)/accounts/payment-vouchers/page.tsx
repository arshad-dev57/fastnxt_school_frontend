"use client";

import { Banknote } from "lucide-react";
import { VoucherPage } from "@/components/voucher-page";
import { PAYMENT_VOUCHERS } from "@/lib/accounting-mock-data";

export default function PaymentVouchersPage() {
  return (
    <VoucherPage
      title="Payment Vouchers"
      subtitle="Track money paid by the school."
      Icon={Banknote}
      nameLabel="Voucher #"
      partyLabel="Paid To"
      accountLabel="Expense Account"
      prefix="PV"
      seed={PAYMENT_VOUCHERS}
      accounts={["Salaries", "Rent", "Utilities", "Stationery", "Maintenance", "Transport"]}
      emptyMessage="Adjust your filters or create a new payment."
    />
  );
}
