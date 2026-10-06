"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, TriangleAlert } from "lucide-react";
import { Btn, Field } from "@/components/ui";
import AuthCard from "@/components/auth/auth-card";
import DemoNote from "@/components/auth/demo-note";
import IconInput from "@/components/auth/icon-input";
import { useAuth } from "@/lib/auth/auth-context";
import { isValidEmail } from "@/lib/auth/auth-utils";

/* ============================================================================
   Forgot Password — step 1 (enter the registered email).
   No reset email is actually sent; the flow only moves to the "sent" screen.
   ========================================================================== */

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter the email address you registered with.");
      return;
    }
    setError("");
    setPending(true);
    requestPasswordReset(email.trim());
    window.setTimeout(() => router.push("/forgot-password/sent"), 500);
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email address your school account uses and we'll send you a link to reset it."
      footer={
        <span className="text-[var(--theme-text-muted)]">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
            Back to Sign In
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          <Field label="Email Address">
            <IconInput
              icon={Mail}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
            />
          </Field>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
              <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {error}
            </p>
          )}

          <Btn
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            loadingLabel="Sending link…"
            IconRight={pending ? undefined : ArrowRight}
            className="w-full"
          >
            Send Reset Link
          </Btn>
        </div>
      </form>

      <DemoNote>Demo mode — no reset email is sent. The next screen only simulates the confirmation.</DemoNote>
    </AuthCard>
  );
}
