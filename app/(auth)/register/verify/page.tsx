"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/* ============================================================================
   Legacy "Step 2 — verify your email address".

   The API creates the account already verified (`emailVerified: true` on the
   User row), so there is no pending state left to confirm. This route is kept
   so old links and bookmarks keep working: it simply forwards to the screen
   that is correct for the current session.
   ========================================================================== */

export default function VerificationPendingPage() {
  const router = useRouter();
  const { ready, signedIn } = useAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(signedIn ? "/register/verified" : "/register");
  }, [ready, signedIn, router]);

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4">
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--theme-border)] border-t-[var(--theme-primary)]"
      />
      <p className="text-[14px] text-[var(--theme-text-muted)]">Checking your account…</p>
    </div>
  );
}
