"use client";

import Link from "next/link";
import {
  BarChart3, Users, CalendarCheck, Wallet, Landmark, GraduationCap, Briefcase, Wallet2,
  Bus, BookOpen, Boxes, Building2, ArrowRight,
} from "lucide-react";
import { PageHeader, Card, cn } from "@/components/ui";
import { BranchScopeBar } from "@/components/branch/branch-ui";

type ReportLink = { title: string; desc: string; href: string; Icon: typeof Users };

const BASICS: ReportLink[] = [
  { title: "Branch Performance", desc: "Consolidated multi-campus comparison across every KPI.", href: "/reports/branch-performance", Icon: Building2 },
  { title: "Student Reports", desc: "Enrollment, class distribution, gender and status.", href: "/students", Icon: Users },
  { title: "Attendance Reports", desc: "Daily register, monthly summary and absentee alerts.", href: "/attendance", Icon: CalendarCheck },
  { title: "Fee Reports", desc: "Collection, outstanding, defaulters and receipts.", href: "/fees/invoices", Icon: Wallet },
  { title: "Examination Reports", desc: "Results, grades, merit lists and class averages.", href: "/results", Icon: GraduationCap },
  { title: "HR Reports", desc: "Employees, attendance, leave and recruitment.", href: "/employees", Icon: Briefcase },
  { title: "Payroll Reports", desc: "Salary register, allowances, deductions and net pay.", href: "/payroll", Icon: Wallet2 },
  { title: "Transport Reports", desc: "Fleet, routes, passengers and transport fees.", href: "/transport", Icon: Bus },
  { title: "Library Reports", desc: "Catalogue, circulation, overdue and fines.", href: "/library", Icon: BookOpen },
  { title: "Inventory & Assets", desc: "Stock levels, reorder alerts and asset register.", href: "/inventory", Icon: Boxes },
  { title: "Accounting Reports", desc: "Ledger, trial balance, P&L, balance sheet and cash flow.", href: "/accounts/reports", Icon: Landmark },
];

export default function ReportsCenterPage() {
  return (
    <>
      <PageHeader title="Reports Center" subtitle="One place for every report — each respects the active campus scope, session and filters." />
      <div className="px-4 pb-24 sm:px-6">
        <BranchScopeBar />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {BASICS.map(({ title, desc, href, Icon }) => (
            <Link key={title} href={href}
              className={cn("group ic-card flex items-start gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-shadow hover:shadow-md")}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] font-semibold">{title}<ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" /></span>
                <span className="mt-0.5 block text-[13px] text-[var(--theme-text-muted)]">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
        <Card className="mt-5 flex items-start gap-3 bg-[var(--theme-sidebar)]">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--theme-text-muted)]" />
          <p className="text-[13px] text-[var(--theme-text-muted)]">
            Every report supports campus, academic session, date range, class, section and status filters, and is export-ready
            (PDF / Excel) for the future backend integration.
          </p>
        </Card>
      </div>
    </>
  );
}
