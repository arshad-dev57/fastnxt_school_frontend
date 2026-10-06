"use client";

import Link from "next/link";
import {
  Users, UserCheck, UserX, School, Briefcase, Wallet, TrendingUp, TrendingDown,
  ReceiptText, Plus, FileText, CreditCard, ArrowRight, CalendarDays, Activity,
  Download, UserPlus, Landmark,
} from "lucide-react";
import {
  Avatar, Badge, Card, CardHead, PageHeader, StatCard, rs,
  type IconType, type Tone,
} from "@/components/ui";
import {
  AdmissionsChart, AttendanceChart, ClassDistributionChart, EmployeeChart, EnrollmentChart,
  FeeCollectionChart, FeeStatusDonut, GenderDonut, ResultsChart,
} from "@/components/charts/analytics-charts";
import {
  RECENT_ADMISSIONS, RECENT_ACTIVITIES, UPCOMING_EVENTS, INVOICES,
} from "@/lib/mock-data";
import { DashboardSkeleton, useInitialLoading } from "@/components/skeleton";
import { useBranch } from "@/lib/branch-context";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { BRANCH_COMPARISON, BRANCH_DASHBOARD_STATS } from "@/lib/branch-mock-data";
import { UpcomingMeetingsCard } from "@/components/meetings/upcoming-meetings";

type Stat = { label: string; value: string | number; Icon: IconType; tone: Tone; sub?: string };

const QUICK: { label: string; href: string; Icon: IconType }[] = [
  { label: "Add Student", href: "/students/new", Icon: UserPlus },
  { label: "New Class", href: "/classes/new", Icon: School },
  { label: "Add Employee", href: "/employees/new", Icon: Briefcase },
  { label: "Create Invoice", href: "/fees/invoices", Icon: FileText },
  { label: "Add Income", href: "/accounts/income", Icon: Landmark },
  { label: "Add Expense", href: "/accounts/expense", Icon: CreditCard },
];

const STATUS_DOT: Record<string, string> = {
  green: "var(--theme-success)", blue: "var(--theme-info)", purple: "var(--theme-accent-2)",
  orange: "var(--theme-warning)", red: "var(--theme-danger)", gray: "var(--theme-pending)",
};

