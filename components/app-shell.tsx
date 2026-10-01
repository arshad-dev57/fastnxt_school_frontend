"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, Briefcase, Wallet, BarChart3, LayoutDashboard, School, BookOpen,
  ReceiptText, Users2, ShieldCheck, Settings, Bell, Inbox, UserPlus, Puzzle, Search,
  HelpCircle, Sparkles, ChevronDown, ChevronRight, Plus, PanelLeftClose, Menu, X, LogOut,
} from "lucide-react";
import { Avatar, cn, type IconType } from "./ui";

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
  ] },
  { k: "employees", label: "Employees", Icon: Briefcase, children: [
    { label: "All Employees", href: "/employees" }, { label: "Add New Employee", href: "/employees/new" },
    { label: "Job Letters", href: "/employees/job-letters" },
  ] },
  { k: "accounts", label: "Accounts / Finance", Icon: Wallet, children: [
    { label: "Accounts Dashboard", href: "/accounts" }, { label: "Add Income", href: "/accounts/income" },
    { label: "Add Expense", href: "/accounts/expense" }, { label: "Account Statement", href: "/accounts/statement" },
  ] },
  { k: "fees", label: "Fees", Icon: ReceiptText, children: [
    { label: "Fees Particulars", href: "/fees/particulars" }, { label: "Fee Structure", href: "/fees/structure" },
    { label: "Discount Types", href: "/fees/discounts" }, { label: "Fee Invoices", href: "/fees/invoices" },
  ] },
  { k: "families", label: "Families", Icon: Users2, children: [
    { label: "Manage Families", href: "/families" },
  ] },
  { k: "users", label: "User Management", Icon: ShieldCheck, children: [
    { label: "Manage Login / Accounts", href: "/users" }, { label: "Roles & Permissions", href: "/users/roles" },
  ] },
  { k: "settings", label: "General Settings", Icon: Settings, children: [
    { label: "Institute Profile", href: "/settings/institute" }, { label: "Rules & Regulations", href: "/settings/rules" },
    { label: "Theme & Language", href: "/settings/theme" }, { label: "Account Settings", href: "/settings/account" },
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

const groupActive = (pathname: string, g: NavGroup) =>
  g.href ? pathname === g.href : g.children.some((c) => pathname === c.href);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ students: true, fees: true });

  // sidebar starts closed on tablets/phones (it becomes a drawer there)
  useEffect(() => { if (window.innerWidth < 1024) setSideOpen(false); }, []);

  // auto-expand the group that contains the active route
  useEffect(() => {
    const g = NAV.find((n) => groupActive(pathname, n));
    if (g) setOpenGroups((p) => ({ ...p, [g.k]: true }));
  }, [pathname]);

  const closeOnMobile = () => { if (window.innerWidth < 1024) setSideOpen(false); };
  const toggleGroup = (k: string) => setOpenGroups((p) => ({ ...p, [k]: !p[k] }));

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.pill{transition:filter .15s}.pill:hover{filter:brightness(.92)}@media (prefers-reduced-motion:reduce){*{transition:none!important}}`}</style>

      <div className="app-root flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#292F4C] font-[Figtree,ui-sans-serif,system-ui,sans-serif] text-[#323338] antialiased">
        {/* TOP BAR */}
        <header className="no-print flex h-14 shrink-0 items-center gap-2 px-3 text-white sm:gap-3 sm:px-4">
          <button onClick={() => setSideOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Toggle menu">
            {sideOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="BisonsEduCore360 Logo" className="h-9 w-9" />
            <span className="text-[20px] font-bold">educore<span className="hidden font-normal text-white/80 sm:inline"> 360 school management</span></span>
          </Link>
          <button className="ml-2 hidden items-center gap-2 rounded-md bg-gradient-to-r from-[#6C47FF] to-[#A25DDC] px-3.5 py-2 text-[14px] font-semibold md:flex">
            <Sparkles className="h-4 w-4" /> See plans
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[
              { I: Bell, cls: "" }, { I: Inbox, cls: "hidden sm:flex" }, { I: UserPlus, cls: "hidden md:flex" },
              { I: Puzzle, cls: "hidden md:flex" }, { I: Search, cls: "" }, { I: HelpCircle, cls: "hidden sm:flex" },
            ].map(({ I, cls }, i) => (
              <button key={i} className={`relative h-10 w-10 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white ${cls || "flex"}`}>
                <I className="h-[22px] w-[22px]" />
                {i === 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F62B54] px-1 text-[10px] font-bold">3</span>}
              </button>
            ))}
            <Link href="/settings/account" className="ml-1 sm:ml-2" aria-label="Account">
              <Avatar name="Amara Reyes" size={36} />
            </Link>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {/* ICON RAIL (tablet/desktop) */}
          <nav className="no-print hidden w-16 shrink-0 flex-col items-center gap-1.5 py-2 md:flex">
            {RAIL.map(({ k, Icon, label, href }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={k} href={href} title={label} onClick={closeOnMobile}
                  className={cn("flex h-12 w-12 items-center justify-center rounded-lg transition-colors", active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </Link>
              );
            })}
            <div className="flex-1" />
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-[#6C47FF] text-base font-extrabold text-white">B</div>
          </nav>

          {/* backdrop for drawer */}
          {sideOpen && <div className="no-print fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSideOpen(false)} />}

          {/* WORKSPACE SIDEBAR: drawer < lg, inline >= lg */}
          <aside onClick={(e) => e.stopPropagation()}
            className={cn("no-print z-40 shrink-0 overflow-hidden bg-[#F6F7FB] transition-[width] duration-200 max-lg:fixed max-lg:bottom-16 max-lg:left-0 max-lg:top-14 md:max-lg:bottom-0 md:max-lg:left-16 lg:relative lg:rounded-tl-xl",
              sideOpen ? "w-[288px] max-w-[85vw]" : "w-0")}>
            <div className="flex h-full w-[288px] max-w-[85vw] flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <p className="text-[22px] font-bold">School</p>
                <button onClick={() => setSideOpen(false)} className="flex h-9 w-9 items-center justify-center rounded text-[#676879] hover:bg-[#E6E9EF]" aria-label="Collapse sidebar">
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
              <div className="px-3">
                <button className="flex w-full items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-left shadow-sm ring-1 ring-[#E6E9EF] hover:ring-[#C5C7D0]">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-[#6C47FF] text-[14px] font-bold text-white">B</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">BisonsEduCore360</span>
                  <ChevronDown className="h-5 w-5 text-[#676879]" />
                </button>
              </div>
              <div className="flex gap-2 px-3 pt-3">
                <div className="flex h-10 flex-1 items-center gap-2 rounded border border-[#C5C7D0] bg-white px-2.5 focus-within:border-[#2563EB]">
                  <Search className="h-[18px] w-[18px] text-[#676879]" />
                  <input placeholder="Search" className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#9699A6]" />
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded bg-[#2563EB] text-white hover:bg-[#1D4ED8]" aria-label="Add"><Plus className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1 px-4 text-[13px] font-semibold text-[#676879]">
                <ChevronDown className="h-4 w-4" /> School modules
              </div>
              <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
                {NAV.map((g) => {
                  const gActive = groupActive(pathname, g);
                  if (g.children.length === 0 && g.href) {
                    const active = pathname === g.href;
                    return (
                      <Link key={g.k} href={g.href} onClick={closeOnMobile}
                        className={cn("flex h-10 w-full items-center gap-2.5 rounded px-2.5 text-[15px] transition-colors",
                          active ? "bg-[#DBEAFE] font-medium text-[#1D4ED8]" : "hover:bg-[#E6E9EF]")}>
                        <g.Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{g.label}</span>
                      </Link>
                    );
                  }
                  const open = !!openGroups[g.k];
                  return (
                    <div key={g.k}>
                      <button onClick={() => toggleGroup(g.k)}
                        className={cn("flex h-10 w-full items-center gap-2.5 rounded px-2.5 text-[15px] transition-colors hover:bg-[#E6E9EF]",
                          gActive && !open && "text-[#1D4ED8]")}>
                        <g.Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                        <span className="min-w-0 flex-1 truncate text-left">{g.label}</span>
                        <span className="hidden text-[12px] text-[#9699A6] sm:inline">{g.children.length}</span>
                        <ChevronRight className={cn("h-4 w-4 shrink-0 text-[#9699A6] transition-transform", open && "rotate-90")} />
                      </button>
                      {open && (
                        <div className="mb-1 mt-0.5 space-y-0.5 pl-6">
                          {g.children.map((c) => {
                            const active = pathname === c.href;
                            const danger = c.href === "/logout";
                            return (
                              <Link key={c.href} href={c.href} onClick={closeOnMobile}
                                className={cn("flex h-9 w-full items-center gap-2 rounded px-2.5 text-[14px] transition-colors",
                                  active ? "bg-[#DBEAFE] font-medium text-[#1D4ED8]" : "hover:bg-[#E6E9EF]",
                                  danger && !active && "text-[#DF2F4A]")}>
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
          <main className={cn("relative flex min-w-0 flex-1 flex-col bg-white max-md:rounded-t-xl", !sideOpen && "md:rounded-tl-xl")}>
            {!sideOpen && (
              <button onClick={() => setSideOpen(true)} className="no-print absolute left-0 top-6 z-10 hidden h-8 w-6 items-center justify-center rounded-r bg-white text-[#676879] shadow ring-1 ring-[#E6E9EF] hover:text-[#2563EB] lg:flex" aria-label="Expand sidebar">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <div className="app-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>

        {/* BOTTOM NAV (phones) */}
        <nav className="no-print flex h-16 shrink-0 items-center justify-around border-t border-white/10 bg-[#292F4C] text-white md:hidden">
          {RAIL.map(({ k, Icon, label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={k} href={href} className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px]", active ? "text-white" : "text-white/60")}>
                <Icon className="h-6 w-6" strokeWidth={1.8} /> {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}


