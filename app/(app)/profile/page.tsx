"use client";

import Link from "next/link";
import { User, Settings, Mail, ShieldCheck, Building2 } from "lucide-react";
import { Btn, Card, CardHead, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";

const PROFILE_ICON = "/images/profile-icon.png";

export default function ProfilePage() {
  const { user, school, signedIn } = useAuth();
  const { currentBranch } = useBranch();

  if (!signedIn || !user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4 text-center">
        <User className="h-16 w-16 text-[var(--theme-text-muted)]" />
        <p className="text-[15px] font-medium">Please sign in to view your profile.</p>
      </div>
    );
  }

  const rows = [
    { label: "Full name", value: user.name, Icon: User },
    { label: "Email", value: user.email, Icon: Mail },
    { label: "Role", value: user.role, Icon: ShieldCheck },
    { label: "School", value: school?.schoolName || user.school?.name || "—", Icon: Building2 },
    { label: "Campus", value: currentBranch?.name || user.branch?.name || "—", Icon: Building2 },
  ];

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Your account identity across the school system."
        actions={
          <Link href="/settings/account">
            <Btn variant="primary" Icon={Settings}>Account Setting</Btn>
          </Link>
        }
      />

      <div className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PROFILE_ICON}
              alt=""
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-[var(--theme-border)]"
            />
            <div className="min-w-0">
              <p className="truncate text-[20px] font-semibold">{user.name}</p>
              <p className="truncate text-[14px] text-[var(--theme-text-muted)]">{user.email}</p>
              <p className="mt-1 text-[13px] font-medium text-[var(--theme-primary)]">{user.role}</p>
            </div>
          </div>
        </Card>

        <Card pad={false}>
          <CardHead title="Profile details" subtitle="Signed-in account information" Icon={User} />
          <div className="divide-y divide-[var(--theme-border)]">
            {rows.map(({ label, value, Icon }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] text-[var(--theme-text-faint)]">{label}</p>
                  <p className="truncate text-[14px] font-medium">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
