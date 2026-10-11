"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, ArrowLeftRight, Plus, Check } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, rs } from "@/components/ui";
import { RC, ReportTable, RRow, RTotal, money } from "@/components/report";
import { StatusPill } from "@/components/board-kit";
import { accountsApi, type BankTransactionItem, type CashBankAccountItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function BankReconciliationPage() {
  const { currentBranchId } = useBranch();
  const [bankAccounts, setBankAccounts] = useState<CashBankAccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [statementBalance, setStatementBalance] = useState("0");
  const [bookBalance, setBookBalance] = useState(0);
  const [difference, setDifference] = useState(0);
  const [txns, setTxns] = useState<BankTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add line modal
  const [modalOpen, setModalOpen] = useState(false);
  const [lineDate, setLineDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineRef, setLineRef] = useState("");
  const [lineDesc, setLineDesc] = useState("");
  const [lineBook, setLineBook] = useState("0");
  const [lineBank, setLineBank] = useState("0");
  const [modalSaving, setModalSaving] = useState(false);

  const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

  // 1. Fetch available bank accounts
  useEffect(() => {
    accountsApi
      .listBankAccounts({ branchId: branchScope })
      .then((res) => {
        const banks = (res.accounts || []).filter((a) => a.kind === "Bank");
        setBankAccounts(banks);
        if (banks.length > 0) {
          setSelectedAccountId((prev) => (banks.some((b) => b.id === prev) ? prev : banks[0].id));
        } else {
          setSelectedAccountId("");
        }
      })
      .catch((e) => setError(e?.message || "Failed to load bank accounts."));
  }, [currentBranchId]);

  // 2. Fetch reconciliation summary for selected bank account
  const fetchSummary = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await accountsApi.getReconciliationSummary({
        bankAccountId: selectedAccountId,
        branchId: branchScope,
      });
      setBookBalance(res.bookBalance || 0);
      setStatementBalance(String(res.statementBalance || res.bookBalance || 0));
      setDifference(res.difference || 0);
      setTxns(res.txns || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load reconciliation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchSummary();
    }
  }, [selectedAccountId, currentBranchId]);

  const toggleStatus = async (txn: BankTransactionItem) => {
    setBusy(true);
    try {
      const nextStatus = txn.status === "Matched" ? "Unmatched" : "Matched";
      await accountsApi.updateBankTransactionStatus(txn.id, nextStatus);
      await fetchSummary();
    } catch (e: any) {
      alert(e?.message || "Failed to update match status.");
    } finally {
      setBusy(false);
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await accountsApi.markAllMatched(selectedAccountId);
      await fetchSummary();
    } catch (e: any) {
      alert(e?.message || "Failed to mark all matched.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLine = async () => {
    if (!lineDesc.trim()) {
      alert("Description is required.");
      return;
    }
    setModalSaving(true);
    try {
      await accountsApi.createBankTransaction({
        bankAccountId: selectedAccountId,
        date: lineDate,
        reference: lineRef.trim(),
        description: lineDesc.trim(),
        book: Number(lineBook) || 0,
        bank: Number(lineBank) || 0,
        status: "Unmatched",
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      setModalOpen(false);
      setLineDesc("");
      setLineRef("");
      setLineBook("0");
      setLineBank("0");
      await fetchSummary();
    } catch (e: any) {
      alert(e?.message || "Failed to add statement line.");
    } finally {
      setModalSaving(false);
    }
  };

  const unmatched = txns.filter((t) => t.status === "Unmatched").length;
  const currentDiff = (Number(statementBalance) || 0) - bookBalance;

  return (
    <>
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Match double-entry ledger transactions against bank statements."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!selectedAccountId}
            className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
          >
            <Plus className="ic-plus h-[18px] w-[18px]" />
            <span>Add Statement Line</span>
          </button>
        }
      />

      <div className="space-y-5 px-4 pb-24 sm:px-6">
        {error && (
          <div className="rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        <Card pad={false}>
          <CardHead
            title="Reconciliation Controls"
            subtitle="Select the bank account and review balance matching"
            Icon={ArrowLeftRight}
          />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Bank Account">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.number || "No IBAN"})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Statement Balance (Bank)">
              <Input
                type="number"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
              />
            </Field>

            <Field label="Book Balance (Ledger)">
              <Input type="text" readOnly value={rs(bookBalance)} className="bg-[var(--theme-hover)] font-semibold" />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--theme-border)] p-4">
            <div className="flex items-center gap-3">
              <Btn
                variant="primary"
                Icon={RefreshCw}
                onClick={fetchSummary}
                loading={loading || busy}
                loadingLabel="Recomputing…"
              >
                Refresh
              </Btn>
              <Btn
                variant="secondary"
                Icon={CheckCircle2}
                onClick={markAll}
                loading={busy}
                disabled={unmatched === 0}
              >
                Mark All as Matched
              </Btn>
            </div>

            <div className="text-[13px] text-[var(--theme-text-muted)]">
              Variance:{" "}
              <span
                className={
                  currentDiff === 0
                    ? "font-semibold text-[var(--theme-success-text)]"
                    : "font-semibold text-[var(--theme-danger-text)]"
                }
              >
                {rs(currentDiff)}
              </span>
              {" · "}
              <span className="font-medium text-[var(--theme-text)]">{unmatched}</span> unmatched
            </div>
          </div>
        </Card>

        <Card pad={false}>
          <CardHead
            title="Transactions Matching"
            subtitle="Click match on lines cleared by bank statement"
            Icon={ArrowLeftRight}
            right={
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline"
              >
                + Add Line
              </button>
            }
          />

          {loading ? (
            <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
              Loading transactions…
            </div>
          ) : txns.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
              No transactions recorded for this bank account yet. Click &ldquo;+ Add Line&rdquo; to add statement transactions.
            </div>
          ) : (
            <ReportTable
              columns={[
                { label: "Date" },
                { label: "Reference" },
                { label: "Description" },
                { label: "Book Amount", align: "right" },
                { label: "Bank Amount", align: "right" },
                { label: "Status" },
                { label: "Action", align: "right" },
              ]}
            >
              {txns.map((t) => (
                <RRow key={t.id}>
                  <RC muted>{t.date}</RC>
                  <RC muted className="font-mono text-[12px]">{t.reference || "—"}</RC>
                  <RC className="font-medium">{t.description}</RC>
                  <RC align="right" className="tabular-nums">{t.book ? money(t.book) : "—"}</RC>
                  <RC align="right" className="tabular-nums">{t.bank ? money(t.bank) : "—"}</RC>
                  <RC><StatusPill label={t.status} /></RC>
                  <RC align="right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(t)}
                      disabled={busy}
                      className={`inline-flex h-7 items-center gap-1 rounded border px-2 text-[12px] font-medium transition-colors ${
                        t.status === "Matched"
                          ? "border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
                          : "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      {t.status === "Matched" ? "Unmatch" : "Match"}
                    </button>
                  </RC>
                </RRow>
              ))}
              <RTotal>
                <RC>—</RC>
                <RC>—</RC>
                <RC>Total</RC>
                <RC align="right" className="tabular-nums">{money(txns.reduce((s, t) => s + t.book, 0))}</RC>
                <RC align="right" className="tabular-nums">{money(txns.reduce((s, t) => s + t.bank, 0))}</RC>
                <RC colSpan={2}>—</RC>
              </RTotal>
            </ReportTable>
          )}
        </Card>
      </div>

      {/* Add Statement Line Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Bank Statement Line"
        subtitle="Record an entry directly from the physical or online bank statement."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModalOpen(false)} disabled={modalSaving}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleCreateLine} loading={modalSaving} loadingLabel="Saving…">
              Save Line
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Date">
            <Input type="date" value={lineDate} onChange={(e) => setLineDate(e.target.value)} />
          </Field>
          <Field label="Reference">
            <Input value={lineRef} onChange={(e) => setLineRef(e.target.value)} placeholder="e.g. CHQ-9912 or BNK-FEE" />
          </Field>
          <Field label="Description">
            <Input
              value={lineDesc}
              onChange={(e) => setLineDesc(e.target.value)}
              placeholder="e.g. Bank service charges, interest, or uncleared deposit"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Book Amount (Rs)">
              <Input type="number" value={lineBook} onChange={(e) => setLineBook(e.target.value)} />
            </Field>
            <Field label="Bank Amount (Rs)">
              <Input type="number" value={lineBank} onChange={(e) => setLineBank(e.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
