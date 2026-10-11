import RequireAuth from "@/components/auth/require-auth";

export default function LockedLayout({ children }: { children: React.ReactNode }) {
  /* Signed-in schools with an expired plan land here. allowExpired keeps the
     lock screen reachable without bouncing back into the Admin shell. */
  return <RequireAuth allowExpired>{children}</RequireAuth>;
}
