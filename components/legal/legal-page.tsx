import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/auth/auth-shell";
import { APP_NAME, LEGAL_LAST_UPDATED, SUPPORT_EMAIL } from "@/lib/legal";

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <header className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLockup />
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-[var(--theme-text-muted)]">
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
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--theme-text-faint)]">
          {APP_NAME} · Legal
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--theme-text-muted)]">{description}</p>
        <p className="mt-4 text-[13px] text-[var(--theme-text-faint)]">Last updated: {LEGAL_LAST_UPDATED}</p>

        <article className="legal-prose mt-10 space-y-8 text-[15px] leading-relaxed text-[var(--theme-text)]">
          {children}
        </article>
      </main>

      <footer className="border-t border-[var(--theme-border)] bg-[var(--theme-subtle)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 text-[13px] text-[var(--theme-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Contact{" "}
            <a className="font-medium text-[var(--theme-primary)] hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-[var(--theme-primary)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--theme-primary)]">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-semibold tracking-tight text-[var(--theme-text)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[var(--theme-text-muted)]">{children}</div>
    </section>
  );
}
