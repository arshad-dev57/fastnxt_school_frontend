"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy demo board — redirect to the real fee invoices module. */
export default function LegacyFeeDemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/fees/invoices");
  }, [router]);

  return (
    <p className="px-4 py-16 text-center text-[14px] text-[var(--theme-text-muted)]">
      Redirecting to Fee Invoices…
    </p>
  );
}