export default function DashboardPage() {
  const { currentBranch, currentBranchId } = useBranch();
  const overdue = INVOICES.filter((i) => i.status === "Overdue").length;
  const paid = INVOICES.filter((i) => i.status === "Paid").length;
  const campusStats = currentBranchId === "all" ? null : BRANCH_DASHBOARD_STATS.find((item) => item.branchId === currentBranchId);
  const total = (key: keyof typeof BRANCH_DASHBOARD_STATS[number]) => BRANCH_DASHBOARD_STATS.reduce((sum, item) => sum + (typeof item[key] === "number" ? item[key] as number : 0), 0);
  const stats = campusStats ? {
    totalStudents: campusStats.students, activeStudents: Math.round(campusStats.students * .96), inactiveStudents: Math.round(campusStats.students * .04), totalClasses: Math.round(campusStats.students / 38), totalEmployees: campusStats.employees, pendingFees: campusStats.outstandingFees, collectedFees: campusStats.feeCollection, expenses: campusStats.expenses, income: campusStats.income,
  } : { totalStudents: total("students"), activeStudents: Math.round(total("students") * .96), inactiveStudents: Math.round(total("students") * .04), totalClasses: 122, totalEmployees: total("employees"), pendingFees: total("outstandingFees"), collectedFees: total("feeCollection"), expenses: total("expenses"), income: total("income") };
  const scopedStats: Stat[] = [
    { label: "Total Students", value: stats.totalStudents, Icon: Users, tone: "blue", sub: currentBranch ? currentBranch.name : "Across all campuses" },
    { label: "Active Students", value: stats.activeStudents, Icon: UserCheck, tone: "green", sub: "Currently attending" },
    { label: "Inactive Students", value: stats.inactiveStudents, Icon: UserX, tone: "gray", sub: "Suspended / left" },
    { label: "Total Classes", value: stats.totalClasses, Icon: School, tone: "purple", sub: "Active class sections" },
    { label: "Total Employees", value: stats.totalEmployees, Icon: Briefcase, tone: "purple", sub: "Teaching & non-teaching" },
    { label: "Pending Fees", value: rs(stats.pendingFees), Icon: ReceiptText, tone: "orange", sub: "Current receivables" },
    { label: "Collected Fees", value: rs(stats.collectedFees), Icon: Wallet, tone: "green", sub: "Current academic session" },
    { label: "Expenses", value: rs(stats.expenses), Icon: TrendingDown, tone: "red", sub: "Year to date" },
    { label: "Income", value: rs(stats.income), Icon: TrendingUp, tone: "blue", sub: "Year to date" },
  ];

  // Simulated initial data load → shimmer skeleton, then the real content.
  const loading = useInitialLoading();
  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back — ${currentBranch ? `${currentBranch.name} operational view` : "consolidated view across all campuses"}.`}
        actions={
          <>
            <Link href="/students/print-list" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <Download className="h-[18px] w-[18px]" /> Export
            </Link>
            <Link href="/students/new" className="ic-plus-btn inline-flex items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
              <Plus className="ic-plus h-[18px] w-[18px]" /> New Admission
            </Link>
          </>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <BranchScopeBar />
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {scopedStats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} Icon={s.Icon} tone={s.tone} sub={s.sub} />
          ))}
        </div>

        {/* PORTAL ENTRIES — links into the Student / Teacher portals.
            Purely additive: no existing Admin card, field or action is changed. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/student"
            className="ic-card flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-shadow hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
              <Users className="ic-lift h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">Open Student Portal</span>
              <span className="block truncate text-[13px] text-[var(--theme-text-muted)]">Timetable, attendance, homework, results, library & fees</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--theme-text-faint)]" />
          </Link>
          <Link href="/teacher"
            className="ic-card flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-shadow hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
              <Briefcase className="ic-lift h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">Open Teacher Portal</span>
              <span className="block truncate text-[13px] text-[var(--theme-text-muted)]">Classes, attendance marking, homework, exams & tasks</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--theme-text-faint)]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-5 xl:col-span-2">
            <EnrollmentChart />
            <AttendanceChart />
            <FeeCollectionChart />

            <Card pad={false}>
              <CardHead title="Recent admissions" subtitle="Newest students added to the school" Icon={UserPlus}
                right={<Link href="/students" className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>} />
              <div className="divide-y divide-[var(--theme-border)]">
                {RECENT_ADMISSIONS.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--theme-hover)]">
                    <Avatar name={st.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{st.name}</p>
                      <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{st.id} · {st.cls}-{st.section}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[12px] text-[var(--theme-text-muted)]">Guardian</p>
                      <p className="truncate text-[13px]">{st.guardian}</p>
                    </div>
                    <Badge label={st.status} className="hidden sm:inline-flex" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <Card pad={false}>
              <CardHead title="Quick actions" Icon={Activity} />
              <div className="grid grid-cols-2 gap-2 p-3">
                {QUICK.map(({ label, href, Icon }) => (
                  <Link key={label} href={href}
                    className="flex flex-col items-center gap-2 rounded-lg border border-[var(--theme-border)] px-2 py-3 text-center transition-colors hover:bg-[var(--theme-hover)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-active-bg)] text-[var(--theme-primary-hover)]"><Icon className="h-[18px] w-[18px]" /></span>
                    <span className="text-[12px] font-medium leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </Card>

            <FeeStatusDonut />
            <GenderDonut />

            <UpcomingMeetingsCard scope="admin" viewAllHref="/meetings" />

            <Card pad={false}>
              <CardHead title="Upcoming events" Icon={CalendarDays} />
              <div className="divide-y divide-[var(--theme-border)]">
                {UPCOMING_EVENTS.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{e.title}</p>
                      <p className="text-[12px] text-[var(--theme-text-muted)]">{e.date}</p>
                    </div>
                    <Badge label={e.tag} tone="purple" />
                  </div>
                ))}
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Recent activity" Icon={Activity} />
              <div className="px-4 py-2">
                {RECENT_ACTIVITIES.map((a, i) => (
                  <div key={a.id} className="relative flex gap-3 py-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[a.tone] ?? "var(--theme-text-faint)" }} />
                      {i < RECENT_ACTIVITIES.length - 1 && <span className="mt-1 w-px flex-1 bg-[var(--theme-border)]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--theme-text-faint)]">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Fee health" Icon={ReceiptText} />
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-lg bg-[var(--theme-success-soft)] p-3">
                  <p className="text-[22px] font-bold text-[var(--theme-success-text)]">{paid}</p>
                  <p className="text-[12px] text-[var(--theme-success-text)]">Paid invoices</p>
                </div>
                <div className="rounded-lg bg-[var(--theme-danger-soft)] p-3">
                  <p className="text-[22px] font-bold text-[var(--theme-danger-text)]">{overdue}</p>
                  <p className="text-[12px] text-[var(--theme-danger-text)]">Overdue invoices</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {currentBranchId === "all" && <Card pad={false}>
          <CardHead title="Branch performance" subtitle="Consolidated management view for the current academic session." Icon={Landmark} />
          <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-[13px]"><thead className="border-y border-[var(--theme-border)] bg-[var(--theme-subtle)] text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]"><tr>{["Branch", "Students", "Attendance", "Fee collection", "Outstanding", "Employees", "Exam average"].map((heading) => <th key={heading} className="px-4 py-2.5 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[var(--theme-border)]">{BRANCH_COMPARISON.map((branch) => <tr key={branch.branchId} className="hover:bg-[var(--theme-hover)]"><td className="px-4 py-3 font-medium">{branch.branchName}<span className="ml-2 text-[11px] text-[var(--theme-text-faint)]">{branch.branchCode}</span></td><td className="px-4 py-3">{branch.students.toLocaleString()}</td><td className="px-4 py-3">{branch.attendance}%</td><td className="px-4 py-3">{rs(branch.feeCollection)}</td><td className="px-4 py-3">{rs(branch.outstanding)}</td><td className="px-4 py-3">{branch.employees}</td><td className="px-4 py-3">{branch.examAverage}%</td></tr>)}</tbody></table></div>
        </Card>}

        {/* DEEPER ANALYTICS */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ClassDistributionChart />
          <ResultsChart />
          <AdmissionsChart />
          <EmployeeChart />
        </div>
      </div>
    </>
  );
}
