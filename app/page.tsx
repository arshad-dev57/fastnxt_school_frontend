"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* The product entry point is the sign-in screen: BisonsEduCore360 is a
   multi-panel platform, so we ask who you are before showing any dashboard.
   (The Admin / Teacher / Student dashboards remain reachable directly and from
   the Panel Switcher in the AppShell header.) */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}

