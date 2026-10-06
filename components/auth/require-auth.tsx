"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/* ============================================================================
   RequireAuth — session gate for the signed-in areas
   (/dashboard, /students, … and the Teacher / Student portals).

   The session itself is validated by the API (`GET /api/auth/me`); this
   component only decides what to render while that check is in flight:

     • loading       → full-page splash, so protected content never flashes
     • anonymous     → redirect to /login
     • authenticated → the page

   A Next.js Proxy (the v16 name for middleware) could do a first-pass check,
   but the httpOnly session cookie belongs to the API's own origin and the Next
   docs are explicit that Proxy is for *optimistic* checks rather than session
   management — so the authoritative check goes through the API instead.
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

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, signedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !signedIn) router.replace("/login");
  }, [ready, signedIn, router]);

  if (!ready) return <Splash label="Restoring your session…" />;
  if (!signedIn) return <Splash label="Redirecting to sign in…" />;
  return <>{children}</>;
}
