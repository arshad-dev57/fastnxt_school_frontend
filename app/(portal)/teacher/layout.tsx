"use client";

import PortalShell from "@/components/portal/portal-shell";
import RequireAuth from "@/components/auth/require-auth";
import { TEACHER_PORTAL } from "@/lib/portal-nav";

/* The Teacher Portal reuses the same chrome, theme and providers as the Admin
   Panel (ThemeProvider + BranchProvider live in the root layout), and sits
   behind the same API session check. */
export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PortalShell config={TEACHER_PORTAL}>{children}</PortalShell>
    </RequireAuth>
  );
}
