"use client";

import { useState } from "react";
import { Save, CheckCircle2, Landmark, CreditCard, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { Badge, Btn, Card, CardHead, Field, Input, Modal, Textarea, Th, Td, cn, rs } from "./ui";
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
                  className="h-10 w-full appearance-none rounded border border-[#C5C7D0] bg-white px-3 pr-9 text-[14px] outline-none focus:border-[#2563EB]">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676879]"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Field>
            <Field label="Amount (Rs)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
            <Field label="Payment Method">
              <div className="relative">
                <select value={method} onChange={(e) => setMethod(e.target.value)}
                  className="h-10 w-full appearance-none rounded border border-[#C5C7D0] bg-white px-3 pr-9 text-[14px] outline-none focus:border-[#2563EB]">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676879]"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Field>
            <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isIncome ? "e.g. Fee collection for Grade 5-A" : "e.g. Electricity bill for January"} /></Field>
            <Btn variant="primary" Icon={Save} className="w-full" disabled={!valid} onClick={save}>
              {isIncome ? "Save Income" : "Save Expense"}
            </Btn>
            {!valid && <p className="text-[12px] text-[#9699A6]">Enter an amount and description to save.</p>}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", isIncome ? "bg-[#D6F5E3] text-[#037F4C]" : "bg-[#FDD9DF] text-[#C0233B]")}>
                {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </span>
              <p className="mt-2 text-[13px] text-[#676879]">Total {isIncome ? "Income" : "Expenses"} (shown)</p>
              <p className="text-[24px] font-bold">{rs(total)}</p>
              <p className="text-[12px] text-[#9699A6]">{entries.length} entries</p>
            </Card>
            <Card>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><Receipt className="h-5 w-5" /></span>
              <p className="mt-2 text-[13px] text-[#676879]">Latest entry</p>
              <p className="truncate text-[15px] font-semibold">{entries[0]?.description ?? "—"}</p>
              <p className="text-[12px] text-[#9699A6]">{entries[0] ? rs(entries[0].income || entries[0].expense) : ""}</p>
            </Card>
          </div>

          <Card pad={false}>
            <CardHead title={isIncome ? "Recent income entries" : "Recent expense entries"} Icon={isIncome ? Landmark : CreditCard} />
            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[700px]">
                <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                  <Th className="border-l border-[#E6E9EF]">Date</Th>
                  <Th className="border-l border-[#E6E9EF]">Description</Th>
                  <Th className="border-l border-[#E6E9EF]">Category</Th>
                  <Th className="border-l border-[#E6E9EF]">Method</Th>
                  <Th className="border-l border-[#E6E9EF]">Amount</Th>
                </div>
                {entries.map((t) => (
                  <div key={t.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                    <Td className="border-l border-[#E6E9EF] text-[#676879]">{t.date}</Td>
                    <Td className="border-l border-[#E6E9EF]"><span className="truncate">{t.description}</span></Td>
                    <Td className="border-l border-[#E6E9EF]"><Badge label={t.category} tone="blue" /></Td>
                    <Td className="border-l border-[#E6E9EF] text-[#676879]">{t.method}</Td>
                    <Td className={cn("border-l border-[#E6E9EF] font-semibold", isIncome ? "text-[#037F4C]" : "text-[#C0233B]")}>{rs(isIncome ? t.income : t.expense)}</Td>
                  </div>
                ))}
              </div>
            </div>
            <div className="divide-y divide-[#E6E9EF] md:hidden">
              {entries.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{t.description}</p>
                    <p className="text-[12px] text-[#676879]">{t.date} · {t.category}</p>
                  </div>
                  <span className={cn("text-[14px] font-semibold", isIncome ? "text-[#037F4C]" : "text-[#C0233B]")}>{rs(isIncome ? t.income : t.expense)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title={isIncome ? "Income recorded" : "Expense recorded"} width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">The {kind} entry has been saved successfully.</p>
          <p className="text-[13px] text-[#676879]">It now appears in the account statement.</p>
        </div>
      </Modal>
    </>
  );
}
