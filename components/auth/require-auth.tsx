"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { hasActiveSubscription, SUBSCRIPTION_PATH } from "@/lib/auth/subscription";

/* ============================================================================
   RequireAuth — session gate for the signed-in areas
   (/dashboard, /students, … and the Teacher / Student portals).

   The session itself is validated by the API (`GET /api/auth/me`); this
   component only decides what to render while that check is in flight:

     • loading       → full-page splash, so protected content never flashes
     • anonymous     → redirect to /login
     • authenticated + expired subscription → /subscription (unless allowExpired)
     • authenticated + active subscription → the page

   Subscription status comes from the existing session payload — no extra API
   calls on every shell navigation.
   ========================================================================== */

function Splash({ label }: { label: string }) {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[var(--theme-chrome)] text-white">
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white"
      />
      <p className="text-[14px] text-white/70">{label}</p>
    </div>
  );
}

export default function RequireAuth({
  children,
  allowExpired = false,
}: {
  children: ReactNode;
  /** Set on the /subscription lock screen so expired schools can still open it. */
  allowExpired?: boolean;
}) {
  const { ready, signedIn, subscription } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const active = hasActiveSubscription(subscription);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      router.replace("/login");
      return;
    }
    if (!allowExpired && !active && pathname !== SUBSCRIPTION_PATH) {
      router.replace(SUBSCRIPTION_PATH);
    }
  }, [ready, signedIn, allowExpired, active, pathname, router]);

  if (!ready) return <Splash label="Restoring your session…" />;
  if (!signedIn) return <Splash label="Redirecting to sign in…" />;
  if (!allowExpired && !active) return <Splash label="Checking your subscription…" />;
  return <>{children}</>;
}
