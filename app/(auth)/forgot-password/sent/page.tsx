"use client";

import { useRouter } from "next/navigation";
import { MailCheck, MailQuestion } from "lucide-react";
import { Btn } from "@/components/ui";
import AuthStatus from "@/components/auth/auth-status";
import { useAuth } from "@/lib/auth/auth-context";
import { maskEmail } from "@/lib/auth/auth-utils";

/* ============================================================================
   Forgot Password — step 2 ("Reset link sent").
   The address comes from the previous screen via the auth context, so the
   confirmation always describes what the user actually typed.
   ========================================================================== */

export default function ResetLinkSentPage() {
  const router = useRouter();
  const { ready, resetEmail, clearPasswordReset } = useAuth();

  if (!ready) {
    return (
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-7">
        <div className="skeleton mx-auto h-16 w-16 rounded-full" />
        <div className="skeleton mx-auto mt-5 h-6 w-48" />
        <div className="skeleton mx-auto mt-3 h-4 w-full max-w-[340px]" />
        <div className="skeleton mt-7 h-11 w-full" />
      </div>
    );
  }

  if (!resetEmail) {
    return (
      <AuthStatus
        tone="warning"
        Icon={MailQuestion}
        title="No reset link requested"
        message="We don't have an email address to send a reset link to yet. Start the process again from the previous screen."
      >
        <Btn variant="primary" size="lg" className="w-full" onClick={() => router.push("/forgot-password")}>
          Enter Email
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
      Icon={MailCheck}
      eyebrow="Password reset"
      title="Reset link sent"
      message={
        <>
          We&apos;ve sent a password reset link to{" "}
          <strong className="font-semibold text-[var(--theme-text)]">{maskEmail(resetEmail)}</strong>. Follow the link in that
          email to choose a new password.
        </>
      }
      footnote="Didn't get it? Check your spam folder, or request a new link in a few minutes."
    >
      <Btn
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => {
          clearPasswordReset();
          router.push("/login");
        }}
      >
        Back to Login
      </Btn>
      <Btn
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => {
          clearPasswordReset();
          router.push("/forgot-password");
        }}
      >
        Try another email
      </Btn>
    </AuthStatus>
  );
}
