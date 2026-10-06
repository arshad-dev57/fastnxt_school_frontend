"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

/* Small, honest disclaimer shown on the auth screens: this flow is front-end
   only, so nobody should mistake it for a real login. */
export default function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--theme-info-soft)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--theme-text-muted)]">
      <Info aria-hidden="true" strokeWidth={1.8} className="mt-px h-4 w-4 shrink-0 text-[var(--theme-info)]" />
      <span>{children}</span>
    </p>
  );
}
