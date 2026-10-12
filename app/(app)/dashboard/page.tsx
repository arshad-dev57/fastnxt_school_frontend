"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, UserX, School, Briefcase, Wallet, TrendingUp, TrendingDown,
  ReceiptText, Plus, FileText, CreditCard, ArrowRight, CalendarDays, Activity,
  Download, UserPlus, Landmark, Building2, Layers, RefreshCw,
} from "lucide-react";
import {
  Avatar, Badge, Card, CardHead, PageHeader, StatCard, rs, cn,
  type IconType, type Tone,
} from "@/components/ui";
import { DashboardSkeleton } from "@/components/skeleton";
import { useBranch } from "@/lib/branch-context";
import { UpcomingMeetingsCard } from "@/components/meetings/upcoming-meetings";
import { useAuth } from "@/lib/auth/auth-context";
import { hasActiveSubscription, SUBSCRIPTION_PATH } from "@/lib/auth/subscription";
import {
  dashboardApi,
  describeApiError,
  type DashboardOverview,
} from "@/lib/auth/api-client";
import { DashboardNotificationFloat } from "@/components/notifications/dashboard-float";
import { DashboardWelcomeBanner } from "@/components/school-stickers";

type Stat = { label: string; value: string | number; Icon: IconType; tone: Tone; sub?: string };

const QUICK: { label: string; href: string; Icon: IconType }[] = [
  { label: "Add Student", href: "/students/new", Icon: UserPlus },
  { label: "New Class", href: "/classes/new", Icon: School },
  { label: "Add Employee", href: "/employees/new", Icon: Briefcase },
  { label: "Create Invoice", href: "/fees/invoices", Icon: FileText },
  { label: "Add Income", href: "/accounts/income", Icon: Landmark },
  { label: "Add Expense", href: "/accounts/expense", Icon: CreditCard },
];

const EMPTY_STATS = {
  totalStudents: 0,
  activeStudents: 0,
  inactiveStudents: 0,
  totalClasses: 0,
  totalEmployees: 0,
  activeEmployees: 0,
  pendingFees: 0,
  collectedFees: 0,
  income: 0,
  expenses: 0,
  paidInvoices: 0,
  overdueInvoices: 0,
};

