"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles, ChevronDown, ChevronRight, Plus, PanelLeftClose, Menu, X, LogOut,
  Clock, AlertTriangle,
} from "lucide-react";
import { cn, Tooltip } from "./ui";
import { IconButton } from "./icons";
import ThemeSwitcher from "./theme-switcher";
import ProfileMenu from "./profile-menu";
import FloatingAIAssistant from "./ai-assistant/FloatingAIAssistant";
import { HeaderPageSearch, SidebarNavSearch, matchesNavQuery, pagesFromNavGroups } from "./page-search";
import { SUBSCRIPTION_PATH } from "@/lib/auth/subscription";
import { useBranch } from "@/lib/branch-context";
import { useAuth } from "@/lib/auth/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SCHOOL_HEADER_IMAGES } from "@/components/school-stickers";
import {
  ADMIN_ICON_RAIL,
  ADMIN_NAV,
  filterAdminNav,
  filterAdminRail,
  type AdminNavGroup,
  type AdminRailItem,
} from "@/lib/admin-nav";

/* The rail keeps 8 module icons permanently visible; everything else lives
   behind the "More" toggle so the strip never overflows on a laptop screen. */
const RAIL_PRIMARY_COUNT = 8;

const groupActive = (pathname: string, g: AdminNavGroup) =>
  g.href ? pathname === g.href : g.children.some((c) => pathname === c.href);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ admissions_students: true, students: true, fees: true });
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const searchAnchorRef = useRef<HTMLSpanElement>(null);
  const { currentBranchId, currentBranch, userBranches, isSuperAdmin, setCurrentBranch, can } = useBranch();
  const { subscription, ready, user, school } = useAuth();
  const [branchOpen, setBranchOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const roleNav = useMemo(() => filterAdminNav(ADMIN_NAV, can), [can]);
  const roleRail = useMemo(() => filterAdminRail(ADMIN_ICON_RAIL, can), [can]);
  const railPrimary = useMemo(
    () => roleRail.flatMap((g) => g.items).slice(0, RAIL_PRIMARY_COUNT),
    [roleRail],
  );
  const railMore = useMemo(() => {
    const rest: typeof roleRail = [];
    let seen = 0;
    for (const group of roleRail) {
      const skip = Math.max(0, RAIL_PRIMARY_COUNT - seen);
      const items = group.items.slice(skip);
      seen += group.items.length;
      if (items.length) rest.push({ label: group.label, items });
    }
    return rest;
  }, [roleRail]);

  const searchablePages = useMemo(
    () => [
      ...pagesFromNavGroups(roleNav),
      { label: "Subscription & Plans", href: SUBSCRIPTION_PATH, group: "Account" },
    ],
    [roleNav],
  );
  const filteredNav = useMemo(() => {
    const q = navQuery.trim();
    if (!q) return roleNav;
    return roleNav.map((g) => {
      if (g.children.length === 0) {
        return matchesNavQuery(q, g.label, g.href) ? g : null;
      }
      const children = g.children.filter((c) => matchesNavQuery(q, c.label, c.href, g.label));
      if (children.length === 0 && !matchesNavQuery(q, g.label)) return null;
      return { ...g, children: children.length ? children : g.children };
    }).filter(Boolean) as AdminNavGroup[];
  }, [navQuery, roleNav]);

  const closeOnMobile = () => { if (window.innerWidth < 1024) setSideOpen(false); };

  const railLink = ({ k, Icon, label, href }: AdminRailItem) => {
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
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 max-w-[320px]">
            {school?.logoUrl || user?.school?.logoUrl ? (
              <img
                src={school?.logoUrl || user?.school?.logoUrl || ""}
                alt={school?.schoolName || user?.school?.name || "School"}
                className="h-9 w-9 shrink-0 rounded-md bg-white/10 object-contain p-0.5"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-[15px] font-bold text-white">
                {(school?.shortName || school?.schoolName || user?.school?.shortName || user?.school?.name || "S")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[15px] font-bold leading-tight text-white">
                {school?.schoolName || user?.school?.name || "School"}
              </span>
              <span className="truncate text-[11px] font-medium text-white/80">
                {currentBranch ? `${currentBranch.name}` : user?.branch?.name ? `${user.branch.name}` : "Main Campus"}
              </span>
            </div>
          </Link>
          {ready && subscription && (
            <Link
              href={SUBSCRIPTION_PATH}
              className="ml-2 hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/15 md:flex"
            >
              {subscription.isTrial && <Clock className="h-4 w-4 text-yellow-300" />}
              {!subscription.active && subscription.isExpired && <AlertTriangle className="h-4 w-4 text-red-300" />}
              <span className="text-[13px] font-medium">
                {subscription.isTrial ? "Trial" : subscription.plan === "YEARLY" ? "Yearly" : subscription.plan === "MONTHLY" ? "Monthly" : subscription.plan}
                {subscription.daysRemaining > 0 && (
                  <span className="ml-1 text-white/70">
                    · {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? "s" : ""} left
                  </span>
                )}
                {subscription.isExpired && <span className="ml-1 text-red-200">· Expired</span>}
              </span>
            </Link>
          )}
          <Link
            href={SUBSCRIPTION_PATH}
            className="ml-2 hidden items-center gap-2 rounded-md bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] px-3.5 py-2 text-[14px] font-semibold transition-opacity hover:opacity-90 md:flex"
          >
            <Sparkles className="h-4 w-4" /> See plans
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 sm:gap-1">
            <NotificationBell open={notifOpen} onOpenChange={setNotifOpen} />
            <ThemeSwitcher />
            <span ref={searchAnchorRef} className="relative inline-flex">
              <IconButton
                imgSrc={SCHOOL_HEADER_IMAGES.magnifyingGlass}
                imgSize={26}
                label="Search"
                onClick={() => setSearchOpen((v) => !v)}
                active={searchOpen}
                ariaExpanded={searchOpen}
              />
            </span>
            <ProfileMenu
              userName={user?.name || "User"}
              userSub={user?.role || user?.email}
            />
          </div>
        </header>

        <HeaderPageSearch
          pages={searchablePages}
          open={searchOpen}
          onOpenChange={setSearchOpen}
          anchorRef={searchAnchorRef}
          placeholder="Search pages…"
        />

        <div className="relative flex min-h-0 flex-1">
          {/* ICON RAIL — primary 8 stay fixed; Plus opens a side flyout (no reflow) */}
          <nav aria-label="Module shortcuts" className="no-print relative z-20 hidden w-16 shrink-0 flex-col items-center gap-1 overflow-visible py-2 md:flex">
            <div className="flex w-full flex-col items-center gap-1">
              {railPrimary.map(railLink)}

              {railMore.some((g) => g.items.length > 0) ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setRailOpen((o) => !o)}
                    aria-expanded={railOpen}
                    aria-label={railOpen ? "Hide more modules" : "Show more modules"}
                    className={cn(
                      "group/ic ic-nav relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      railOpen
                        ? "ic-nav-active bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {railOpen ? (
                      <ChevronDown className="ic-hover h-[21px] w-[21px]" strokeWidth={1.8} />
                    ) : (
                      <Plus className="ic-plus h-[21px] w-[21px]" strokeWidth={1.8} />
                    )}
                    <Tooltip
                      label={
                        railOpen
                          ? "Show less"
                          : `More modules (${railMore.reduce((n, g) => n + g.items.length, 0)})`
                      }
                      side="right"
                    />
                  </button>

                  {railOpen ? (
                    <>
                      <button
                        type="button"
                        aria-label="Close more modules"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setRailOpen(false)}
                      />
                      <div className="absolute left-full top-0 z-50 ml-2 max-h-[min(70vh,520px)] w-[240px] overflow-y-auto rounded-xl bg-[var(--theme-chrome)] p-2 shadow-2xl ring-1 ring-white/20">
                        <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          More modules
                        </p>
                        {railMore.map((group) => (
                          <div key={group.label} className="mb-1.5 last:mb-0">
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                              {group.label}
                            </p>
                            <div className="flex flex-col gap-0.5">
                              {group.items.map((item) => {
                                const active =
                                  pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                  <Link
                                    key={item.k}
                                    href={item.href}
                                    onClick={() => {
                                      setRailOpen(false);
                                      closeOnMobile();
                                    }}
                                    className={cn(
                                      "ic-nav flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition-colors",
                                      active
                                        ? "ic-nav-active bg-white/15 font-medium text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    )}
                                  >
                                    <item.Icon
                                      className="ic-hover h-[18px] w-[18px] shrink-0"
                                      strokeWidth={1.8}
                                    />
                                    <span className="truncate">{item.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex-1" />
            <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--theme-accent)] text-base font-extrabold text-white">
              B
            </div>
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
                  <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">BisonsEduCore360</span><span className="block truncate text-[11px] text-[var(--theme-text-muted)]">Campus: {currentBranch?.name ?? userBranches[0]?.name ?? "—"}</span></span>
                  <ChevronDown className="h-5 w-5 text-[var(--theme-text-muted)]" />
                </button>
                {branchOpen && <><button aria-label="Close campus selector" className="fixed inset-0 z-30 cursor-default" onClick={() => setBranchOpen(false)} /><div className="absolute left-3 right-3 top-full z-40 mt-2 overflow-hidden rounded-lg bg-[var(--theme-surface)] p-1.5 shadow-xl ring-1 ring-[var(--theme-border)]">
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-faint)]">Available campuses</p>
                  {userBranches.map((branch) => <button key={branch.id} onClick={() => { setCurrentBranch(branch.id); setBranchOpen(false); }} className={cn("flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px]", currentBranchId === branch.id ? "bg-[var(--theme-active-bg)] font-semibold text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-hover)]")}><span className="h-2 w-2 rounded-full bg-[var(--theme-success)]" /><span className="min-w-0 flex-1 truncate">{branch.name}</span><span className="text-[11px] text-[var(--theme-text-faint)]">{branch.code}</span></button>)}
                  {isSuperAdmin() && <Link href="/settings/branches" onClick={() => setBranchOpen(false)} className="mt-1 block border-t border-[var(--theme-border)] px-2.5 py-2 text-[12px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)]">Manage campuses</Link>}
                </div></>}
              </div>
              <div className="px-3 pt-3">
                <SidebarNavSearch value={navQuery} onChange={setNavQuery} placeholder="Search pages…" />
              </div>
              <div className="mt-4 flex items-center gap-1 px-4 text-[13px] font-semibold text-[var(--theme-text-muted)]">
                <ChevronDown className="h-4 w-4" /> {navQuery.trim() ? "Matching pages" : "School modules"}
              </div>
              <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
                {filteredNav.length === 0 && (
                  <p className="px-2.5 py-6 text-center text-[13px] text-[var(--theme-text-muted)]">
                    No pages match “{navQuery.trim()}”
                  </p>
                )}
                {filteredNav.map((g) => {
                  const gActive = groupActive(pathname, g);
                  const searching = navQuery.trim().length > 0;
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
                  // While searching, force groups open so matched children are visible.
                  const open = searching || !!openGroups[g.k] || gActive;
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
          {railPrimary.slice(0, 5).map(({ k, Icon, label, href }) => {
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
