"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Briefcase, CalendarCheck, CheckCheck, ChevronRight, CircleHelp, ExternalLink,
  MessageSquare, ReceiptText, UserPlus, Wallet, LogOut, Menu, PanelLeftClose, Plus, Search, X,
} from "lucide-react";
import { Avatar, Tooltip, TONE, type IconType } from "@/components/ui";
import { IconButton } from "@/components/icons";
import ThemeSwitcher from "@/components/theme-switcher";
import PanelSwitcher from "@/components/panel-switcher";
import FloatingAIAssistant from "@/components/ai-assistant/FloatingAIAssistant";
import { NOTIFICATIONS, type NotificationRow } from "@/lib/mock-data";
import type { PortalConfig, PortalNavItem } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";

/* ===========================================================================
   PortalShell — the SAME chrome as components/app-shell.tsx, parameterised for
   the Student / Teacher portals.

   It reuses the Admin's structure, spacing scale, theme tokens, font stack and
   motion classes (ic-nav / ic-hover / ic-btn), so the portals look like they
   were designed with the Admin Panel. The Admin's own AppShell is untouched —
   this is an additional shell, not a replacement.
   ========================================================================== */

const NOTIF_ICON: Record<NotificationRow["icon"], IconType> = {
  user: UserPlus, fee: Wallet, invoice: ReceiptText, calendar: CalendarCheck,
  staff: Briefcase, chat: MessageSquare,
};

const isActive = (pathname: string, item: PortalNavItem) =>
  item.href === pathname || (item.href.split("/").length > 2 && pathname.startsWith(item.href + "/"));

export default function PortalShell({ config, children }: { config: PortalConfig; children: ReactNode }) {
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>(NOTIFICATIONS);
  const [railOpen, setRailOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read).length;
  const { user, school } = useAuth();
  const { currentBranch } = useBranch();

  const closeOnMobile = () => { if (window.innerWidth < 1024) setSideOpen(false); };
  const markRead = (id: number) => setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifs((p) => p.map((n) => ({ ...n, read: true })));

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
            <img src="/logo.png" alt="BisonsEduCore360 Logo" className="h-9 w-9 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[15px] font-bold leading-tight text-white">
                {school?.schoolName || user?.school?.name || "BisonsEduCore360"}
              </span>
              <span className="truncate text-[11px] font-medium text-white/80">
                {currentBranch ? `${currentBranch.name}` : user?.branch?.name ? `${user.branch.name}` : "Main Campus"} · {config.portalName}
              </span>
            </div>
          </Link>
          <Link href="/dashboard"
            className="ml-2 hidden items-center gap-2 rounded-md bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] px-3.5 py-2 text-[14px] font-semibold transition-opacity hover:opacity-90 md:flex">
            <ExternalLink className="h-4 w-4" /> Admin Panel
          </Link>
          <div className="flex-1" />

          {/* PANEL SWITCHER — same dropdown the Admin header uses */}
          <PanelSwitcher />

          {/* NOTIFICATIONS — same popover as the Admin header */}
          <div className="relative">
            <button onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" aria-expanded={notifOpen}
              className="ic-btn relative flex h-10 w-10 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white">
              <Bell className="ic-hover h-[22px] w-[22px]" strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--theme-badge)] px-1 text-[10px] font-bold text-white">{unread}</span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl bg-[var(--theme-surface)] shadow-2xl ring-1 ring-[var(--theme-border)]">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">Notifications</p>
                      <p className="text-[12px] text-[var(--theme-text-muted)]">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
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
                      </div>
                    )}
                    {notifs.map((n) => {
                      const NIcon = NOTIF_ICON[n.icon];
                      const t = TONE[n.tone];
                      return (
                        <button key={n.id} onClick={() => markRead(n.id)}
                          className={`flex w-full items-start gap-3 border-b border-[var(--theme-border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--theme-hover)] ${!n.read ? "bg-[var(--theme-info-soft)]" : ""}`}>
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
                </div>
              </>
            )}
          </div>

          <ThemeSwitcher />
          <IconButton Icon={Search} label="Search" />
          <IconButton Icon={CircleHelp} label="Help" className="max-sm:hidden" />
          <Link href={config.userHref} className="ml-1 sm:ml-2" aria-label="Account">
            <Avatar name={config.userName} size={36} />
          </Link>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {/* ICON RAIL — same 64px rail as the Admin shell */}
          <nav aria-label={`${config.portalName} modules`} className="no-print hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto py-2 md:flex">
            {config.items.slice(0, 8).map((it, i) => railLink(it, `${config.base}-rail-${i}`))}
            <button type="button" onClick={() => setRailOpen((o) => !o)} aria-expanded={railOpen}
              aria-label={railOpen ? "Show fewer modules" : "Show more modules"}
              className={`group/ic ic-nav relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${railOpen ? "ic-nav-active bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              {railOpen ? <ChevronRight className="ic-hover h-[21px] w-[21px] rotate-90" strokeWidth={1.8} /> : <Plus className="ic-plus h-[21px] w-[21px]" strokeWidth={1.8} />}
              <Tooltip label={railOpen ? "Show less" : `More modules (${Math.max(0, config.items.length - 8)})`} side="right" />
            </button>
            {railOpen && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="my-1.5 h-px w-7 shrink-0 bg-white/15" />
                {config.items.slice(8).map((it, i) => railLink(it, `${config.base}-more-${i}`))}
              </div>
            )}
            <div className="flex-1" />
            <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--theme-accent)] text-base font-extrabold text-white">B</div>
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
