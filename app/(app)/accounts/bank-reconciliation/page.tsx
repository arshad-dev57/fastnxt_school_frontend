import { redirect } from "next/navigation";

/** Bank Reconciliation removed — redirect bookmarks to Cash & Bank. */
export default function BankReconciliationRemovedPage() {
  redirect("/accounts/cash-bank");
}
