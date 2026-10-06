"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, Briefcase, Wallet, BarChart3, LayoutDashboard, School, BookOpen,
  ReceiptText, Users2, ShieldCheck, Settings, Bell, Inbox, UserPlus, Puzzle, Search,
  CircleHelp, Sparkles, ChevronDown, ChevronRight, Plus, PanelLeftClose, Menu, X, LogOut,
  CalendarCheck, MessageSquare, CheckCheck, CalendarClock, GraduationCap, CalendarOff,
  Megaphone, Bus, Building2, HeartPulse, ShieldAlert, Boxes, ListChecks, MessageSquareWarning,
  NotebookPen, BedDouble, DoorOpen, TrendingUp, Video, Clock, AlertTriangle,
} from "lucide-react";
import { Avatar, cn, TONE, Tooltip, type IconType } from "./ui";
import { IconButton } from "./icons";
import ThemeSwitcher from "./theme-switcher";
import PanelSwitcher from "./panel-switcher";
import FloatingAIAssistant from "./ai-assistant/FloatingAIAssistant";
import { NOTIFICATIONS, type NotificationRow } from "@/lib/mock-data";
import { useBranch } from "@/lib/branch-context";
import { useAuth } from "@/lib/auth/auth-context";

type NavChild = { label: string; href: string };
type NavGroup = { k: string; label: string; Icon: IconType; href?: string; children: NavChild[] };

