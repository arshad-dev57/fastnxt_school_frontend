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
  DASHBOARD_STATS as S, RECENT_ADMISSIONS, RECENT_ACTIVITIES, UPCOMING_EVENTS,
  ENROLLMENT_TREND, FEE_COLLECTION_TREND, CLASS_ROWS, INVOICES, SCHOOL,
} from "@/lib/mock-data";

type Stat = { label: string; value: string | number; Icon: IconType; tone: Tone; sub?: string };

const STATS: Stat[] = [
  { label: "Total Students", value: S.totalStudents, Icon: Users, tone: "blue", sub: "Enrolled for 2025-2026" },
  { label: "Active Students", value: S.activeStudents, Icon: UserCheck, tone: "green", sub: "Currently attending" },
  { label: "Inactive Students", value: S.inactiveStudents, Icon: UserX, tone: "gray", sub: "Suspended / left" },
  { label: "Total Classes", value: S.totalClasses, Icon: School, tone: "purple", sub: "Nursery to Grade 10" },
  { label: "Total Employees", value: S.totalEmployees, Icon: Briefcase, tone: "purple", sub: "Teaching & non-teaching" },
  { label: "Pending Fees", value: rs(S.pendingFees), Icon: ReceiptText, tone: "orange", sub: "Across 43 invoices" },
  { label: "Collected Fees", value: rs(S.collectedFees), Icon: Wallet, tone: "green", sub: "January 2026" },
  { label: "Expenses", value: rs(S.expenses), Icon: TrendingDown, tone: "red", sub: "January 2026" },
  { label: "Income", value: rs(S.income), Icon: TrendingUp, tone: "blue", sub: "Year to date" },
];

const QUICK: { label: string; href: string; Icon: IconType }[] = [
  { label: "Add Student", href: "/students/new", Icon: UserPlus },
  { label: "New Class", href: "/classes/new", Icon: School },
  { label: "Add Employee", href: "/employees/new", Icon: Briefcase },
  { label: "Create Invoice", href: "/fees/invoices", Icon: FileText },
  { label: "Add Income", href: "/accounts/income", Icon: Landmark },
  { label: "Add Expense", href: "/accounts/expense", Icon: CreditCard },
];

const STATUS_DOT: Record<string, string> = {
  green: "#00C875", blue: "#579BFC", purple: "#A25DDC", orange: "#FDAB3D", red: "#DF2F4A", gray: "#C4C4C4",
};

function BarChart({ data, color = "#2563EB", format }: { data: { label: string; value: number }[]; color?: string; format?: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end gap-2 sm:gap-4">
      {data.map((d) => (
        <div key={d.label} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="whitespace-nowrap text-[11px] text-[#9699A6]">{format ? format(d.value) : d.value}</span>
          <div className="flex w-full flex-1 items-end">
            <div className="w-full rounded-t-md transition-all group-hover:opacity-90" style={{ height: `${(d.value / max) * 100}%`, background: color, minHeight: 6 }} />
          </div>
          <span className="text-[12px] text-[#676879]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const topClasses = [...CLASS_ROWS].sort((a, b) => b.students - a.students).slice(0, 6);
  const maxClass = Math.max(...topClasses.map((c) => c.students));
  const overdue = INVOICES.filter((i) => i.status === "Overdue").length;
  const paid = INVOICES.filter((i) => i.status === "Paid").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back — here is what is happening at ${SCHOOL.shortName} today.`}
        actions={
          <>
            <Link href="/students/print-list" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] sm:inline-flex">
              <Download className="h-[18px] w-[18px]" /> Export
            </Link>
            <Link href="/students/new" className="inline-flex items-center gap-2 rounded bg-[#2563EB] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[#1D4ED8]">
              <Plus className="h-[18px] w-[18px]" /> New Admission
            </Link>
          </>
        }
      />

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATS.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} Icon={s.Icon} tone={s.tone} sub={s.sub} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-5 xl:col-span-2">
            <Card pad={false}>
              <CardHead title="Student statistics" subtitle="Enrollment trend across recent months" Icon={TrendingUp}
                right={<Badge label="+3.2% MoM" tone="green" />} />
              <div className="p-4">
                <BarChart data={ENROLLMENT_TREND} color="#2563EB" />
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Fee collection" subtitle="Collected amount over the last five months" Icon={Wallet}
                right={<span className="text-[13px] font-semibold text-[#037F4C]">{rs(S.collectedFees)} this month</span>} />
              <div className="p-4">
                <BarChart data={FEE_COLLECTION_TREND} color="#00C875" format={(n) => `${Math.round(n / 1000)}k`} />
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Recent admissions" subtitle="Newest students added to the school" Icon={UserPlus}
                right={<Link href="/students" className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2563EB] hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>} />
              <div className="divide-y divide-[#E6E9EF]">
                {RECENT_ADMISSIONS.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F6F8]">
                    <Avatar name={st.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{st.name}</p>
                      <p className="truncate text-[12px] text-[#676879]">{st.id} · {st.cls}-{st.section}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[12px] text-[#676879]">Guardian</p>
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
                    className="flex flex-col items-center gap-2 rounded-lg border border-[#E6E9EF] px-2 py-3 text-center transition-colors hover:bg-[#F5F6F8]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1D4ED8]"><Icon className="h-[18px] w-[18px]" /></span>
                    <span className="text-[12px] font-medium leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Class distribution" subtitle="Students per class" Icon={School} />
              <div className="space-y-3 p-4">
                {topClasses.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="text-[#676879]">{c.students}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#E6E9EF]">
                      <div className="h-full rounded-full bg-[#6C47FF]" style={{ width: `${(c.students / maxClass) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Upcoming events" Icon={CalendarDays} />
              <div className="divide-y divide-[#E6E9EF]">
                {UPCOMING_EVENTS.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F1F4] text-[#676879]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{e.title}</p>
                      <p className="text-[12px] text-[#676879]">{e.date}</p>
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
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[a.tone] ?? "#9699A6" }} />
                      {i < RECENT_ACTIVITIES.length - 1 && <span className="mt-1 w-px flex-1 bg-[#E6E9EF]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-[11px] text-[#9699A6]">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card pad={false}>
              <CardHead title="Fee health" Icon={ReceiptText} />
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-lg bg-[#D6F5E3] p-3">
                  <p className="text-[22px] font-bold text-[#037F4C]">{paid}</p>
                  <p className="text-[12px] text-[#037F4C]">Paid invoices</p>
                </div>
                <div className="rounded-lg bg-[#FDD9DF] p-3">
                  <p className="text-[22px] font-bold text-[#C0233B]">{overdue}</p>
                  <p className="text-[12px] text-[#C0233B]">Overdue invoices</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

