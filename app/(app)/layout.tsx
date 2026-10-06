import AppShell from "@/components/app-shell";
import RequireAuth from "@/components/auth/require-auth";

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Every Admin Panel screen needs a live API session. RequireAuth restores it
     from the httpOnly cookie before the shell (and its nav) is rendered. */
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