const NAV: NavGroup[] = [
  { k: "dashboard", label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard", children: [] },
  { k: "classes", label: "Classes", Icon: School, children: [
    { label: "All Classes", href: "/classes" }, { label: "New Class", href: "/classes/new" },
  ] },
  { k: "subjects", label: "Subjects", Icon: BookOpen, children: [
    { label: "All Subjects", href: "/subjects" }, { label: "Classes with Subjects", href: "/subjects/classes" },
    { label: "Assign Subjects", href: "/subjects/assign" },
  ] },
  { k: "students", label: "Students", Icon: Users, children: [
    { label: "All Students", href: "/students" }, { label: "Add New Student", href: "/students/new" },
    { label: "Admission Letters", href: "/students/admission-letters" }, { label: "Print Basic List", href: "/students/print-list" },
    { label: "Promote Students", href: "/students/promote" }, { label: "Student ID Cards", href: "/students/id-cards" },
    { label: "Certificates & Documents", href: "/certificates" },
  ] },
  { k: "employees", label: "Employees", Icon: Briefcase, children: [
    { label: "All Employees", href: "/employees" }, { label: "Add New Employee", href: "/employees/new" },
    { label: "Job Letters", href: "/employees/job-letters" },
  ] },
  { k: "accounts", label: "Accounting", Icon: Wallet, children: [
    { label: "Dashboard", href: "/accounts" },
    { label: "Income & Expense", href: "/accounts/income" },
    { label: "Add Expense", href: "/accounts/expense" },
    { label: "Journal Entries", href: "/accounts/journal-entries" },
    { label: "Receipt Vouchers", href: "/accounts/receipt-vouchers" },
    { label: "Payment Vouchers", href: "/accounts/payment-vouchers" },
    { label: "Chart of Accounts", href: "/accounts/chart-of-accounts" },
    { label: "Account Statement", href: "/accounts/statement" },
    { label: "General Ledger", href: "/accounts/general-ledger" },
    { label: "Cash & Bank", href: "/accounts/cash-bank" },
    { label: "Bank Reconciliation", href: "/accounts/bank-reconciliation" },
    { label: "Fee Receivables", href: "/accounts/fee-receivables" },
    { label: "Trial Balance", href: "/accounts/trial-balance" },
    { label: "Profit & Loss", href: "/accounts/profit-loss" },
    { label: "Balance Sheet", href: "/accounts/balance-sheet" },
    { label: "Cash Flow", href: "/accounts/cash-flow" },
    { label: "Accounting Reports", href: "/accounts/reports" },
    { label: "Budgets", href: "/accounts/budgets" },
  ] },
  { k: "fees", label: "Fees", Icon: ReceiptText, children: [
    { label: "Fees Particulars", href: "/fees/particulars" }, { label: "Fee Structure", href: "/fees/structure" },
    { label: "Discount Types", href: "/fees/discounts" }, { label: "Fee Invoices", href: "/fees/invoices" },
  ] },
  { k: "families", label: "Families", Icon: Users2, children: [
    { label: "Manage Families", href: "/families" },
  ] },
  { k: "admissions", label: "Admissions", Icon: UserPlus, children: [
    { label: "Admission Pipeline", href: "/admissions" }, { label: "Front Office / Visitors", href: "/front-office" },
  ] },
  { k: "attendance", label: "Attendance", Icon: CalendarCheck, children: [
    { label: "Student Attendance", href: "/attendance" }, { label: "Staff Attendance", href: "/attendance/employees" },
  ] },
  { k: "timetable", label: "Timetable", Icon: CalendarClock, children: [
    { label: "Class / Teacher / Room", href: "/timetable" },
  ] },
  { k: "exams", label: "Exams & Results", Icon: GraduationCap, children: [
    { label: "All Exams", href: "/exams" }, { label: "Date Sheet", href: "/exams/schedule" },
    { label: "Results", href: "/results" }, { label: "Homework / LMS", href: "/homework" },
  ] },
  { k: "recruitment", label: "Recruitment", Icon: Briefcase, children: [
    { label: "Job Openings", href: "/recruitment" }, { label: "Candidates", href: "/recruitment/candidates" },
  ] },
  { k: "leave", label: "Leave", Icon: CalendarOff, children: [
    { label: "Leave Requests", href: "/leave" },
  ] },
  { k: "payroll", label: "Payroll", Icon: Wallet, children: [
    { label: "Salary Register", href: "/payroll" },
  ] },
  { k: "library", label: "Library", Icon: BookOpen, children: [
    { label: "Catalogue", href: "/library" }, { label: "Issue & Return", href: "/library/issue" },
  ] },
  { k: "transport", label: "Transport", Icon: Bus, children: [
    { label: "Fleet", href: "/transport" }, { label: "Routes", href: "/transport/routes" },
  ] },
  { k: "hostel", label: "Hostel", Icon: Building2, children: [
    { label: "Rooms & Occupancy", href: "/hostel" },
  ] },
  { k: "health", label: "Health", Icon: HeartPulse, children: [
    { label: "Medical Records", href: "/health" },
  ] },
  { k: "discipline", label: "Discipline", Icon: ShieldAlert, children: [
    { label: "Incidents", href: "/discipline" },
  ] },
  { k: "inventory", label: "Inventory & Assets", Icon: Boxes, children: [
    { label: "Inventory", href: "/inventory" }, { label: "Assets", href: "/assets" },
  ] },
  { k: "communication", label: "Communication", Icon: Megaphone, children: [
    { label: "Notices", href: "/communication" }, { label: "Events", href: "/events" },
    { label: "Meetings", href: "/meetings" }, { label: "Schedule Meeting", href: "/meetings/new" },
  ] },
  { k: "tasks", label: "Tasks", Icon: ListChecks, children: [
    { label: "Task Board", href: "/tasks" },
  ] },
  { k: "complaints", label: "Complaints", Icon: MessageSquareWarning, children: [
    { label: "Tickets", href: "/complaints" },
  ] },
  { k: "reports", label: "Reports", Icon: BarChart3, children: [
    { label: "Reports Center", href: "/reports" }, { label: "Branch Performance", href: "/reports/branch-performance" },
  ] },
  { k: "users", label: "User Management", Icon: ShieldCheck, children: [
    { label: "Manage Login / Accounts", href: "/users" }, { label: "Roles & Permissions", href: "/users/roles" },
  ] },
  { k: "settings", label: "General Settings", Icon: Settings, children: [
    { label: "Institute Profile", href: "/settings/institute" }, { label: "Branches & Campuses", href: "/settings/branches" }, { label: "Rules & Regulations", href: "/settings/rules" },
    { label: "Theme & Language", href: "/settings/theme" }, { label: "Account Settings", href: "/settings/account" },
    { label: "Audit Log", href: "/audit" },
    { label: "Logout", href: "/logout" },
  ] },
];

const RAIL = [
  { k: "dashboard", label: "Dashboard", Icon: Home, href: "/dashboard" },
  { k: "students", label: "Students", Icon: Users, href: "/students" },
  { k: "employees", label: "Employees", Icon: Briefcase, href: "/employees" },
  { k: "fees", label: "Fees", Icon: Wallet, href: "/fees/invoices" },
  { k: "accounts", label: "Accounts", Icon: BarChart3, href: "/accounts" },
];

/* Icon-only sidebar rail (tablet + desktop). Grouped so it stays scannable,
   and scrollable so every module is reachable on shorter screens. */
type RailItem = { k: string; label: string; Icon: IconType; href: string };
type RailGroup = { label: string; items: RailItem[] };

const ICON_RAIL: RailGroup[] = [
  { label: "Overview", items: [
    { k: "dashboard", label: "Dashboard", Icon: Home, href: "/dashboard" },
    { k: "students", label: "Students", Icon: Users, href: "/students" },
    { k: "employees", label: "Employees", Icon: Briefcase, href: "/employees" },
    { k: "fees", label: "Fees", Icon: Wallet, href: "/fees/invoices" },
    { k: "accounts", label: "Accounts", Icon: BarChart3, href: "/accounts" },
  ] },
  { label: "Academics", items: [
    { k: "admissions", label: "Admissions", Icon: UserPlus, href: "/admissions" },
    { k: "attendance", label: "Attendance", Icon: CalendarCheck, href: "/attendance" },
    { k: "timetable", label: "Timetable", Icon: CalendarClock, href: "/timetable" },
    { k: "classes", label: "Classes", Icon: School, href: "/classes" },
    { k: "exams", label: "Exams & Results", Icon: GraduationCap, href: "/exams" },
    { k: "homework", label: "Homework / LMS", Icon: NotebookPen, href: "/homework" },
  ] },
  { label: "Operations", items: [
    { k: "library", label: "Library", Icon: BookOpen, href: "/library" },
    { k: "transport", label: "Transport", Icon: Bus, href: "/transport" },
    { k: "hostel", label: "Hostel", Icon: BedDouble, href: "/hostel" },
    { k: "inventory", label: "Inventory", Icon: Boxes, href: "/inventory" },
    { k: "frontoffice", label: "Front Office", Icon: DoorOpen, href: "/front-office" },
    { k: "health", label: "Health", Icon: HeartPulse, href: "/health" },
  ] },
  { label: "Manage", items: [
    { k: "communication", label: "Communication", Icon: Megaphone, href: "/communication" },
    { k: "meetings", label: "Meetings", Icon: Video, href: "/meetings" },
    { k: "tasks", label: "Tasks", Icon: ListChecks, href: "/tasks" },
    { k: "reports", label: "Reports", Icon: TrendingUp, href: "/reports" },
    { k: "settings", label: "Settings", Icon: Settings, href: "/settings/branches" },
  ] },
];

/* The rail keeps 8 module icons permanently visible; everything else lives
   behind the "More" toggle so the strip never overflows on a laptop screen. */
const RAIL_PRIMARY_COUNT = 8;

const RAIL_PRIMARY: RailItem[] = ICON_RAIL.flatMap((g) => g.items).slice(0, RAIL_PRIMARY_COUNT);

const RAIL_MORE: RailGroup[] = (() => {
  const rest: RailGroup[] = [];
  let seen = 0;
  for (const group of ICON_RAIL) {
    const skip = Math.max(0, RAIL_PRIMARY_COUNT - seen);
    const items = group.items.slice(skip);
    seen += group.items.length;
    if (items.length) rest.push({ label: group.label, items });
  }
  return rest;
})();

const groupActive = (pathname: string, g: NavGroup) =>
  g.href ? pathname === g.href : g.children.some((c) => pathname === c.href);

const NOTIF_ICON: Record<NotificationRow["icon"], IconType> = {
  user: UserPlus, fee: Wallet, invoice: ReceiptText, calendar: CalendarCheck, staff: Briefcase, chat: MessageSquare,
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ students: true, fees: true });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>(NOTIFICATIONS);
  const unread = notifs.filter((n) => !n.read).length;
  const { currentBranchId, currentBranch, userBranches, isSuperAdmin, setCurrentBranch } = useBranch();
  const { subscription, ready, user } = useAuth();
  const [branchOpen, setBranchOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const closeOnMobile = () => { if (window.innerWidth < 1024) setSideOpen(false); };

  /* One rail icon row — shared by the 8 visible shortcuts and the expanded list. */
  const railLink = ({ k, Icon, label, href }: RailItem) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link key={k} href={href} onClick={closeOnMobile}
        className={cn("group/ic ic-nav relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors", active ? "ic-nav-active bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
        <Icon className="ic-hover h-[21px] w-[21px]" strokeWidth={1.8} />
        <Tooltip label={label} side="right" />
      </Link>
    );
  };
  const toggleGroup = (k: string) => setOpenGroups((p) => ({ ...p, [k]: !p[k] }));
  const markRead = (id: number) => setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifs((p) => p.map((n) => ({ ...n, read: true })));

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.pill{transition:filter .15s}.pill:hover{filter:brightness(.92)}@media (prefers-reduced-motion:reduce){*{transition:none!important}}`}</style>

      <div className="app-root flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--theme-chrome)] font-[Figtree,ui-sans-serif,system-ui,sans-serif] text-[var(--theme-text)] antialiased">
        {/* TOP BAR */}
        <header className="no-print flex h-14 shrink-0 items-center gap-2 px-3 text-white sm:gap-3 sm:px-4">
          <button onClick={() => setSideOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Toggle menu">
            {sideOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="BisonsEduCore360 Logo" className="h-9 w-9" />
            <span className="text-[20px] font-bold">educore<span className="hidden font-normal text-white/80 sm:inline"> 360 school management</span></span>
          </Link>
          {ready && subscription && (
            <div className="ml-2 hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 md:flex">
              {subscription.isTrial && <Clock className="h-4 w-4 text-yellow-300" />}
              {!subscription.active && subscription.isExpired && <AlertTriangle className="h-4 w-4 text-red-300" />}
              <span className="text-[13px] font-medium">
                {subscription.plan}
                {subscription.daysRemaining > 0 && (
                  <span className="ml-1 text-white/70">
                    · {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? "s" : ""} left
                  </span>
                )}
              </span>
            </div>
          )}
          <button className="ml-2 hidden items-center gap-2 rounded-md bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] px-3.5 py-2 text-[14px] font-semibold md:flex">
            <Sparkles className="h-4 w-4" /> See plans
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* PANEL SWITCHER */}
            <PanelSwitcher />

            {/* NOTIFICATIONS */}
            <div className="relative z-50">
              <IconButton Icon={Bell} label="Notifications" ariaExpanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)} active={notifOpen}
                badge={unread} shake={unread > 0} shakeKey={unread} />

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-black/10">
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-semibold">Notifications</p>
                        <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
                      </div>
                      <button onClick={markAllRead} disabled={unread === 0}
                        className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)] disabled:cursor-not-allowed disabled:text-[var(--theme-text-faint)] disabled:hover:bg-transparent">
                        <CheckCheck className="h-4 w-4" /> Mark all read
                      </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {notifs.length === 0 && (
                        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-subtle)] text-[var(--theme-text-faint)]"><Bell className="h-6 w-6" /></span>
                          <p className="text-[15px] font-semibold">No notifications</p>
                          <p className="text-[13px] text-[var(--theme-text-muted)]">You have no notifications right now.</p>
                        </div>
                      )}
                      {notifs.map((n) => {
                        const NIcon = NOTIF_ICON[n.icon];
                        const t = TONE[n.tone];
                        return (
                          <button key={n.id} onClick={() => markRead(n.id)}
                            className={cn("flex w-full items-start gap-3 border-b border-[var(--theme-border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]", !n.read && "bg-[var(--theme-info-soft)]")}>
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: t.bg, color: t.fg }}>
                              <NIcon className="h-[18px] w-[18px]" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start gap-2">
                                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{n.title}</span>
                                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--theme-primary)]" />}
                              </span>
                              <span className="mt-0.5 block text-[13px] leading-snug text-[var(--theme-text-muted)]">{n.message}</span>
                              <span className="mt-1 block text-[12px] text-[var(--theme-text-faint)]">{n.time}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <Link href="/settings/account" onClick={() => setNotifOpen(false)}
                      className="block border-t border-[var(--theme-border)] px-4 py-3 text-center text-[13px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)]">
                      Notification settings
                    </Link>
                  </div>
                </>
              )}
            </div>

            <ThemeSwitcher />

            <IconButton Icon={Inbox} label="Inbox" className="max-sm:hidden" />
            <IconButton Icon={UserPlus} label="Invite" className="max-md:hidden" />
            <IconButton Icon={Puzzle} label="Apps" className="max-md:hidden" />
            <IconButton Icon={Search} label="Search" />
            <IconButton Icon={CircleHelp} label="Help" className="max-sm:hidden" />
            <Link href="/settings/account" className="ml-1 sm:ml-2" aria-label="Account">
              <Avatar name={user?.name || "User"} size={36} />
            </Link>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {/* ICON RAIL (tablet/desktop) — 8 shortcuts + "more" toggle */}
          <nav aria-label="Module shortcuts" className="no-print hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto py-2 md:flex">
            {RAIL_PRIMARY.map(railLink)}

            <button type="button" onClick={() => setRailOpen((o) => !o)} aria-expanded={railOpen}
              aria-label={railOpen ? "Show fewer modules" : "Show more modules"}
              className={cn("group/ic ic-nav relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                railOpen ? "ic-nav-active bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
              {railOpen ? <ChevronDown className="ic-hover h-[21px] w-[21px]" strokeWidth={1.8} /> : <Plus className="ic-plus h-[21px] w-[21px]" strokeWidth={1.8} />}
              <Tooltip label={railOpen ? "Show less" : `More modules (${RAIL_MORE.reduce((n, g) => n + g.items.length, 0)})`} side="right" />
            </button>

            {railOpen && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="my-1.5 h-px w-7 shrink-0 bg-white/15" />
                {RAIL_MORE.map((group) => (
                  <div key={group.label} className="flex flex-col items-center gap-1.5">
                    {group.items.map(railLink)}
                    <span className="my-1.5 h-px w-7 shrink-0 bg-white/15" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1" />
            <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--theme-accent)] text-base font-extrabold text-white">B</div>
          </nav>

          {/* backdrop for drawer */}
          {sideOpen && <div className="no-print fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSideOpen(false)} />}

          {/* WORKSPACE SIDEBAR: drawer < lg, inline >= lg */}
          <aside onClick={(e) => e.stopPropagation()}
            className={cn("no-print z-40 shrink-0 overflow-hidden bg-[var(--theme-sidebar)] transition-[width] duration-200 max-lg:fixed max-lg:bottom-16 max-lg:left-0 max-lg:top-14 md:max-lg:bottom-0 md:max-lg:left-16 lg:relative lg:rounded-tl-xl",
              sideOpen ? "w-[288px] max-w-[85vw]" : "w-0")}>
            <div className="flex h-full w-[288px] max-w-[85vw] flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <p className="text-[22px] font-bold">School</p>
                <button onClick={() => setSideOpen(false)} className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]" aria-label="Collapse sidebar">
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
              <div className="relative px-3">
                <button onClick={() => setBranchOpen((open) => !open)} aria-expanded={branchOpen} className="flex w-full items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-2.5 text-left shadow-sm ring-1 ring-[var(--theme-border)] hover:ring-[var(--theme-border-strong)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--theme-accent)] text-[14px] font-bold text-white">B</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">BisonsEduCore360</span><span className="block truncate text-[11px] text-[var(--theme-text-muted)]">Campus: {currentBranch?.name ?? "All Branches"}</span></span>
                  <ChevronDown className="h-5 w-5 text-[var(--theme-text-muted)]" />
                </button>
                {branchOpen && <><button aria-label="Close campus selector" className="fixed inset-0 z-30 cursor-default" onClick={() => setBranchOpen(false)} /><div className="absolute left-3 right-3 top-full z-40 mt-2 overflow-hidden rounded-lg bg-[var(--theme-surface)] p-1.5 shadow-xl ring-1 ring-[var(--theme-border)]">
                  {isSuperAdmin() && <button onClick={() => { setCurrentBranch("all"); setBranchOpen(false); }} className={cn("flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px]", currentBranchId === "all" ? "bg-[var(--theme-active-bg)] font-semibold text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-hover)]")}><span className="h-2 w-2 rounded-full bg-[var(--theme-primary)]" />All Branches</button>}
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-faint)]">Available campuses</p>
                  {userBranches.map((branch) => <button key={branch.id} onClick={() => { setCurrentBranch(branch.id); setBranchOpen(false); }} className={cn("flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px]", currentBranchId === branch.id ? "bg-[var(--theme-active-bg)] font-semibold text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-hover)]")}><span className="h-2 w-2 rounded-full bg-[var(--theme-success)]" /><span className="min-w-0 flex-1 truncate">{branch.name}</span><span className="text-[11px] text-[var(--theme-text-faint)]">{branch.code}</span></button>)}
                  {isSuperAdmin() && <Link href="/settings/branches" onClick={() => setBranchOpen(false)} className="mt-1 block border-t border-[var(--theme-border)] px-2.5 py-2 text-[12px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)]">Manage campuses</Link>}
                </div></>}
              </div>
              <div className="flex gap-2 px-3 pt-3">
                <div className="flex h-10 flex-1 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 focus-within:border-[var(--theme-primary)]">
                  <Search className="h-[18px] w-[18px] text-[var(--theme-text-muted)]" />
                  <input placeholder="Search" className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--theme-text-faint)]" />
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]" aria-label="Add"><Plus className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1 px-4 text-[13px] font-semibold text-[var(--theme-text-muted)]">
                <ChevronDown className="h-4 w-4" /> School modules
              </div>
              <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
                {NAV.map((g) => {
                  const gActive = groupActive(pathname, g);
                  if (g.children.length === 0 && g.href) {
                    const active = pathname === g.href;
                    return (
                      <Link key={g.k} href={g.href} onClick={closeOnMobile}
                        className={cn("ic-nav flex h-10 w-full items-center gap-2.5 rounded px-2.5 text-[15px] transition-colors",
                          active ? "ic-nav-active bg-[var(--theme-active-bg)] font-medium text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-border)]")}>
                        <g.Icon className="ic-hover h-5 w-5 shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{g.label}</span>
                      </Link>
                    );
                  }
                  // The active module stays expanded when navigation changes;
                  // manually opened modules retain their own state.
                  const open = !!openGroups[g.k] || gActive;
                  return (
                    <div key={g.k}>
                      <button onClick={() => toggleGroup(g.k)}
                        className={cn("ic-nav flex h-10 w-full items-center gap-2.5 rounded px-2.5 text-[15px] transition-colors hover:bg-[var(--theme-border)]",
                          gActive && !open && "ic-nav-active text-[var(--theme-primary-hover)]")}>
                        <g.Icon className="ic-hover h-5 w-5 shrink-0" strokeWidth={1.8} />
                        <span className="min-w-0 flex-1 truncate text-left">{g.label}</span>
                        <span className="hidden text-[12px] text-[var(--theme-text-faint)] sm:inline">{g.children.length}</span>
                        <ChevronRight className={cn("h-4 w-4 shrink-0 text-[var(--theme-text-faint)] transition-transform", open && "rotate-90")} />
                      </button>
                      {open && (
                        <div className="mb-1 mt-0.5 space-y-0.5 pl-6">
                          {g.children.map((c) => {
                            const active = pathname === c.href;
                            const danger = c.href === "/logout";
                            return (
                              <Link key={c.href} href={c.href} onClick={closeOnMobile}
                                className={cn("flex h-9 w-full items-center gap-2 rounded px-2.5 text-[14px] transition-colors",
                                  active ? "bg-[var(--theme-active-bg)] font-medium text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-border)]",
                                  danger && !active && "text-[var(--theme-danger)]")}>
                                {danger && <LogOut className="h-4 w-4 shrink-0" />}
                                <span className="truncate">{c.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className={cn("relative flex min-w-0 flex-1 flex-col bg-[var(--theme-surface)] max-md:rounded-t-xl", !sideOpen && "md:rounded-tl-xl")}>
            {!sideOpen && (
              <button onClick={() => setSideOpen(true)} className="no-print absolute left-0 top-6 z-10 hidden h-8 w-6 items-center justify-center rounded-r bg-[var(--theme-surface)] text-[var(--theme-text-muted)] shadow ring-1 ring-[var(--theme-border)] hover:text-[var(--theme-primary)] lg:flex" aria-label="Expand sidebar">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <div className="app-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>

        {/* BOTTOM NAV (phones) */}
        <nav className="no-print flex h-16 shrink-0 items-center justify-around border-t border-white/10 bg-[var(--theme-chrome)] text-white md:hidden">
          {RAIL.map(({ k, Icon, label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={k} href={href} className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px]", active ? "text-white" : "text-white/60")}>
                <Icon className="h-6 w-6" strokeWidth={1.8} /> {label}
              </Link>
            );
          })}
        </nav>

        {/* GLOBAL FLOATING AI ASSISTANT (present on every page) */}
        <FloatingAIAssistant />
      </div>
    </>
  );
}
