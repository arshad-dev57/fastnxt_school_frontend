"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight, LogOut, Menu, PanelLeftClose, Plus, Search, X,
} from "lucide-react";
import { Avatar, Tooltip } from "@/components/ui";
import { IconButton } from "@/components/icons";
import ThemeSwitcher from "@/components/theme-switcher";
import ProfileMenu from "@/components/profile-menu";
import FloatingAIAssistant from "@/components/ai-assistant/FloatingAIAssistant";
import { HeaderPageSearch } from "@/components/page-search";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { PortalConfig, PortalNavItem } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";

/* ===========================================================================
   PortalShell — the SAME chrome as components/app-shell.tsx, parameterised for
   the Student / Teacher portals.
   ========================================================================== */

const isActive = (pathname: string, item: PortalNavItem) =>
  item.href === pathname || (item.href.split("/").length > 2 && pathname.startsWith(item.href + "/"));

export default function PortalShell({ config, children }: { config: PortalConfig; children: ReactNode }) {
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchAnchorRef = useRef<HTMLSpanElement>(null);
  const [railOpen, setRailOpen] = useState(false);
  const { user, school } = useAuth();
  const { currentBranch } = useBranch();
  const searchablePages = useMemo(
    () => config.items.map((it) => ({ label: it.label, href: it.href, group: config.portalName })),
    [config.items, config.portalName]
  );

  const closeOnMobile = () => { if (window.innerWidth < 1024) setSideOpen(false); };
  const isStudentPortal = config.base.startsWith("/student");
  const expandHref = config.base.startsWith("/teacher") ? "/teacher/notifications" : isStudentPortal ? "/student/notifications" : "/notifications";

  const railLink = (item: PortalNavItem, key: string) => {
    const active = isActive(pathname, item);
    return (
      <Link key={key} href={item.href} onClick={closeOnMobile}
        className={`group/ic ic-nav relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          active ? "ic-nav-active bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
        <item.Icon className="ic-hover h-[21px] w-[21px]" strokeWidth={1.8} />
        <Tooltip label={item.label} side="right" />
      </Link>
    );
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="app-root flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--theme-chrome)] font-[Figtree,ui-sans-serif,system-ui,sans-serif] text-[var(--theme-text)] antialiased">
        {/* TOP BAR — identical anatomy to the Admin header */}
        <header className="no-print flex h-14 shrink-0 items-center gap-2 px-3 text-white sm:gap-3 sm:px-4">
          <button onClick={() => setSideOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Toggle menu">
            {sideOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href={config.base} className="flex min-w-0 items-center gap-2.5 max-w-[320px]">
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
                {currentBranch ? `${currentBranch.name}` : user?.branch?.name ? `${user.branch.name}` : "Main Campus"} · {config.portalName}
              </span>
            </div>
          </Link>
          {!isStudentPortal && (
            <Link href="/dashboard"
              className="ml-2 hidden items-center gap-2 rounded-md bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] px-3.5 py-2 text-[14px] font-semibold transition-opacity hover:opacity-90 md:flex">
              Admin Panel
            </Link>
          )}
          <div className="flex-1" />

          <NotificationBell
            open={notifOpen}
            onOpenChange={setNotifOpen}
            expandHref={expandHref}
            settingsHref={config.userHref}
            useLucideIcon={isStudentPortal}
          />
          {!isStudentPortal && <ThemeSwitcher />}
          <span ref={searchAnchorRef} className="relative inline-flex">
            <IconButton
              Icon={Search}
              label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              active={searchOpen}
              ariaExpanded={searchOpen}
            />
          </span>
          <ProfileMenu
            userName={config.userName}
            userSub={config.userSub}
            links={{
              profile: config.userHref,
              account: "/settings/account",
              logout: "/logout",
            }}
          />
        </header>

        <HeaderPageSearch
          pages={searchablePages}
          open={searchOpen}
          onOpenChange={setSearchOpen}
          anchorRef={searchAnchorRef}
          placeholder="Search pages…"
        />

        <div className="relative flex min-h-0 flex-1">
          {/* ICON RAIL — primary 8 fixed; Plus opens side flyout (no icon reflow) */}
          <nav
            aria-label={`${config.portalName} modules`}
            className="no-print relative z-20 hidden w-16 shrink-0 flex-col items-center gap-1 overflow-visible py-2 md:flex"
          >
            <div className="flex w-full flex-col items-center gap-1">
              {config.items.slice(0, 8).map((it) => railLink(it, `${config.base}-rail-${it.href}`))}

              {config.items.length > 8 ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setRailOpen((o) => !o)}
                    aria-expanded={railOpen}
                    aria-label={railOpen ? "Hide more modules" : "Show more modules"}
                    className={`group/ic ic-nav relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      railOpen
                        ? "ic-nav-active bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {railOpen ? (
                      <ChevronRight className="ic-hover h-[21px] w-[21px] rotate-90" strokeWidth={1.8} />
                    ) : (
                      <Plus className="ic-plus h-[21px] w-[21px]" strokeWidth={1.8} />
                    )}
                    <Tooltip
                      label={
                        railOpen
                          ? "Show less"
                          : `More modules (${config.items.length - 8})`
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
                        <div className="flex flex-col gap-0.5">
                          {config.items.slice(8).map((item) => {
                            const active = isActive(pathname, item);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                  setRailOpen(false);
                                  closeOnMobile();
                                }}
                                className={`ic-nav flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition-colors ${
                                  active
                                    ? "ic-nav-active bg-white/15 font-medium text-white"
                                    : "text-white/80 hover:bg-white/10 hover:text-white"
                                }`}
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

          {sideOpen && <div className="no-print fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSideOpen(false)} />}

          {/* WORKSPACE SIDEBAR — drawer < lg, inline >= lg (same as Admin) */}
          <aside onClick={(e) => e.stopPropagation()}
            className={`no-print z-40 shrink-0 overflow-hidden bg-[var(--theme-sidebar)] transition-[width] duration-200 max-lg:fixed max-lg:bottom-16 max-lg:left-0 max-lg:top-14 md:max-lg:bottom-0 md:max-lg:left-16 lg:relative lg:rounded-tl-xl ${
              sideOpen ? "w-[288px] max-w-[85vw]" : "w-0"}`}>
            <div className="flex h-full w-[288px] max-w-[85vw] flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <p className="truncate text-[22px] font-bold">{config.portalName}</p>
                <button onClick={() => setSideOpen(false)} className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]" aria-label="Collapse sidebar">
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>

              {/* Signed-in identity card */}
              <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-2.5 shadow-sm ring-1 ring-[var(--theme-border)]">
                <Avatar name={config.userName} size={34} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{config.userName}</p>
                  <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{config.userSub}</p>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-1 px-4 text-[13px] font-semibold text-[var(--theme-text-muted)]">
                {config.portalName} modules
              </div>
              <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
                {config.items.map((it) => {
                  const active = isActive(pathname, it);
                  return (
                    <Link key={it.href} href={it.href} onClick={closeOnMobile}
                      className={`ic-nav flex min-h-10 items-center gap-2.5 rounded px-2.5 py-2 text-[15px] transition-colors ${
                        active ? "ic-nav-active bg-[var(--theme-active-bg)] font-medium text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-border)]"}`}>
                      <it.Icon className="ic-hover h-5 w-5 shrink-0" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate text-left">{it.label}</span>
                    </Link>
                  );
                })}
                <Link href="/logout" onClick={closeOnMobile}
                  className="ic-nav flex min-h-10 items-center gap-2.5 rounded px-2.5 py-2 text-[15px] text-[var(--theme-danger)] transition-colors hover:bg-[var(--theme-border)]">
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="truncate">Logout</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className={`relative flex min-w-0 flex-1 flex-col bg-[var(--theme-surface)] max-md:rounded-t-xl ${!sideOpen ? "md:rounded-tl-xl" : ""}`}>
            {!sideOpen && (
              <button onClick={() => setSideOpen(true)} className="no-print absolute left-0 top-6 z-10 hidden h-8 w-6 items-center justify-center rounded-r bg-[var(--theme-surface)] text-[var(--theme-text-muted)] shadow ring-1 ring-[var(--theme-border)] hover:text-[var(--theme-primary)] lg:flex" aria-label="Expand sidebar">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <div className="app-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>

        {/* BOTTOM NAV (phones) — same 64px bar as the Admin shell */}
        <nav className="no-print flex h-16 shrink-0 items-center justify-around border-t border-white/10 bg-[var(--theme-chrome)] text-white md:hidden">
          {config.bottom.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] ${active ? "text-white" : "text-white/60"}`}>
                <item.Icon className="h-6 w-6" strokeWidth={1.8} /> {item.label.replace(/^My /, "")}
              </Link>
            );
          })}
        </nav>

        <FloatingAIAssistant />
      </div>
    </>
  );
}
