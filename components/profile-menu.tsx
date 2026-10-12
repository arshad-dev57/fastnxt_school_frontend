"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { cn } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { normalizeUserRole } from "@/lib/branch-access";

const PROFILE_ICON = "/images/profile-icon.png";

export type ProfileMenuLinks = {
  profile: string;
  account: string;
  logout: string;
};

const DEFAULT_LINKS: ProfileMenuLinks = {
  profile: "/profile",
  account: "/settings/account",
  logout: "/logout",
};

/** Account Setting is admin-side only — not for Teacher / Student portals. */
function canSeeAccountSettings(role: string | null | undefined, panel: string | null | undefined) {
  const normalized = normalizeUserRole(role);
  if (normalized === "Teacher" || normalized === "Student") return false;
  if (panel === "teacher" || panel === "student") return false;
  return true;
}

export default function ProfileMenu({
  userName,
  userSub,
  links = DEFAULT_LINKS,
  showAccountSettings,
}: {
  userName?: string;
  userSub?: string;
  links?: Partial<ProfileMenuLinks>;
  /** Override auto permission check. Default: hide for Teacher/Student. */
  showAccountSettings?: boolean;
}) {
  const { user, panel } = useAuth();
  const [open, setOpen] = useState(false);
  const hrefs: ProfileMenuLinks = {
    profile: links.profile ?? DEFAULT_LINKS.profile,
    account: links.account ?? DEFAULT_LINKS.account,
    logout: links.logout ?? DEFAULT_LINKS.logout,
  };

  const allowAccount = showAccountSettings ?? canSeeAccountSettings(user?.role, panel || user?.panel);

  const items = useMemo(() => {
    const list: {
      label: string;
      href: string;
      Icon: typeof User;
      danger?: boolean;
    }[] = [
      { label: "Profile", href: hrefs.profile, Icon: User },
    ];
    if (allowAccount) {
      list.push({ label: "Account Setting", href: hrefs.account, Icon: Settings });
    }
    list.push({ label: "Logout", href: hrefs.logout, Icon: LogOut, danger: true });
    return list;
  }, [allowAccount, hrefs.account, hrefs.logout, hrefs.profile]);

  return (
    <div className="relative z-50 ml-1 sm:ml-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        className={cn(
          "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-2 ring-white/40 transition hover:ring-white/70",
          open && "ring-white",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROFILE_ICON}
          alt=""
          width={28}
          height={28}
          draggable={false}
          className="h-7 w-7 select-none object-contain"
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-full z-50 mt-2 w-[240px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-[var(--theme-border)]"
          >
            {(userName || userSub) && (
              <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] px-3.5 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PROFILE_ICON}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-full bg-white object-contain p-1 ring-1 ring-[var(--theme-border)]"
                />
                <div className="min-w-0">
                  {userName ? <p className="truncate text-[14px] font-semibold">{userName}</p> : null}
                  {userSub ? <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{userSub}</p> : null}
                </div>
              </div>
            )}

            <div className="p-1.5">
              {items.map(({ label, href, Icon, danger }) => (
                <Link
                  key={`${label}-${href}`}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] transition-colors hover:bg-[var(--theme-hover)]",
                    danger && "text-[var(--theme-danger)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
