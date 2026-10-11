"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  Landmark,
  CreditCard,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { Badge, Card, CardHead, PageHeader, StatCard, Th, Td, cn, rs } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { accountsApi, type AccountsDashboardResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const COLS = "grid-cols-[110px_120px_minmax(180px,1.6fr)_120px_110px_110px]";

export default function AccountsDashboardPage() {
  const { currentBranchId } = useBranch();
  const [data, setData] = useState<AccountsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getDashboard({ branchId: branchScope });
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load accounting data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranchId]);

  const kpis = data?.kpis || {
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    cash: 0,
    bank: 0,
    totalAvailable: 0,
    collectedFees: 0,
    pendingFees: 0,
  };

  const incomeCats = data?.incomeCats || [];
  const expenseCats = data?.expenseCats || [];
  const maxIncome = Math.max(1, ...incomeCats.map((c) => c.value));
  const maxExpense = Math.max(1, ...expenseCats.map((c) => c.value));
  const recentVouchers = data?.recentVouchers || [];

  return (
    <>
      <PageHeader
        title="Accounts Dashboard"
        subtitle="Financial overview of income, expenses, vouchers, and cash position."
        actions={
          <>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            <Link
              href="/accounts/statement"
              className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex"
            >
              <FileSpreadsheet className="h-[18px] w-[18px]" /> Statement
            </Link>
            <Link
              href="/accounts/income"
              className="inline-flex items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Plus className="h-[18px] w-[18px]" /> Add Income
            </Link>
          </>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        {error && (
          <div className="rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Income"
            value={rs(kpis.totalIncome)}
            Icon={TrendingUp}
            tone="green"
            sub="Ledger revenue posted"
          />
          <StatCard
            label="Total Expenses"
            value={rs(kpis.totalExpense)}
            Icon={TrendingDown}
            tone="red"
            sub="Ledger expenses posted"
          />
          <StatCard
            label="Net Surplus / Deficit"
            value={rs(kpis.net)}
            Icon={Coins}
            tone={kpis.net >= 0 ? "blue" : "red"}
            sub={kpis.net >= 0 ? "Surplus (Income − Expense)" : "Deficit (Expense > Income)"}
          />
          <StatCard
            label="Cash & Bank"
            value={rs(kpis.totalAvailable)}
            Icon={Wallet}
            tone="purple"
            sub={`Cash: ${rs(kpis.cash)} · Bank: ${rs(kpis.bank)}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card pad={false} className="xl:col-span-2">
            <CardHead
              title="Recent Vouchers"
              subtitle="Latest payment and receipt transactions"
              Icon={Receipt}
              right={
                <Link
                  href="/accounts/receipt-vouchers"
                  className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline"
                >
                  View all
                </Link>
              }
            />
            {recentVouchers.length === 0 ? (
              <div className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
                No vouchers recorded yet. Use &ldquo;Add Income&rdquo; or &ldquo;New Voucher&rdquo; to start.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  <div
                    className={cn(
                      "grid",
                      COLS,
                      "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]"
                    )}
                  >
                    <Th className="border-l border-[var(--theme-border)]">Date</Th>
                    <Th className="border-l border-[var(--theme-border)]">Voucher #</Th>
                    <Th className="border-l border-[var(--theme-border)]">Party</Th>
                    <Th className="border-l border-[var(--theme-border)]">Account</Th>
                    <Th className="border-l border-[var(--theme-border)] text-right">Amount</Th>
                    <Th className="border-l border-[var(--theme-border)]">Status</Th>
                  </div>
                  {recentVouchers.map((v) => (
                    <div
                      key={v.id}
                      className={cn(
                        "grid",
                        COLS,
                        "border-b border-[var(--theme-border)] px-3 py-2.5 text-[13px] transition-colors hover:bg-[var(--theme-hover)] last:border-b-0"
                      )}
                    >
                      <Td className="text-[var(--theme-text-muted)]">{v.date}</Td>
                      <Td className="font-medium">{v.no}</Td>
                      <Td className="truncate font-medium">{v.party}</Td>
                      <Td className="truncate text-[var(--theme-text-muted)]">{v.account}</Td>
                      <Td className={cn("text-right font-semibold tabular-nums", v.kind === "Receipt" ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]")}>
                        {v.kind === "Receipt" ? `+${rs(v.amount)}` : `-${rs(v.amount)}`}
                      </Td>
                      <Td>
                        <StatusPill label={v.status} />
                      </Td>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card pad={false}>
            <CardHead title="Quick Actions" Icon={Receipt} />
            <div className="space-y-2 p-3">
              {[
                { label: "Add Income", href: "/accounts/income", Icon: Landmark, cls: "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]" },
                { label: "Add Expense", href: "/accounts/expense", Icon: CreditCard, cls: "bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)]" },
                { label: "New Journal Entry", href: "/accounts/journal-entries/new", Icon: Plus, cls: "bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]" },
                { label: "Trial Balance", href: "/accounts/trial-balance", Icon: Receipt, cls: "bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]" },
                { label: "Account Statement", href: "/accounts/statement", Icon: FileSpreadsheet, cls: "bg-[var(--theme-hover)] text-[var(--theme-text)]" },
                { label: "Cash & Bank", href: "/accounts/cash-bank", Icon: Wallet, cls: "bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]" },
              ].map(({ label, href, Icon, cls }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] px-3 py-2.5 hover:bg-[var(--theme-hover)]"
                >
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
            <CardHead
              title="Income by Category"
              Icon={TrendingUp}
              right={<Badge label={rs(kpis.totalIncome)} tone="green" />}
            />
            <div className="space-y-3 p-4">
              {incomeCats.length === 0 ? (
                <p className="text-[13px] text-[var(--theme-text-muted)]">No income categories recorded.</p>
              ) : (
                incomeCats.map((c) => (
                  <div key={c.label}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-[var(--theme-text-muted)]">{rs(c.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--theme-success)]"
                        style={{ width: `${Math.min(100, (c.value / maxIncome) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card pad={false}>
            <CardHead
              title="Expenses by Category"
              Icon={TrendingDown}
              right={<Badge label={rs(kpis.totalExpense)} tone="red" />}
            />
            <div className="space-y-3 p-4">
              {expenseCats.length === 0 ? (
                <p className="text-[13px] text-[var(--theme-text-muted)]">No expense categories recorded.</p>
              ) : (
                expenseCats.map((c) => (
                  <div key={c.label}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-[var(--theme-text-muted)]">{rs(c.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--theme-danger)]"
                        style={{ width: `${Math.min(100, (c.value / maxExpense) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
