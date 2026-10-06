"use client";

import type { ReactNode } from "react";
import { cn, TONE, type IconType, type Tone } from "@/components/ui";

/* ============================================================================
   Full-screen status card used by the non-form steps of the auth flow:
   verification pending, verification success and "reset link sent".
   Shares one layout so all three screens feel like the same product.
   ========================================================================== */

const STATUS_TONE: Record<"info" | "success" | "warning", Tone> = {
  info: "blue",
  success: "green",
  warning: "orange",
};

export default function AuthStatus({ tone = "info", Icon, eyebrow, title, message, children, footnote }: {
  tone?: "info" | "success" | "warning";
  Icon: IconType;
  eyebrow?: string;
  title: string;
  message: ReactNode;
  children?: ReactNode;
  footnote?: ReactNode;
}) {
  const t = TONE[STATUS_TONE[tone]];

  return (
    <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04),0_18px_40px_-24px_rgba(16,24,40,0.35)] sm:p-7">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: t.bg, color: t.fg }}
      >
        <Icon className="icon-pop h-8 w-8" strokeWidth={1.8} />
      </span>

      {eyebrow && (
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-faint)]">
          {eyebrow}
        </p>
      )}
      <h1 className={cn("text-[22px] font-bold leading-tight text-[var(--theme-text)] sm:text-[24px]", !eyebrow && "mt-5")}>
        {title}
      </h1>
      <div className="mx-auto mt-2 max-w-[360px] text-[14px] leading-relaxed text-[var(--theme-text-muted)]">
        {message}
      </div>

      {children && <div className="mt-6 space-y-2.5">{children}</div>}
      {footnote && <div className="mt-5 border-t border-[var(--theme-border)] pt-4 text-[13px] text-[var(--theme-text-muted)]">{footnote}</div>}
    </section>
  );
}
