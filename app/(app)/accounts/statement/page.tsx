"use client";

import { useMemo, useState } from "react";
import { Printer, Download, SlidersHorizontal, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { Badge, Btn, Card, CardHead, PageHeader, SearchBox, Select, StatCard, Th, Td, cn, rs } from "@/components/ui";
import { TRANSACTIONS, SCHOOL } from "@/lib/mock-data";

const COLS = "grid-cols-[110px_110px_minmax(200px,1.6fr)_120px_120px_130px]";

export default function AccountStatementPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => TRANSACTIONS
    .filter((t) => t.description.toLowerCase().includes(q.toLowerCase()) || t.ref.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase()))
    .filter((t) => (type === "Income" ? t.income > 0 : type === "Expense" ? t.expense > 0 : true))
    .filter((t) => (from ? t.date >= from : true))
    .filter((t) => (to ? t.date <= to : true)),
  [q, type, from, to]);

  const totalIn = rows.reduce((a, t) => a + t.income, 0);
  const totalOut = rows.reduce((a, t) => a + t.expense, 0);
  const net = totalIn - totalOut;

  return (
    <>
      <div className="no-print">
        <PageHeader title="Account Statement" subtitle="Ledger of all income and expense transactions with running balance."
          actions={
            <>
              <Btn variant="secondary" Icon={Download} className="hidden sm:inline-flex">Export CSV</Btn>
              <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print</Btn>
            </>
          } />

        <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:px-6 sm:grid-cols-3">
          <StatCard label="Total Income" value={rs(totalIn)} Icon={TrendingUp} tone="green" />
          <StatCard label="Total Expenses" value={rs(totalOut)} Icon={TrendingDown} tone="red" />
          <StatCard label="Net Balance" value={rs(net)} Icon={Coins} tone="blue" />
        </div>

        <div className="px-4 sm:px-6">
          <Card pad={false} className="mt-4">
            <CardHead title="Filters" subtitle="Narrow down the statement" Icon={SlidersHorizontal} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <SearchBox value={q} onChange={setQ} placeholder="Search reference, description" />
              <Select value={type} onChange={(e) => setType(e.target.value)} options={["Income", "Expense"]} placeholder="All Types" />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded border border-[#C5C7D0] bg-white px-3 text-[14px] outline-none focus:border-[#2563EB]" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded border border-[#C5C7D0] bg-white px-3 text-[14px] outline-none focus:border-[#2563EB]" />
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 pb-24 pt-4 sm:px-6">
        <Card pad={false}>
          <CardHead title="Transactions" subtitle={`${rows.length} entries · ${SCHOOL.session}`} Icon={Coins} right={<Badge label={`Net ${rs(net)}`} tone={net >= 0 ? "green" : "red"} />} />

          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[860px]">
              <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-[#F6F7FB]")}>
                <Th className="border-l border-[#E6E9EF]">Date</Th>
                <Th className="border-l border-[#E6E9EF]">Reference</Th>
                <Th className="border-l border-[#E6E9EF]">Description</Th>
                <Th className="border-l border-[#E6E9EF]">Income</Th>
                <Th className="border-l border-[#E6E9EF]">Expense</Th>
                <Th className="border-l border-[#E6E9EF]">Balance</Th>
              </div>
              {rows.map((t) => (
                <div key={t.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] hover:bg-[#F5F6F8]")}>
                  <Td className="border-l border-[#E6E9EF] text-[#676879]">{t.date}</Td>
                  <Td className="border-l border-[#E6E9EF] font-mono text-[13px] text-[#676879]">{t.ref}</Td>
                  <Td className="border-l border-[#E6E9EF]"><span className="truncate">{t.description}</span></Td>
                  <Td className="border-l border-[#E6E9EF] font-medium text-[#037F4C]">{t.income ? rs(t.income) : "—"}</Td>
                  <Td className="border-l border-[#E6E9EF] font-medium text-[#C0233B]">{t.expense ? rs(t.expense) : "—"}</Td>
                  <Td className={cn("border-l border-[#E6E9EF] font-medium", t.balance < 0 ? "text-[#C0233B]" : "")}>{rs(t.balance)}</Td>
                </div>
              ))}
              <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-[#F6F7FB] text-[14px] font-semibold")}>
                <Td className="border-l border-[#E6E9EF]">Totals</Td>
                <Td className="border-l border-[#E6E9EF]" />
                <Td className="border-l border-[#E6E9EF]">{rows.length} transactions</Td>
                <Td className="border-l border-[#E6E9EF] text-[#037F4C]">{rs(totalIn)}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#C0233B]">{rs(totalOut)}</Td>
                <Td className="border-l border-[#E6E9EF]">{rs(net)}</Td>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#E6E9EF] md:hidden">
            {rows.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3">
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.income ? "bg-[#D6F5E3] text-[#037F4C]" : "bg-[#FDD9DF] text-[#C0233B]")}>
                  {t.income ? <TrendingUp className="h-[18px] w-[18px]" /> : <TrendingDown className="h-[18px] w-[18px]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{t.description}</p>
                  <p className="text-[12px] text-[#676879]">{t.date} · {t.ref}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-[14px] font-semibold", t.income ? "text-[#037F4C]" : "text-[#C0233B]")}>{t.income ? `+${rs(t.income)}` : `−${rs(t.expense)}`}</p>
                  <p className="text-[11px] text-[#9699A6]">Bal {rs(t.balance)}</p>
                </div>
              </div>
            ))}
          </div>

          {rows.length === 0 && <p className="py-10 text-center text-[14px] text-[#676879]">No transactions match the selected filters.</p>}
        </Card>
      </div>
    </>
  );
}
