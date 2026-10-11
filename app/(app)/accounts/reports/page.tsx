"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Scale,
  TrendingUp,
  TrendingDown,
  Building2,
  Activity,
  ReceiptText,
  TriangleAlert,
  Wallet,
  Layers,
  Coins,
} from "lucide-react";
import { Card, CardHead, PageHeader, StatCard, rs, type IconType } from "@/components/ui";
import { accountsApi, type AccountsDashboardResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

type AccountReport = { title: string; desc: string; href: string; icon: string; group: string };

const REPORTS_CATALOG: AccountReport[] = [
  { title: "General Ledger", desc: "Account-wise ledger with running balance", href: "/accounts/general-ledger", icon: "ledger", group: "Core Financial" },
  { title: "Account Statement", desc: "Complete income & expense ledger statement", href: "/accounts/statement", icon: "statement", group: "Core Financial" },
  { title: "Trial Balance", desc: "Double-entry debit / credit verification", href: "/accounts/trial-balance", icon: "scale", group: "Financial Statements" },
  { title: "Profit & Loss", desc: "Operating income, expenses and net surplus", href: "/accounts/profit-loss", icon: "trend", group: "Financial Statements" },
  { title: "Balance Sheet", desc: "Assets, liabilities and school equity fund", href: "/accounts/balance-sheet", icon: "building", group: "Financial Statements" },
  { title: "Cash Flow Statement", desc: "Operating, investing & financing flows", href: "/accounts/cash-flow", icon: "flow", group: "Financial Statements" },
  { title: "Cash & Bank Summary", desc: "Liquid cash registers and bank accounts", href: "/accounts/cash-bank", icon: "wallet", group: "Cash & Banking" },
  { title: "Bank Reconciliation", desc: "Bank statement vs book transactions", href: "/accounts/bank-reconciliation", icon: "statement", group: "Cash & Banking" },
  { title: "Fee Receivables", desc: "Outstanding student dues and collection", href: "/accounts/fee-receivables", icon: "receipt", group: "Fee Accounting" },
  { title: "Income Accounts", desc: "Categorical income posting and vouchers", href: "/accounts/income", icon: "trend", group: "Transactions" },
  { title: "Expense Accounts", desc: "Categorical expenditure and payments", href: "/accounts/expense", icon: "trend", group: "Transactions" },
];

const ICONS: Record<string, IconType> = {
  ledger: BookOpen,
  statement: FileText,
  scale: Scale,
  trend: TrendingUp,
  building: Building2,
  flow: Activity,
  receipt: ReceiptText,
  alert: TriangleAlert,
  wallet: Wallet,
};

export default function AccountingReportsPage() {
  const { currentBranchId } = useBranch();
  const [data, setData] = useState<AccountsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
    setLoading(true);
    accountsApi
      .getDashboard({ branchId: branchScope })
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentBranchId]);

  const groups = [...new Set(REPORTS_CATALOG.map((r) => r.group))];
  const kpis = data?.kpis;

  return (
    <>
      <PageHeader title="Accounting Reports" subtitle="All financial statements and accounting reports in one place." />
      <div className="space-y-5 px-4 pb-24 sm:px-6">
        {kpis && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Income" value={rs(kpis.totalIncome)} Icon={TrendingUp} tone="green" />
            <StatCard label="Total Expenses" value={rs(kpis.totalExpense)} Icon={TrendingDown} tone="red" />
            <StatCard label="Net Surplus" value={rs(kpis.net)} Icon={Coins} tone={kpis.net >= 0 ? "blue" : "red"} />
            <StatCard label="Cash & Bank" value={rs(kpis.totalAvailable)} Icon={Wallet} tone="purple" />
          </div>
        )}

        {groups.map((group) => (
          <Card key={group} pad={false}>
            <CardHead
              title={group}
              subtitle={`${REPORTS_CATALOG.filter((r) => r.group === group).length} available statements`}
              Icon={Layers}
            />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {REPORTS_CATALOG.filter((r) => r.group === group).map((r) => {
                const Icon = ICONS[r.icon] ?? FileText;
                return (
                  <Link
                    key={r.title}
                    href={r.href}
                    className="flex items-start gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 transition-colors hover:bg-[var(--theme-hover)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{r.title}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-[var(--theme-text-muted)]">{r.desc}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