function MiniBars({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3 p-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="text-[var(--theme-text-muted)]">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-subtle)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, subscription } = useAuth();
  const { availableBranches, currentBranchId } = useBranch();

  /** Dashboard-local campus scope (All + each campus) — does not force-change shell branch. */
  const [scopeId, setScopeId] = useState<string>("all");
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !hasActiveSubscription(subscription)) {
      router.replace(SUBSCRIPTION_PATH);
    }
  }, [ready, subscription, router]);

  // Default scope follows shell once branches are known (only on first align).
  useEffect(() => {
    if (currentBranchId) setScopeId(currentBranchId);
  }, [currentBranchId]);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      const soft = opts?.soft === true;
      if (soft) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const ac = new AbortController();
      try {
        const branchId = scopeId && scopeId !== "all" ? scopeId : "all";
        const res = await dashboardApi.getOverview({ branchId }, ac.signal);
        setData(res);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(describeApiError(err).message);
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [scopeId]
  );

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const branchId = scopeId && scopeId !== "all" ? scopeId : "all";
        const res = await dashboardApi.getOverview({ branchId }, ac.signal);
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled || (err as { name?: string })?.name === "AbortError") return;
        setError(describeApiError(err).message);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [scopeId]);

  const scopeLabel = useMemo(() => {
    if (scopeId === "all") return "All campuses";
    return availableBranches.find((b) => b.id === scopeId)?.name || "Campus";
  }, [scopeId, availableBranches]);

  const stats = data?.stats ?? EMPTY_STATS;
  const scopedStats: Stat[] = [
    { label: "Total Students", value: stats.totalStudents, Icon: Users, tone: "blue", sub: scopeLabel },
    { label: "Active Students", value: stats.activeStudents, Icon: UserCheck, tone: "green", sub: "Currently attending" },
    { label: "Inactive Students", value: stats.inactiveStudents, Icon: UserX, tone: "gray", sub: "Suspended / left" },
    { label: "Total Classes", value: stats.totalClasses, Icon: School, tone: "purple", sub: "Active class sections" },
    { label: "Total Employees", value: stats.totalEmployees, Icon: Briefcase, tone: "purple", sub: `${stats.activeEmployees} active` },
    { label: "Pending Fees", value: rs(stats.pendingFees), Icon: ReceiptText, tone: "orange", sub: "Outstanding balance" },
    { label: "Collected Fees", value: rs(stats.collectedFees), Icon: Wallet, tone: "green", sub: "Payments received" },
    { label: "Expenses", value: rs(stats.expenses), Icon: TrendingDown, tone: "red", sub: scopeId === "all" ? "From ledger" : "Campus fee view" },
    { label: "Income", value: rs(stats.income), Icon: TrendingUp, tone: "blue", sub: scopeId === "all" ? "From ledger" : "Fee collections" },
  ];

  const genderItems = [
    { label: "Male", value: data?.gender.Male ?? 0, color: "var(--theme-info)" },
    { label: "Female", value: data?.gender.Female ?? 0, color: "var(--theme-accent-2)" },
    { label: "Other", value: data?.gender.Other ?? 0, color: "var(--theme-pending)" },
  ];
  const feeItems = [
    { label: "Paid", value: data?.feeStatus?.Paid ?? 0, color: "var(--theme-success)" },
    { label: "Partial", value: data?.feeStatus?.["Partially Paid"] ?? 0, color: "var(--theme-warning)" },
    { label: "Pending", value: data?.feeStatus?.Pending ?? 0, color: "var(--theme-info)" },
    { label: "Overdue", value: data?.feeStatus?.Overdue ?? 0, color: "var(--theme-danger)" },
  ];

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Live operational view — ${scopeLabel}.`}
        actions={
          <>
            <label className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 py-1.5 sm:inline-flex">
              {scopeId === "all" ? (
                <Layers className="h-4 w-4 text-[var(--theme-text-muted)]" />
              ) : (
                <Building2 className="h-4 w-4 text-[var(--theme-text-muted)]" />
              )}
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="max-w-[200px] bg-transparent text-[13px] font-medium outline-none"
                aria-label="Campus scope"
              >
                <option value="all">All campuses</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => load({ soft: true })}
              disabled={refreshing}
              className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex disabled:opacity-60"
            >
              <RefreshCw className={cn("h-[18px] w-[18px]", refreshing && "animate-spin")} /> Refresh
            </button>
            <Link href="/students/print-list" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] md:inline-flex">
              <Download className="h-[18px] w-[18px]" /> Export
            </Link>
            <Link href="/students/new" className="ic-plus-btn inline-flex items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
              <Plus className="ic-plus h-[18px] w-[18px]" /> New Admission
            </Link>
          </>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <DashboardWelcomeBanner
          title={`Welcome back — ${scopeLabel}`}
          subtitle="Campus pulse at a glance: students, staff, fees, and today’s school rhythm."
        />

        {/* Mobile campus dropdown */}
        <label className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2.5 sm:hidden">
          <Building2 className="h-4 w-4 text-[var(--theme-text-muted)]" />
          <select
            value={scopeId}
            onChange={(e) => setScopeId(e.target.value)}
            className="w-full bg-transparent text-[14px] font-medium outline-none"
            aria-label="Campus scope"
          >
            <option value="all">All campuses</option>
            {availableBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <div className="rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}{" "}
            <button type="button" className="underline" onClick={() => load()}>
              Retry
            </button>
          </div>
        )}

        <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", refreshing && "opacity-70")}>
          {scopedStats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} Icon={s.Icon} tone={s.tone} sub={s.sub} />
          ))}
        </div>

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
          <div className="space-y-5 xl:col-span-2">
            <Card pad={false}>
              <CardHead
                title="Recent admissions"
                subtitle="Newest students in this campus scope"
                Icon={UserPlus}
                right={
                  <Link href="/students" className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
              <div className="divide-y divide-[var(--theme-border)]">
                {(data?.recentAdmissions?.length ?? 0) === 0 && (
                  <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">No admissions yet for this scope.</p>
                )}
                {data?.recentAdmissions?.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--theme-hover)]">
                    <Avatar name={st.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{st.name}</p>
                      <p className="truncate text-[12px] text-[var(--theme-text-muted)]">
                        {st.studentId} · {st.cls}-{st.section}
                      </p>
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Card pad={false}>
                <CardHead title="Gender mix" subtitle="Students in scope" Icon={Users} />
                <MiniBars items={genderItems} />
              </Card>
              <Card pad={false}>
                <CardHead title="Fee invoice status" subtitle="Count by status" Icon={ReceiptText} />
                <MiniBars items={feeItems} />
              </Card>
            </div>
          </div>

          <div className="space-y-5">
            <Card pad={false}>
              <CardHead title="Quick actions" Icon={Activity} />
              <div className="grid grid-cols-2 gap-2 p-3">
                {QUICK.map(({ label, href, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex flex-col items-center gap-2 rounded-lg border border-[var(--theme-border)] px-2 py-3 text-center transition-colors hover:bg-[var(--theme-hover)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-active-bg)] text-[var(--theme-primary-hover)]">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-[12px] font-medium leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </Card>

            <UpcomingMeetingsCard scope="admin" viewAllHref="/meetings" />

            <Card pad={false}>
              <CardHead title="Upcoming events" Icon={CalendarDays} />
              <div className="divide-y divide-[var(--theme-border)]">
                {(data?.upcomingEvents?.length ?? 0) === 0 && (
                  <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">No upcoming events.</p>
                )}
                {data?.upcomingEvents?.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{e.title}</p>
                      <p className="text-[12px] text-[var(--theme-text-muted)]">{e.date || "Date TBD"}{e.venue ? ` · ${e.venue}` : ""}</p>
                    </div>
                    <Badge label={e.type || e.status} tone="purple" />
                  </div>
                ))}
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Fee health" Icon={ReceiptText} />
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-lg bg-[var(--theme-success-soft)] p-3">
                  <p className="text-[22px] font-bold text-[var(--theme-success-text)]">{stats.paidInvoices}</p>
                  <p className="text-[12px] text-[var(--theme-success-text)]">Paid invoices</p>
                </div>
                <div className="rounded-lg bg-[var(--theme-danger-soft)] p-3">
                  <p className="text-[22px] font-bold text-[var(--theme-danger-text)]">{stats.overdueInvoices}</p>
                  <p className="text-[12px] text-[var(--theme-danger-text)]">Overdue invoices</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {scopeId === "all" && (data?.branchPerformance?.length ?? 0) > 0 && (
          <Card pad={false}>
            <CardHead
              title="Campus performance"
              subtitle="Active students, staff and fee totals per campus."
              Icon={Landmark}
            />
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-[13px]">
                <thead className="border-y border-[var(--theme-border)] bg-[var(--theme-subtle)] text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">
                  <tr>
                    {["Campus", "Students", "Employees", "Fee collection", "Outstanding"].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {data?.branchPerformance.map((branch) => (
                    <tr key={branch.branchId} className="hover:bg-[var(--theme-hover)]">
                      <td className="px-4 py-3 font-medium">
                        {branch.branchName}
                        <span className="ml-2 text-[11px] text-[var(--theme-text-faint)]">{branch.branchCode}</span>
                      </td>
                      <td className="px-4 py-3">{branch.students.toLocaleString()}</td>
                      <td className="px-4 py-3">{branch.employees.toLocaleString()}</td>
                      <td className="px-4 py-3">{rs(branch.feeCollection)}</td>
                      <td className="px-4 py-3">{rs(branch.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <DashboardNotificationFloat />
    </>
  );
}
