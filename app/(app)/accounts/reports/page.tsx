"use client";

import Link from "next/link";
import {
  BookOpen, FileText, Scale, TrendingUp, Building2, Activity, ReceiptText, TriangleAlert, Wallet, Layers,
} from "lucide-react";
import { Card, CardHead, PageHeader, type IconType } from "@/components/ui";
import { useInitialLoading } from "@/components/skeleton";
import { ACCOUNT_REPORTS } from "@/lib/accounting-mock-data";

const ICONS: Record<string, IconType> = {
  ledger: BookOpen, statement: FileText, scale: Scale, trend: TrendingUp, building: Building2,
  flow: Activity, receipt: ReceiptText, alert: TriangleAlert, wallet: Wallet,
};

export default function AccountingReportsPage() {
  const loading = useInitialLoading();
  const groups = [...new Set(ACCOUNT_REPORTS.map((r) => r.group))];

  return (
    <>
      <PageHeader title="Accounting Reports" subtitle="All financial reports in one place." />
      <div className="space-y-5 px-4 pb-24 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-[100px] rounded-lg" />)}
          </div>
        ) : groups.map((group) => (
          <Card key={group} pad={false}>
            <CardHead title={group} subtitle={`${ACCOUNT_REPORTS.filter((r) => r.group === group).length} reports`} Icon={Layers} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {ACCOUNT_REPORTS.filter((r) => r.group === group).map((r) => {
                const Icon = ICONS[r.icon] ?? FileText;
                return (
                  <Link key={r.title} href={r.href}
                    className="flex items-start gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 transition-colors hover:bg-[var(--theme-hover)]">
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
