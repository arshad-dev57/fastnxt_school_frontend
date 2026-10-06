"use client";

import type { ReactNode } from "react";

/* ============================================================================
   Card frame for every authentication form (login, register, reset …).
   Reuses the app's surface, border and radius tokens so auth screens are
   visually consistent with the dashboards.
   ========================================================================== */

export default function AuthCard({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_18px_40px_-24px_rgba(16,24,40,0.35)] sm:p-7">
      <h1 className="text-[23px] font-bold leading-tight text-[var(--theme-text)] sm:text-[26px]">{title}</h1>
      {subtitle && <p className="mt-2 text-[14px] leading-relaxed text-[var(--theme-text-muted)]">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && (
        <div className="mt-6 border-t border-[var(--theme-border)] pt-5 text-center text-[14px]">{footer}</div>
      )}
    </section>
  );
}
