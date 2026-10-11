"use client";

import { useMemo } from "react";
import PortalShell from "@/components/portal/portal-shell";
import RequireAuth from "@/components/auth/require-auth";
import { useBranch } from "@/lib/branch-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { TEACHER_NAV, TEACHER_PORTAL, visibleNav, type PortalConfig } from "@/lib/portal-nav";
import type { AccessModule } from "@/lib/branch-access";

function pickNav(items: PortalConfig["items"], hrefs: string[]) {
  return hrefs
    .map((h) => items.find((i) => i.href === h))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
}

export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const { can } = useBranch();

  const config = useMemo(() => {
    const allowed = (TEACHER_NAV.map((i) => i.module) as AccessModule[]).filter(
      (m, idx, arr) => arr.indexOf(m) === idx && can(m, "view"),
    );
    const items = visibleNav(TEACHER_NAV, allowed);
    return {
      ...TEACHER_PORTAL,
      items,
      bottom: pickNav(items, ["/teacher", "/teacher/classes", "/teacher/students", "/teacher/attendance", "/teacher/exams"]),
    } satisfies PortalConfig;
  }, [can]);

  return (
    <RequireAuth>
      <NotificationsProvider>
        <PortalShell config={config}>{children}</PortalShell>
      </NotificationsProvider>
    </RequireAuth>
  );
}
