"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, ArrowLeftRight, FileSearch, Wallet, Plus, RefreshCw } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, StatCard, rs } from "@/components/ui";
import { accountsApi, type CashBankAccountItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function CashBankPage() {
  const { currentBranchId } = useBranch();
  const [accounts, setAccounts] = useState<CashBankAccountItem[]>([]);
  const [cash, setCash] = useState(0);
  const [bank, setBank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newKind, setNewKind] = useState<"Bank" | "Cash">("Bank");
  const [newOpening, setNewOpening] = useState("0");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getCashBankSummary({ branchId: branchScope });
      setAccounts(res.accounts || []);
      setCash(res.cash || 0);
      setBank(res.bank || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load Cash & Bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentBranchId]);

  const handleAddAccount = async () => {
    if (!newName.trim()) {
      setFormErr("Account name is required.");
      return;
    }
    setSaving(true);
    setFormErr(null);
    try {
      await accountsApi.createBankAccount({
        name: newName.trim(),
        number: newNumber.trim() || undefined,
        kind: newKind,
        openingBalance: Number(newOpening) || 0,
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      setModalOpen(false);
      setNewName("");
      setNewNumber("");
      setNewOpening("0");
      await fetchSummary();
    } catch (e: any) {
      setFormErr(e?.message || "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Cash & Bank"
        subtitle="School liquid position, cash in hand, and bank account balances."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSummary}
              className="inline-flex h-9 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Plus className="ic-plus h-[18px] w-[18px]" />
              <span>Add Account</span>
            </button>
          </div>
        }
      />

      <div className="space-y-5 px-4 pb-24 sm:px-6">
        {error && (
          <div className="rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            label="Cash Balance"
            value={rs(cash)}
            Icon={Wallet}
            tone="green"
            sub="Petty cash in hand"
          />
          <StatCard
            label="Bank Balance"
            value={rs(bank)}
            Icon={Banknote}
            tone="blue"
            sub="Across bank accounts"
          />
          <StatCard
            label="Total Liquid Funds"
            value={rs(cash + bank)}
            Icon={ArrowLeftRight}
            tone="purple"
            sub="Available cash + bank"
          />
        </div>

        <Card pad={false}>
          <CardHead
            title="Cash & Bank Accounts"
            subtitle={`${accounts.length} active liquidity accounts`}
            Icon={Wallet}
          />
          {loading ? (
            <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
              Loading accounts…
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
              No cash or bank accounts found. Click &ldquo;Add Account&rdquo; to create one.
            </div>
          ) : (
            <div className="divide-y divide-[var(--theme-border)]">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--theme-hover)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                    {a.kind === "Cash" ? <Wallet className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{a.name}</p>
                    <p className="truncate text-[12px] text-[var(--theme-text-muted)]">
                      {a.number || "—"} · Code {a.accountCode || a.accountId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[var(--theme-text-muted)]">Current Balance</p>
                    <p className="text-[16px] font-semibold tabular-nums text-[var(--theme-primary)]">
                      {rs(a.balance || 0)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/accounts/general-ledger`}
                      className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] px-2.5 text-[13px] hover:bg-[var(--theme-hover)]"
                    >
                      <FileSearch className="h-4 w-4" /> Ledger
                    </Link>
                    {a.kind === "Bank" && (
                      <Link
                        href={`/accounts/bank-reconciliation`}
                        className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] px-2.5 text-[13px] hover:bg-[var(--theme-hover)]"
                      >
                        <ArrowLeftRight className="h-4 w-4" /> Reconcile
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Bank Account Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Bank or Cash Account"
        subtitle="Create a new bank account or petty cash register."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleAddAccount} loading={saving} loadingLabel="Saving…">
              Create Account
            </Btn>
          </>
        }
      >
        {formErr && (
          <div className="mb-3 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-2.5 text-[13px] text-[var(--theme-danger-text)]">
            {formErr}
          </div>
        )}
        <div className="space-y-4">
          <Field label="Account Type">
            <Select
              options={["Bank", "Cash"]}
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "Bank" | "Cash")}
            />
          </Field>
          <Field label="Account Name">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Standard Chartered Operating Account"
            />
          </Field>
          <Field label="Account / IBAN Number">
            <Input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="e.g. PK36-SCB-0001-2233"
            />
          </Field>
          <Field label="Opening Balance (Rs)">
            <Input
              type="number"
              value={newOpening}
              onChange={(e) => setNewOpening(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
