"use client";

import { PageHeader } from "@/components/ui";
import TxnForm from "@/components/txn-form";

export default function AddExpensePage() {
  return (
    <>
      <PageHeader title="Add Expense" subtitle="Record an expense paid by the institution." />
      <TxnForm kind="expense" />
    </>
  );
}
