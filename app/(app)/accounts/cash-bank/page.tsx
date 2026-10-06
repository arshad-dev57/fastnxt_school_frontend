"use client";

import Link from "next/link";
import { Banknote, ArrowLeftRight, FileSearch, Wallet } from "lucide-react";
import { Card, CardHead, PageHeader, StatCard, rs } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { useInitialLoading } from "@/components/skeleton";
import { CASH_BANK } from "@/lib/accounting-mock-data";

export default function CashBankPage() {
  const cash = CASH_BANK.filter((a) => a.kind === "Cash").reduce((s, a) => s + a.balance, 0);
  const bank = CASH_BANK.filter((a) => a.kind === "Bank").reduce((s, a) => s + a.balance, 0);
  const loading = useInitialLoading();

  return (
    <>
      <PageHeader title="Cash & Bank" subtitle="Cash position and bank account balances." />
      <div className="space-y-5 px-4 pb-24 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[104px] rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Cash Balance" value={rs(cash)} Icon={Wallet} tone="green" sub="Petty cash in hand" />
            <StatCard label="Bank Balance" value={rs(bank)} Icon={Banknote} tone="blue" sub="Across 3 bank accounts" />
            <StatCard label="Total Available" value={rs(cash + bank)} Icon={ArrowLeftRight} tone="purple" sub="Cash + bank" />
          </div>
        )}

        <Card pad={false}>
          <CardHead title="Accounts" subtitle="School cash and bank accounts" Icon={Wallet} />
          <div className="divide-y divide-[var(--theme-border)]">
            {CASH_BANK.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-[var(--theme-hover)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                  {a.kind === "Cash" ? <Wallet className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{a.name}</p>
                  <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{a.number} · Last transaction {a.lastTxn}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[var(--theme-text-muted)]">Current Balance</p>
                  <p className="text-[15px] font-semibold tabular-nums">{rs(a.balance)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href="/accounts/general-ledger" className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] px-2.5 text-[13px] hover:bg-[var(--theme-hover)]">
                    <FileSearch className="h-4 w-4" /> Statement
                  </Link>
                  <Link href="/accounts/bank-reconciliation" className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] px-2.5 text-[13px] hover:bg-[var(--theme-hover)]">
                    <ArrowLeftRight className="h-4 w-4" /> Reconcile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false}>
          <CardHead title="Recent movements" subtitle="Latest cash and bank activity" Icon={ArrowLeftRight} />
          <div className="divide-y divide-[var(--theme-border)]">
            {[
              { id: "RV-0005", date: "2026-10-09", desc: "Cheque clearance — Bilal Ahmed", amount: 27500, status: "Posted" },
              { id: "PV-0004", date: "2026-10-08", desc: "Stationery purchase", amount: -18000, status: "Posted" },
              { id: "RV-0003", date: "2026-10-03", desc: "Admission fee — Hassan Raza", amount: 15000, status: "Posted" },
            ].map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{t.desc}</p>
                  <p className="text-[12px] text-[var(--theme-text-muted)]">{t.id} · {t.date}</p>
                </div>
                <StatusPill label={t.status} />
                <span className={`w-28 text-right text-[14px] font-medium tabular-nums ${t.amount < 0 ? "text-[var(--theme-danger-text)]" : "text-[var(--theme-success-text)]"}`}>
                  {t.amount < 0 ? `(${rs(Math.abs(t.amount))})` : rs(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
