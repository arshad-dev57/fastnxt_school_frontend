"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, TriangleAlert } from "lucide-react";
import { Btn, Checkbox, Field } from "@/components/ui";
import AuthCard from "@/components/auth/auth-card";
import DemoNote from "@/components/auth/demo-note";
import IconInput from "@/components/auth/icon-input";
import PasswordInput from "@/components/auth/password-input";
import { useAuth } from "@/lib/auth/auth-context";
import { describeApiError } from "@/lib/auth/api-client";
import { postAuthRoute } from "@/lib/auth/subscription";

/* ============================================================================
   Sign in — role comes from the account, not from a login selector.
   ---------------------------------------------------------------------------
   Credentials are checked by POST /api/auth/login; on success the API sets the
   httpOnly `bisons_session` cookie and returns `user` (including subscription).
   An active plan opens the workspace; an expired plan opens /subscription.
   ========================================================================== */

export default function LoginPage() {
  const router = useRouter();
  const { accountEmail, signIn, ready, signedIn, user } = useAuth();

  /* `null` means "the user hasn't typed anything yet", so the field falls back to
     the address the current session uses — the register → sign-in hand-off stays
     continuous without an effect that would fight the input. */
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const email = typedEmail ?? accountEmail ?? "";

  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  /* Already signed in (or restored from the cookie on refresh)? Skip the form.
     Uses subscription from the existing session — no extra API call. */
  useEffect(() => {
    if (ready && signedIn) router.replace(postAuthRoute(user));
  }, [ready, signedIn, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!address || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setError("");
    setPending(true);

    try {
      const signedInUser = await signIn(address, password, remember);
      router.replace(postAuthRoute(signedInUser));
    } catch (err) {
      const { message, errors } = describeApiError(err);
      setError(errors.length > 0 ? `${message} — ${errors.join(", ")}` : message);
      setPending(false);
    }
  };

  return (
    <AuthCard
      title="Welcome to BisonsEduCore360"
      subtitle="Sign in with your school email — we'll open the right workspace for your account."
      footer={
        <span className="text-[var(--theme-text-muted)]">
          New school?{" "}
          <Link href="/register" className="font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]">
            Create School Account
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
              onChange={(e) => setTypedEmail(e.target.value)}
            />
          </Field>

          <Field label="Password">
            <PasswordInput
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[14px] text-[var(--theme-text-muted)]">
              <Checkbox checked={remember} onChange={setRemember} />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-[14px] font-medium text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]"
            >
              Forgot Password?
            </Link>
          </div>

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
            loadingLabel="Signing in…"
            IconRight={pending ? undefined : ArrowRight}
            className="w-full"
          >
            Sign In
          </Btn>
        </div>
      </form>

      <DemoNote>
        Sign in with the email and password for your account. Admin, teacher, and
        student users all use this same form — your panel opens automatically.
      </DemoNote>
    </AuthCard>
  );
}
