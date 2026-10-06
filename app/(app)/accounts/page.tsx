"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Coins, Plus, ArrowRight, FileSpreadsheet, Landmark, CreditCard, Receipt } from "lucide-react";
import { Badge, Card, CardHead, PageHeader, StatCard, Th, Td, cn, rs } from "@/components/ui";
import { TrendChart } from "@/components/charts/trend-chart";
import { TRANSACTIONS, INVOICES, DASHBOARD_STATS as S, FEE_COLLECTION_TREND } from "@/lib/mock-data";

const COLS = "grid-cols-[110px_120px_minmax(200px,1.6fr)_110px_110px_110px]";

export default function AccountsDashboardPage() {
  const totalIncome = S.income;
  const totalExpense = S.expenses;
  const net = totalIncome - totalExpense;
  const collected = S.collectedFees;
  const pending = S.pendingFees;

  const recent = TRANSACTIONS.slice(0, 8);

  const incomeCats = [
    { label: "Fee Collection", value: 1245000 }, { label: "Admissions", value: 285000 },
    { label: "Donations", value: 120000 }, { label: "Events", value: 55000 },
  ];
  const expenseCats = [
    { label: "Salaries", value: 325000 }, { label: "Utilities", value: 48000 },
    { label: "Supplies", value: 83500 }, { label: "Transport", value: 38000 },
  ];
  const maxCat = Math.max(...[...incomeCats, ...expenseCats].map((c) => c.value));

  return (
    <>
      <PageHeader title="Accounts Dashboard" subtitle="Financial overview of income, expenses and fee collection."
        actions={
          <>
            <Link href="/accounts/statement" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex"><FileSpreadsheet className="h-[18px] w-[18px]" /> Statement</Link>
            <Link href="/accounts/income" className="inline-flex items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"><Plus className="h-[18px] w-[18px]" /> Add Income</Link>
          </>
        } />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Income" value={rs(totalIncome)} Icon={TrendingUp} tone="green" sub="Year to date" trend={{ dir: "up", text: "+8.4%" }} />
          <StatCard label="Total Expenses" value={rs(totalExpense)} Icon={TrendingDown} tone="red" sub="Year to date" trend={{ dir: "down", text: "-2.1%" }} />
          <StatCard label="Net Balance" value={rs(net)} Icon={Coins} tone="blue" sub="Income − Expenses" />
          <StatCard label="Fee Collection" value={rs(collected)} Icon={Wallet} tone="purple" sub={`${rs(pending)} pending`} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card pad={false} className="xl:col-span-2">
            <CardHead title="Fee collection trend" subtitle="Monthly collected amount" Icon={TrendingUp} />
            <div className="p-4">
              <TrendChart data={FEE_COLLECTION_TREND} areaId="feeTrendFill" valueFormatter={(n) => `${Math.round(n / 1000)}k`} />
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Quick actions" Icon={Receipt} />
            <div className="space-y-2 p-3">
              {[
                { label: "Add Income", href: "/accounts/income", Icon: Landmark, cls: "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]" },
                { label: "Add Expense", href: "/accounts/expense", Icon: CreditCard, cls: "bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)]" },
                { label: "Account Statement", href: "/accounts/statement", Icon: FileSpreadsheet, cls: "bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]" },
                { label: "Fee Invoices", href: "/fees/invoices", Icon: Wallet, cls: "bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]" },
              ].map(({ label, href, Icon, cls }) => (
                <Link key={label} href={href} className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] px-3 py-2.5 hover:bg-[var(--theme-hover)]">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", cls)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-[14px] font-medium">{label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--theme-text-faint)]" />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card pad={false}>
            <CardHead title="Income by category" Icon={TrendingUp} right={<Badge label={rs(totalIncome)} tone="green" />} />
            <div className="space-y-3 p-4">
              {incomeCats.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex items-center justify-between text-[13px]"><span className="font-medium">{c.label}</span><span className="text-[var(--theme-text-muted)]">{rs(c.value)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-border)]"><div className="h-full rounded-full bg-[var(--theme-success)]" style={{ width: `${(c.value / maxCat) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card pad={false}>
            <CardHead title="Expenses by category" Icon={TrendingDown} right={<Badge label={rs(totalExpense)} tone="red" />} />
            <div className="space-y-3 p-4">
              {expenseCats.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex items-center justify-between text-[13px]"><span className="font-medium">{c.label}</span><span className="text-[var(--theme-text-muted)]">{rs(c.value)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-border)]"><div className="h-full rounded-full bg-[var(--theme-danger)]" style={{ width: `${(c.value / maxCat) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card pad={false}>
          <CardHead title="Recent transactions" subtitle="Latest income and expense entries" Icon={FileSpreadsheet}
            right={<Link href="/accounts/statement" className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Full statement <ArrowRight className="h-4 w-4" /></Link>} />
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[760px]">
              <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                <Th className="border-l border-[var(--theme-border)]">Date</Th>
                <Th className="border-l border-[var(--theme-border)]">Reference</Th>
                <Th className="border-l border-[var(--theme-border)]">Description</Th>
                <Th className="border-l border-[var(--theme-border)]">Income</Th>
                <Th className="border-l border-[var(--theme-border)]">Expense</Th>
                <Th className="border-l border-[var(--theme-border)]">Balance</Th>
              </div>
              {recent.map((t) => (
                <div key={t.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{t.date}</Td>
                  <Td className="border-l border-[var(--theme-border)] font-mono text-[13px] text-[var(--theme-text-muted)]">{t.ref}</Td>
                  <Td className="border-l border-[var(--theme-border)]"><span className="truncate">{t.description}</span></Td>
                  <Td className="border-l border-[var(--theme-border)] font-medium text-[var(--theme-success-text)]">{t.income ? rs(t.income) : "—"}</Td>
                  <Td className="border-l border-[var(--theme-border)] font-medium text-[var(--theme-danger-text)]">{t.expense ? rs(t.expense) : "—"}</Td>
                  <Td className="border-l border-[var(--theme-border)] font-medium">{rs(t.balance)}</Td>
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-[var(--theme-border)] md:hidden">
            {recent.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3">
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  t.income ? "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]" : "bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)]")}>
                  {t.income ? <TrendingUp className="h-[18px] w-[18px]" /> : <TrendingDown className="h-[18px] w-[18px]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{t.description}</p>
                  <p className="text-[12px] text-[var(--theme-text-muted)]">{t.date} · {t.ref}</p>
                </div>
                <span className={cn("text-[14px] font-semibold", t.income ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]")}>{t.income ? "+" : "−"}{rs(t.income || t.expense)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={false}>
          <CardHead title="Fee snapshot" subtitle="Invoice status distribution" Icon={Wallet} />
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {(["Paid", "Partially Paid", "Pending", "Overdue"] as const).map((st) => {
              const count = INVOICES.filter((i) => i.status === st).length;
              const cls = st === "Paid" ? "bg-[var(--theme-success-soft)]" : st === "Partially Paid" ? "bg-[var(--theme-warning-soft)]" : st === "Overdue" ? "bg-[var(--theme-danger-soft)]" : "bg-[var(--theme-subtle)]";
              return (
                <div key={st} className={cn("rounded-lg p-3", cls)}>
                  <p className="text-[22px] font-bold">{count}</p>
                  <p className="text-[12px]">{st}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
