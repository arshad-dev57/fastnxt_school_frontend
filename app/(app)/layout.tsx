import AppShell from "@/components/app-shell";
import RequireAuth from "@/components/auth/require-auth";
import RequireModule from "@/components/auth/require-module";
import { NotificationsProvider } from "@/lib/notifications-context";

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Every Admin Panel screen needs a live API session. RequireAuth restores it
     from the httpOnly cookie before the shell (and its nav) is rendered.
     RequireModule then hides pages the role cannot view. */
  return (
    <RequireAuth>
      <NotificationsProvider>
        <AppShell>
          <RequireModule>{children}</RequireModule>
        </AppShell>
      </NotificationsProvider>
    </RequireAuth>
  );
}

