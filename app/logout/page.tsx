"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { LoadingIcon, SuccessIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth/auth-context";

/* ============================================================================
   Logout — POST /api/auth/logout, then back to the sign-in screen.

   This page lives OUTSIDE the `(app)` group on purpose: it must be reachable
   even when the session has already expired, so it is not wrapped in
   <RequireAuth> (which would bounce straight to /login before the API call).
   ========================================================================== */

export default function LogoutPage() {
  const router = useRouter();
  const { ready, signOut } = useAuth();

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const run = async () => {
      // Clear the httpOnly session cookie server-side, then drop local state.
      await signOut();
      if (cancelled) return;
      // Brief pause so the confirmation below is actually readable.
      await new Promise((resolve) => setTimeout(resolve, 900));
      if (!cancelled) router.replace("/login");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [ready, signOut, router]);

  return (
    <div className="flex min-h-[calc(100dvh-112px)] items-center justify-center px-4">
      <Card pad className="max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]">
            <SuccessIcon className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-[20px] font-bold">Logged out successfully</h1>
            <p className="mt-2 text-[14px] text-[var(--theme-text-muted)]">Redirecting to the sign-in page...</p>
          </div>
          <LoadingIcon size={24} />
        </div>
      </Card>
    </div>
  );
}
