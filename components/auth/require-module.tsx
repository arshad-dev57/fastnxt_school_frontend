"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranch } from "@/lib/branch-context";
import { moduleForPath } from "@/lib/route-permissions";

/**
 * Blocks deep-links to modules the active role cannot view.
 * Always-open routes (account, logout, subscription) skip the check.
 */
export default function RequireModule({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { can, loading } = useBranch();

  const required = moduleForPath(pathname || "/");
  const allowed = required === null || required === undefined || can(required, "view");

  useEffect(() => {
    if (loading) return;
    if (!allowed) router.replace("/dashboard");
  }, [allowed, loading, router]);

  if (loading) return null;
  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-[14px] text-[var(--theme-text-muted)]">
        You do not have access to this page.
      </div>
    );
  }

  return <>{children}</>;
}
