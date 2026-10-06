"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";
import { cn } from "@/components/ui";

/* ============================================================================
   Authentication shell — the split-screen frame every auth screen sits inside.
   ---------------------------------------------------------------------------
   Desktop  → branding panel (left) + form column (right)
   Mobile   → compact brand lockup on top, form below (single column)

   The left panel is a theme-aware gradient with an education photo layered over
   it at low opacity. The gradient alone already looks finished, so the panel
   still reads correctly if the network image is slow or unavailable.
   ========================================================================== */

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1400&q=80";

const HIGHLIGHTS = [
  { Icon: Users, title: "Every role, one platform", text: "Admin, teacher and student workspaces stay in sync." },
  { Icon: GraduationCap, title: "Academics end to end", text: "Admissions, attendance, exams, results and homework." },
  { Icon: ShieldCheck, title: "Built for institutions", text: "Multi-branch scope, permissions and audit-ready records." },
];

export function BrandLockup({ invert = false, className = "" }: { invert?: boolean; className?: string }) {
  return (
    <Link href="/login" className={cn("inline-flex items-center gap-2.5", className)} aria-label="BisonsEduCore360 home">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl",
          invert ? "bg-white/15 ring-1 ring-white/25" : "bg-[var(--theme-subtle)] ring-1 ring-[var(--theme-border)]"
        )}
      >
        <img src="/logo.png" alt="BisonsEduCore360 logo" className="h-9 w-9 object-contain" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block truncate text-[19px] font-bold tracking-tight", invert ? "text-white" : "text-[var(--theme-text)]")}>
          BisonsEduCore360
        </span>
        <span className={cn("block truncate text-[12px] font-medium", invert ? "text-white/70" : "text-[var(--theme-text-muted)]")}>
          Complete School Management Platform
        </span>
      </span>
    </Link>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-[var(--theme-bg)] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------------------------- left: branding */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12"
        style={{ backgroundImage: "linear-gradient(140deg, var(--theme-chrome) 0%, var(--theme-primary) 100%)" }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

        <div className="relative">
          <BrandLockup invert />
        </div>

        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium text-white ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
            Trusted school operations
          </p>
          <h2 className="mt-4 text-[30px] font-bold leading-[1.15] text-white xl:text-[34px]">
            Run your entire school from one calm dashboard.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">
            BisonsEduCore360 brings academics, finance, staff and communication together — so your teams
            spend less time on paperwork and more time with students.
          </p>

          <ul className="mt-7 space-y-4">
            {HIGHLIGHTS.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-white">{title}</span>
                  <span className="block text-[13px] leading-snug text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-white/60">
          © 2026 BisonsEduCore360 · School Management System
        </p>
      </aside>

      {/* ------------------------------------------------- right: form */}
      <main className="flex min-h-dvh flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-12 xl:px-16">
        <div className="mb-6 lg:hidden">
          <BrandLockup />
        </div>

        {/* `my-auto` centres the card when it fits and lets it scroll normally
            from the top when it doesn't (the register form is taller). */}
        <div className="mx-auto my-auto w-full max-w-[440px]">{children}</div>

        <p className="mx-auto mt-8 w-full max-w-[440px] text-center text-[12px] text-[var(--theme-text-faint)] lg:hidden">
          Demo project · front-end only
        </p>
      </main>
    </div>
  );
}
