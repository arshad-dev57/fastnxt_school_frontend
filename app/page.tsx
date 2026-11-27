import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, Video } from "lucide-react";
import { BrandLockup } from "@/components/auth/auth-shell";
import { APP_DOMAIN, APP_NAME, SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `${APP_NAME} · School Management Platform`,
  description: `${APP_NAME} helps schools manage academics, staff, fees, and online classes with Google Meet.`,
};

const HIGHLIGHTS = [
  {
    Icon: GraduationCap,
    title: "Academics & operations",
    text: "Admissions, attendance, exams, fees, and staff in one place.",
  },
  {
    Icon: Video,
    title: "Online classes with Meet",
    text: "Connect Google to create and manage Meet links for live sessions.",
  },
  {
    Icon: ShieldCheck,
    title: "Built for institutions",
    text: "Roles, campuses, and school data stay under your control.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <header className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLockup />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--theme-primary)] px-3.5 py-2 text-[14px] font-semibold text-white hover:bg-[var(--theme-primary-hover)]"
            >
              Create school
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          className="relative overflow-hidden"
          style={{ backgroundImage: "linear-gradient(140deg, var(--theme-chrome) 0%, var(--theme-primary) 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-[13px] font-medium text-white/75">{APP_DOMAIN}</p>
            <h1 className="mt-3 max-w-2xl text-[34px] font-bold leading-[1.12] tracking-tight text-white sm:text-[44px]">
              {APP_NAME}
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/85 sm:text-[17px]">
              School management for admissions, academics, finance, and online classes — including
              Google Meet links created through a secure Google connection.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-semibold text-[var(--theme-chrome)] hover:bg-white/90"
              >
                Sign in
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-xl bg-white/15 px-5 py-3 text-[14px] font-semibold text-white ring-1 ring-white/25 hover:bg-white/20"
              >
                Register your school
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 sm:py-16">
          {HIGHLIGHTS.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold">{title}</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--theme-text-muted)]">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--theme-border)] bg-[var(--theme-subtle)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-[13px] text-[var(--theme-text-muted)]">
            <p className="font-semibold text-[var(--theme-text)]">{APP_NAME}</p>
            <p className="mt-1">
              © {new Date().getFullYear()} ·{" "}
              <a className="hover:text-[var(--theme-primary)]" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-medium text-[var(--theme-text-muted)]">
            <Link href="/privacy-policy" className="hover:text-[var(--theme-primary)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--theme-primary)]">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-[var(--theme-primary)]">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
