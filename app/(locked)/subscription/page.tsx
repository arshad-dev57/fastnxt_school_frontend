"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, Mail, ShieldAlert, ShieldCheck, LogOut } from "lucide-react";
import { Btn } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  hasActiveSubscription,
  PLAN_INFO,
  SUPPORT_EMAIL,
  postAuthRoute,
} from "@/lib/auth/subscription";

export default function SubscriptionPlanPage() {
  const router = useRouter();
  const { ready, signedIn, user, school, subscription, signOut } = useAuth();
  const active = hasActiveSubscription(subscription);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      router.replace("/login");
      return;
    }
    if (school?.isActive === false || user?.school?.isActive === false) {
      void signOut().finally(() => router.replace("/login"));
    }
  }, [ready, signedIn, school, user, router, signOut]);

  const schoolName = school?.schoolName || user?.school?.name || "Your school";
  const planLabel = subscription?.isTrial
    ? "Trial"
    : subscription?.plan === "YEARLY"
      ? "Yearly"
      : subscription?.plan === "MONTHLY"
        ? "Monthly"
        : subscription?.plan || "Trial";
  const expiresOn = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--theme-bg)] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm sm:p-8">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            active
              ? "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"
              : "bg-[var(--theme-warning-soft)] text-[var(--theme-warning-text)]"
          }`}
        >
          {active ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
        </div>

        <h1 className="mt-4 text-[22px] font-bold tracking-tight text-[var(--theme-text)]">
          {active ? "Your plan" : "Subscription expired"}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--theme-text-muted)]">
          {active ? (
            <>
              <strong className="text-[var(--theme-text)]">{schoolName}</strong> is on the{" "}
              <strong className="text-[var(--theme-text)]">{planLabel}</strong> plan
              {expiresOn ? (
                <>
                  {" "}
                  (renews / ends <strong className="text-[var(--theme-text)]">{expiresOn}</strong>)
                </>
              ) : null}
              {subscription?.daysRemaining != null && subscription.daysRemaining > 0 ? (
                <>
                  {" "}
                  · {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? "s" : ""} left
                </>
              ) : null}
              .
            </>
          ) : (
            <>
              Access for <strong className="text-[var(--theme-text)]">{schoolName}</strong> is paused
              because the current plan is no longer active
              {expiresOn ? (
                <>
                  {" "}
                  (ended <strong className="text-[var(--theme-text)]">{expiresOn}</strong>)
                </>
              ) : null}
              . Last plan: <strong className="text-[var(--theme-text)]">{planLabel}</strong>.
            </>
          )}
        </p>

        <div className="mt-5 space-y-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-subtle)] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
            Available plans
          </p>
          {PLAN_INFO.map((plan) => (
            <div key={plan.id} className="flex items-start gap-3 text-[14px]">
              {plan.id === "TRIAL" ? (
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
              ) : (
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
              )}
              <div>
                <p className="font-medium text-[var(--theme-text)]">{plan.label}</p>
                <p className="text-[13px] text-[var(--theme-text-muted)]">{plan.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[var(--theme-primary)]/25 bg-[var(--theme-primary-soft)] p-4">
          <p className="text-[13px] font-medium text-[var(--theme-primary-hover)]">
            {active
              ? "To change or renew your plan, contact BisonsTechs:"
              : "To activate Monthly or Yearly access, contact BisonsTechs:"}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${active ? "Change plan" : "Activate plan"} — ${schoolName}`)}`}
            className="mt-2 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--theme-primary)] hover:underline"
          >
            <Mail className="h-4 w-4" />
            {SUPPORT_EMAIL}
          </a>
          {!active && (
            <p className="mt-2 text-[12px] text-[var(--theme-text-muted)]">
              Once your plan is activated, sign in again and you will return to the normal dashboard.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Btn
            variant="primary"
            Icon={Mail}
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                `${active ? "Change plan" : "Activate plan"} — ${schoolName}`
              )}`;
            }}
          >
            Email support
          </Btn>
          {active ? (
            <Btn variant="secondary" Icon={ArrowLeft} onClick={() => router.push(postAuthRoute(user))}>
              Back to workspace
            </Btn>
          ) : (
            <Btn variant="secondary" Icon={LogOut} onClick={handleLogout}>
              Sign out
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
