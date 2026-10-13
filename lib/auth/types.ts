/* ============================================================================
   BisonsEduCore360 — Shared authentication types
   ---------------------------------------------------------------------------
   Plain, dependency-free types shared by the client (React context, API
   client). Nothing here imports server-only code, so it is safe to pull into
   client bundles.

   These mirror the JSON actually returned by the API in
   bisonseducore360_backend (src/services/auth/auth.service.js → serializeUser).
   Password hashes and session tokens never appear here — the API is
   contractually forbidden from returning them.
   ========================================================================== */

/** Subscription billing plan. TRIAL is the free window granted at signup. */
export type SubscriptionPlan = "TRIAL" | "MONTHLY" | "YEARLY";

/** Lifecycle status. `EXPIRED` is derived at read time from `expiresAt`. */
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED";

/** The registered institution. */
export type AuthSchool = {
  id: string;
  name: string;
  shortName?: string | null;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  logoUrl?: string | null;
  /** False when platform admin has deactivated the school. */
  isActive?: boolean;
};

/** School subscription, with the day counts computed server-side. */
export type AuthSubscription = {
  id: string | null;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  /** True while the subscription has not lapsed. */
  active: boolean;
  isTrial: boolean;
  isExpired: boolean;
  /** True when the plan is closing in (<= SUBSCRIPTION_WARNING_DAYS left). */
  needsAttention: boolean;
  /** Whole days left until expiry (0 once expired). */
  daysRemaining: number;
  /** Days left in the free trial (0 when not on a trial). */
  trialDaysRemaining: number;
  startedAt: string | null;
  expiresAt: string | null;
};

/** The signed-in school admin. Never carries the password hash. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Panel this user lands on after signing in. */
  panel: string;
  branchId?: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
    city?: string | null;
  } | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  school: AuthSchool | null;
  subscription: AuthSubscription;
  /**
   * Flat role matrix from Roles & Permissions (`"fees::view": true`).
   * Null/empty means the client should fall back to ROLE_DEFS defaults for `role`.
   */
  permissions?: Record<string, boolean> | null;
};

/** `data` payload of POST /api/auth/register and POST /api/auth/login. */
export type AuthResponse = {
  /** Bearer token — the httpOnly cookie is the primary transport. */
  token: string;
  user: AuthUser;
};

/** `data` payload of GET /api/auth/me. */
export type MeResponse = {
  user: AuthUser;
};

/** Payload accepted by POST /api/auth/register. */
export type RegisterSchoolInput = {
  schoolName: string;
  name: string;
  email: string;
  password: string;
  ownerName?: string;
  phone?: string;
  country?: string;
  city?: string;
  confirmPassword?: string;
};

/** Payload accepted by POST /api/auth/login. */
export type LoginInput = {
  email: string;
  password: string;
  /** Persist the session cookie across browser restarts ("Remember me"). */
  remember?: boolean;
};

/** Uniform success/failure result returned by the client API wrapper. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code: string; errors?: string[] };

/** Trial length in days — mirrors TRIAL_DAYS in the backend `.env`. */
export const TRIAL_DAYS = 5;