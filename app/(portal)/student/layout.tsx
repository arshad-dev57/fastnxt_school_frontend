"use client";

import PortalShell from "@/components/portal/portal-shell";
import RequireAuth from "@/components/auth/require-auth";
import { STUDENT_PORTAL } from "@/lib/portal-nav";

/* The Student Portal reuses the same chrome, theme and providers as the Admin
   Panel (ThemeProvider + BranchProvider live in the root layout), and sits
   behind the same API session check. */
export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PortalShell config={STUDENT_PORTAL}>{children}</PortalShell>
    </RequireAuth>
  );
}
