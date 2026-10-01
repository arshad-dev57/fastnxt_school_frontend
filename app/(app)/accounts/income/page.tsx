"use client";

import { PageHeader } from "@/components/ui";
import TxnForm from "@/components/txn-form";

export default function AddIncomePage() {
  return (
    <>
      <PageHeader title="Add Income" subtitle="Record income received by the institution." />
      <TxnForm kind="income" />
    </>
  );
}
