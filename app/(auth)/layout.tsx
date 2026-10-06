import AuthShell from "@/components/auth/auth-shell";

/* Every screen in this route group (login / register / verify / reset) shares
   the split-screen auth frame instead of the Admin AppShell or the portals. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
