"use client";

import { useEffect, useState } from "react";
import { Save, Landmark, CreditCard, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { Badge, Btn, Card, CardHead, Field, Input, Textarea, Th, Td, cn, rs } from "./ui";
import { accountsApi, type VoucherItem, type AccountItem } from "@/lib/auth/api-client";

const COLS = "grid-cols-[110px_minmax(150px,1fr)_120px_130px_110px]";
const PAYMENT_METHODS = ["Cash", "Bank", "Cheque", "Online"];

export default function TxnForm({ kind }: { kind: "income" | "expense" }) {
  const isIncome = kind === "income";

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<VoucherItem[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const fetchAccountsAndEntries = async () => {
    try {
      const type = isIncome ? "Income" : "Expense";
      const [accRes, vchRes] = await Promise.all([
        accountsApi.listAccounts({ type }),
        accountsApi.listVouchers({ kind: isIncome ? "Receipt" : "Payment" }),
      ]);

      const accs = accRes.accounts || [];
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }

      setEntries(vchRes.vouchers || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load data.");
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndEntries();
  }, [kind]);

  const valid = amount !== "" && Number(amount) > 0 && description.trim() !== "" && Boolean(selectedAccountId);
  const total = entries.reduce((a, t) => a + (t.amount || 0), 0);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await accountsApi.createVoucher({
        kind: isIncome ? "Receipt" : "Payment",
        party: description.trim(),
        accountId: selectedAccountId,
        amount: Number(amount),
        method,
        reference: `${isIncome ? "RCP" : "VCH"}-${String(Date.now()).slice(-4)}`,
        date,
        status: "Posted",
      });

      setSaved(true);
      setAmount("");
      setDescription("");
      await fetchAccountsAndEntries();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message || "Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-3">
        {error && (
          <div className="col-span-full rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        {saved && (
          <div className="col-span-full rounded-lg border border-[var(--theme-success)] bg-[var(--theme-success-soft)] p-3 text-[14px] text-[var(--theme-success-text)]">
            {isIncome ? "Income recorded and posted to ledger successfully!" : "Expense recorded and posted to ledger successfully!"}
          </div>
        )}

        <Card pad={false} className="lg:col-span-1">
          <CardHead
            title={isIncome ? "Add Income" : "Add Expense"}
            subtitle={isIncome ? "Record a new income entry" : "Record a new expense entry"}
            Icon={isIncome ? Landmark : CreditCard}
          />
          <div className="space-y-4 p-4">
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field label={isIncome ? "Income Account" : "Expense Account"}>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]"
              >
                {accounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Amount (Rs)">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </Field>

            <Field label="Payment Method">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isIncome
                    ? "e.g. Fee collection for Grade 5-A, Donation, etc."
                    : "e.g. Electricity bill for January, Campus Rent, etc."
                }
              />
            </Field>

            <Btn
              variant="primary"
              Icon={Save}
              className="w-full"
              disabled={!valid || saving}
              loading={saving}
              loadingLabel="Saving & Posting…"
              onClick={save}
            >
              {isIncome ? "Save & Post Income" : "Save & Post Expense"}
            </Btn>
            {!valid && (
              <p className="text-[12px] text-[var(--theme-text-faint)]">
                Enter an amount and description to save.
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isIncome
                    ? "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"
                    : "bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)]"
                )}
              >
                {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </span>
              <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">
                Total {isIncome ? "Income" : "Expenses"}
              </p>
              <p className="text-[24px] font-bold tabular-nums">{rs(total)}</p>
              <p className="text-[12px] text-[var(--theme-text-faint)]">{entries.length} entries</p>
            </Card>
            <Card>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]">
                <Receipt className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">Latest Entry</p>
              <p className="truncate text-[15px] font-semibold">{entries[0]?.party ?? "—"}</p>
              <p className="text-[12px] text-[var(--theme-text-faint)]">
                {entries[0] ? `${rs(entries[0].amount)} (${entries[0].account})` : ""}
              </p>
            </Card>
          </div>

          <Card pad={false}>
            <CardHead
              title={isIncome ? "Recent Income Entries" : "Recent Expense Entries"}
              subtitle="Posted directly to the double-entry ledger"
              Icon={isIncome ? Landmark : CreditCard}
            />
            {loadingEntries ? (
              <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
                Loading entries…
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
                No entries recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[650px]">
                  <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]")}>
                    <Th className="border-l border-[var(--theme-border)]">Date</Th>
                    <Th className="border-l border-[var(--theme-border)]">Description</Th>
                    <Th className="border-l border-[var(--theme-border)]">Account</Th>
                    <Th className="border-l border-[var(--theme-border)] text-right">Amount</Th>
                    <Th className="border-l border-[var(--theme-border)]">Method</Th>
                  </div>
                  {entries.slice(0, 10).map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "grid",
                        COLS,
                        "border-b border-[var(--theme-border)] px-3 py-2.5 text-[13px] transition-colors hover:bg-[var(--theme-hover)] last:border-b-0"
                      )}
                    >
                      <Td className="text-[var(--theme-text-muted)]">{t.date}</Td>
                      <Td className="truncate font-medium">{t.party}</Td>
                      <Td className="truncate text-[var(--theme-text-muted)]">{t.account}</Td>
                      <Td className={cn("text-right font-semibold tabular-nums", isIncome ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]")}>
                        {isIncome ? `+${rs(t.amount)}` : `-${rs(t.amount)}`}
                      </Td>
                      <Td className="text-[var(--theme-text-muted)]">{t.method}</Td>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
