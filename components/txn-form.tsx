"use client";

import { useState } from "react";
import { Save, Landmark, CreditCard, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { Badge, Btn, Card, CardHead, Field, Input, Modal, Textarea, Th, Td, cn, rs } from "./ui";
import { SuccessIcon } from "./icons";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, TRANSACTIONS } from "@/lib/mock-data";

const COLS = "grid-cols-[110px_minmax(150px,1fr)_110px_130px_110px]";

export default function TxnForm({ kind }: { kind: "income" | "expense" }) {
  const isIncome = kind === "income";
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState(
    TRANSACTIONS.filter((t) => (isIncome ? t.income > 0 : t.expense > 0)).slice(0, 6)
  );

  const valid = amount !== "" && Number(amount) > 0 && description.trim() !== "";
  const total = entries.reduce((a, t) => a + (isIncome ? t.income : t.expense), 0);

  const save = () => {
    if (!valid) return;
    setEntries((p) => [{
      id: `TX-${Date.now()}`, date, ref: `${isIncome ? "RCP" : "VCH"}-${String(Date.now()).slice(-4)}`,
      description, income: isIncome ? Number(amount) : 0, expense: isIncome ? 0 : Number(amount),
      balance: 0, method, category,
    }, ...p]);
    setSaved(true);
    setAmount(""); setDescription("");
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-3">
        <Card pad={false} className="lg:col-span-1">
          <CardHead title={isIncome ? "Add Income" : "Add Expense"}
            subtitle={isIncome ? "Record a new income entry" : "Record a new expense entry"}
            Icon={isIncome ? Landmark : CreditCard} />
          <div className="space-y-4 p-4">
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label={isIncome ? "Income Category" : "Expense Category"}>
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Field>
            <Field label="Amount (Rs)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
            <Field label="Payment Method">
              <div className="relative">
                <select value={method} onChange={(e) => setMethod(e.target.value)}
                  className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Field>
            <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isIncome ? "e.g. Fee collection for Grade 5-A" : "e.g. Electricity bill for January"} /></Field>
            <Btn variant="primary" Icon={Save} className="w-full" disabled={!valid} onClick={save}>
              {isIncome ? "Save Income" : "Save Expense"}
            </Btn>
            {!valid && <p className="text-[12px] text-[var(--theme-text-faint)]">Enter an amount and description to save.</p>}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", isIncome ? "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]" : "bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)]")}>
                {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </span>
              <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">Total {isIncome ? "Income" : "Expenses"} (shown)</p>
              <p className="text-[24px] font-bold">{rs(total)}</p>
              <p className="text-[12px] text-[var(--theme-text-faint)]">{entries.length} entries</p>
            </Card>
            <Card>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]"><Receipt className="h-5 w-5" /></span>
              <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">Latest entry</p>
              <p className="truncate text-[15px] font-semibold">{entries[0]?.description ?? "—"}</p>
              <p className="text-[12px] text-[var(--theme-text-faint)]">{entries[0] ? rs(entries[0].income || entries[0].expense) : ""}</p>
            </Card>
          </div>

          <Card pad={false}>
            <CardHead title={isIncome ? "Recent income entries" : "Recent expense entries"} Icon={isIncome ? Landmark : CreditCard} />
            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[700px]">
                <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                  <Th className="border-l border-[var(--theme-border)]">Date</Th>
                  <Th className="border-l border-[var(--theme-border)]">Description</Th>
                  <Th className="border-l border-[var(--theme-border)]">Category</Th>
                  <Th className="border-l border-[var(--theme-border)]">Method</Th>
                  <Th className="border-l border-[var(--theme-border)]">Amount</Th>
                </div>
                {entries.map((t) => (
                  <div key={t.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{t.date}</Td>
                    <Td className="border-l border-[var(--theme-border)]"><span className="truncate">{t.description}</span></Td>
                    <Td className="border-l border-[var(--theme-border)]"><Badge label={t.category} tone="blue" /></Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{t.method}</Td>
                    <Td className={cn("border-l border-[var(--theme-border)] font-semibold", isIncome ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]")}>{rs(isIncome ? t.income : t.expense)}</Td>
                  </div>
                ))}
              </div>
            </div>
            <div className="divide-y divide-[var(--theme-border)] md:hidden">
              {entries.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{t.description}</p>
                    <p className="text-[12px] text-[var(--theme-text-muted)]">{t.date} · {t.category}</p>
                  </div>
                  <span className={cn("text-[14px] font-semibold", isIncome ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]")}>{rs(isIncome ? t.income : t.expense)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title={isIncome ? "Income recorded" : "Expense recorded"} width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><SuccessIcon className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">The {kind} entry has been saved successfully.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">It now appears in the account statement.</p>
        </div>
      </Modal>
    </>
  );
}
