/* ============================================================================
   Subscription helpers — pure client-side checks against the session payload
   already returned by login / GET /auth/me. No extra API calls.
   ========================================================================== */

import { DEFAULT_PANEL, isPanelId, panelById } from "@/lib/auth/panels";
import type { AuthSubscription, AuthUser } from "@/lib/auth/types";

export const SUBSCRIPTION_PATH = "/subscription";
export const SUPPORT_EMAIL = "";

/** Trial = 5 days; paid plans are Monthly / Yearly (server-enforced). */
export const PLAN_INFO = [
  { id: "TRIAL", label: "Trial", detail: "5 days free access after registration" },
  { id: "MONTHLY", label: "Monthly", detail: "30 days of full school access" },
  { id: "YEARLY", label: "Yearly", detail: "365 days of full school access" },
] as const;

/** True while the school may use the product. */
export function hasActiveSubscription(sub: AuthSubscription | null | undefined): boolean {
  if (!sub) return false;
  return Boolean(sub.active) && !sub.isExpired && sub.status !== "EXPIRED";
}

/** Platform kill-switch — school cannot use the product at all. */
export function isSchoolActive(user: AuthUser | null | undefined): boolean {
  if (!user?.school) return false;
  return user.school.isActive !== false;
}

/** Where to send the user after a successful sign-in / session restore. */
export function postAuthRoute(user: AuthUser | null | undefined): string {
  if (!user) return "/login";
  if (!isSchoolActive(user)) return "/login";
  if (!hasActiveSubscription(user.subscription)) return SUBSCRIPTION_PATH;
  return panelById(isPanelId(user.panel) ? user.panel : DEFAULT_PANEL).href;
}
