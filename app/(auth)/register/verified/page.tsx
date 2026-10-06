"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ShieldAlert } from "lucide-react";
import { Btn } from "@/components/ui";
import AuthStatus from "@/components/auth/auth-status";
import { useAuth } from "@/lib/auth/auth-context";
import { maskEmail } from "@/lib/auth/auth-utils";

/* ============================================================================
   Step 3 — "Email Verified Successfully".
   Reached by simulating the verification link; also survives a refresh because
   the verification flag is persisted with the rest of the auth snapshot.
   ========================================================================== */

function Skeleton() {
  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-7">
      <div className="skeleton mx-auto h-16 w-16 rounded-full" />
      <div className="skeleton mx-auto mt-5 h-6 w-60" />
      <div className="skeleton mx-auto mt-3 h-4 w-full max-w-[340px]" />
      <div className="skeleton mt-7 h-11 w-full" />
    </div>
  );
}

export default function EmailVerifiedPage() {
  const router = useRouter();
  const { ready, school, emailVerified } = useAuth();

  if (!ready) return <Skeleton />;

  if (!school || !emailVerified) {
    return (
      <AuthStatus
        tone="warning"
        Icon={ShieldAlert}
        title="No verified account yet"
        message="We don't have a verified school account in this browser. Complete the registration and email verification steps first."
      >
        <Btn variant="primary" size="lg" className="w-full" onClick={() => router.push("/register")}>
          Create School Account
        </Btn>
        <Btn variant="secondary" size="lg" className="w-full" onClick={() => router.push("/login")}>
          Back to Login
        </Btn>
      </AuthStatus>
    );
  }

  return (
    <AuthStatus
      tone="success"
      Icon={BadgeCheck}
      eyebrow="Step 3 of 3"
      title="Email Verified Successfully"
      message={
        <>
          <strong className="font-semibold text-[var(--theme-text)]">{school.schoolName}</strong> is ready. The address{" "}
          <strong className="font-semibold text-[var(--theme-text)]">{maskEmail(school.email)}</strong> has been confirmed, so you
          can sign in and start setting up your campus.
        </>
      }
      footnote="You can now add branches, classes, students and staff from the Admin Panel."
    >
      <Btn
        variant="primary"
        size="lg"
        className="w-full"
        IconRight={ArrowRight}
        onClick={() => router.push("/login")}
      >
        Continue to Login
      </Btn>
    </AuthStatus>
  );
}
