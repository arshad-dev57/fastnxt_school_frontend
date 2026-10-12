"use client";

import { useMemo } from "react";
import PortalShell from "@/components/portal/portal-shell";
import RequireAuth from "@/components/auth/require-auth";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import { useMyStudent } from "@/lib/hooks/use-my-student";
import { NotificationsProvider } from "@/lib/notifications-context";
import { STUDENT_NAV, STUDENT_PORTAL, visibleNav, type PortalConfig } from "@/lib/portal-nav";
import type { AccessModule } from "@/lib/branch-access";

function pickNav(items: PortalConfig["items"], hrefs: string[]) {
  return hrefs
    .map((h) => items.find((i) => i.href === h))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
}

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const { can } = useBranch();
  const { user } = useAuth();
  const { student } = useMyStudent();

  const config = useMemo(() => {
    const allowed = (STUDENT_NAV.map((i) => i.module) as AccessModule[]).filter(
      (m, idx, arr) => arr.indexOf(m) === idx && can(m, "view"),
    );
    const items = visibleNav(STUDENT_NAV, allowed);
    const userName = student?.name || user?.name || "Student";
    const userSub = student
      ? `${student.cls}-${student.section}${student.studentId ? ` · ${student.studentId}` : ""}`
      : user?.email || "Student portal";
    return {
      ...STUDENT_PORTAL,
      userName,
      userSub,
      items,
      bottom: pickNav(items, ["/student", "/student/timetable", "/student/attendance", "/student/homework", "/student/exams"]),
    } satisfies PortalConfig;
  }, [can, student, user]);

  return (
    <RequireAuth>
      <NotificationsProvider>
        <PortalShell config={config}>{children}</PortalShell>
      </NotificationsProvider>
    </RequireAuth>
  );
}
