"use client";

/* ============================================================================
   BisonsEduCore360 — Authentication context (real API session)
   ---------------------------------------------------------------------------
   The session is owned by the API (../bisonseducore360_backend) and travels in
   the httpOnly `bisons_session` cookie, so nothing sensitive is ever kept in
   localStorage. This context only mirrors the *decoded* session the API returns
   so the UI can render the school, the subscription badge and the panel.

   Lifecycle
     • mount         → GET  /api/auth/me        (restore the session after F5)
     • login form    → POST /api/auth/login     (cookie set by the API)
     • register form → POST /api/auth/register  (school + admin + 5-day trial)
     • Logout page   → POST /api/auth/logout    (cookie cleared by the API)

   The active panel is taken from `user.panel` on the API session (and mirrored
   in localStorage so the UI preference stays in sync after sign-in).
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { asResult, authApi, describeApiError } from "./api-client";
import { DEFAULT_PANEL, isPanelId, type PanelId } from "./panels";
import type { AuthSubscription, AuthUser, RegisterSchoolInput } from "./types";

/** Where the signed-in user stands. */
export type AuthStatus = "loading" | "authenticated" | "anonymous";

/**
 * The school as the UI consumes it. `schoolName` is the API's `name` — renamed
 * here so it never collides with the *person's* name on the auth screens.
 */
export type SchoolSnapshot = {
  id: string | null;
  schoolName: string;
  shortName?: string | null;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  logoUrl?: string | null;
  isActive: boolean;
};

const PANEL_STORAGE_KEY = "bisons:panel";

export type AuthContextValue = {
  /** False until `GET /auth/me` has settled — render skeletons meanwhile. */
  ready: boolean;
  status: AuthStatus;
  /** True only once the API has accepted the session. */
  signedIn: boolean;
  /** The authenticated admin, straight from the API (never a password hash). */
  user: AuthUser | null;
  /** The school, reshaped for the UI. `null` for a visitor with no session. */
  school: SchoolSnapshot | null;
  subscription: AuthSubscription | null;
  emailVerified: boolean;
  /** Workspace panel from the account (`user.panel`), mirrored in localStorage. */
  panel: PanelId;
  /** Email of the current session, handy for prefilling the login form. */
  accountEmail: string | null;
  /** Message from the last failed request; cleared on the next attempt. */
  error: string | null;

  /** POST /api/auth/login. Throws `ApiError` on bad credentials. */
  signIn: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  /** POST /api/auth/register. Throws `ApiError` (e.g. 409 EMAIL_IN_USE). */
  registerSchool: (input: RegisterSchoolInput) => Promise<AuthUser>;
  /** POST /api/auth/logout — clears the cookie, then the local session. */
  signOut: () => Promise<void>;
  /** Re-read the session from the API. Safe to call at any time. */
  refresh: () => Promise<AuthUser | null>;
  setPanel: (panel: PanelId) => void;
  clearError: () => void;

  /* ── Password reset ─────────────────────────────────────────────────────
     The API has no reset endpoint yet, so these only drive the two UI screens
     (/forgot-password and /forgot-password/sent). They are clearly separated
     from the real calls above so nothing here looks like a working reset. */
  requestPasswordReset: (email: string) => void;
  resetEmail: string | null;
  clearPasswordReset: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map `AuthUser.school` (API shape) onto the shape the auth screens expect. */
function toSchoolSnapshot(user: AuthUser | null): SchoolSnapshot | null {
  if (!user?.school) return null;
  return {
    id: user.school.id,
    schoolName: user.school.name,
    shortName: user.school.shortName || null,
    ownerName: user.school.ownerName,
    email: user.school.email,
    phone: user.school.phone,
    country: user.school.country,
    city: user.school.city,
    logoUrl: user.school.logoUrl || null,
    isActive: user.school.isActive !== false,
  };
}

/* ── Panel preference: a tiny external store over localStorage ───────────────
   Read through `useSyncExternalStore` rather than a mount effect, because the
   value exists outside React. `getServerSnapshot` pins the server render (and
   the hydration pass) to DEFAULT_PANEL, so a remembered panel can never cause a
   hydration mismatch. `getSnapshot` returns a string, so the value is stable by
   identity and React will not loop. */

const panelListeners = new Set<() => void>();

/** Other tabs writing the key re-read it for free via the `storage` event. */
function subscribePanel(onChange: () => void) {
  panelListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    panelListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Never throws — private mode blocks storage entirely. */
function readStoredPanel(): PanelId {
  try {
    const stored = window.localStorage.getItem(PANEL_STORAGE_KEY);
    return isPanelId(stored) ? stored : DEFAULT_PANEL;
  } catch {
    return DEFAULT_PANEL;
  }
}

const serverPanel = () => DEFAULT_PANEL;

/** Persist and notify the current tab (the `storage` event only fires elsewhere). */
function writeStoredPanel(next: PanelId) {
  try {
    window.localStorage.setItem(PANEL_STORAGE_KEY, next);
  } catch {
    // Storage disabled — the panel just won't be remembered.
  }
  panelListeners.forEach((notify) => notify());
}

/**
 * Read the current session. Deliberately side-effect free so it can be called
 * from an effect body: it resolves to the user (or `null` when the cookie is
 * missing/expired) plus an optional message worth showing the user.
 */
async function fetchSession(): Promise<{ user: AuthUser | null; problem: string | null }> {
  const result = await asResult(() => authApi.me());
  if (result.ok) return { user: result.data.user, problem: null };

  // 401 / school deactivated are expected "not signed in" answers.
  const expected =
    result.code === "UNAUTHORIZED" ||
    result.code === "FORBIDDEN" ||
    result.code === "SCHOOL_DEACTIVATED";
  return { user: null, problem: expected ? null : result.message };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  /* The panel is external state (localStorage), not React state. */
  const panel = useSyncExternalStore(subscribePanel, readStoredPanel, serverPanel);

  /* Guards state updates that resolve after the provider has been torn down. */
  const mounted = useRef(true);

  /** Adopt a session returned by the API (or clear it with `null`). */
  const adopt = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    setStatus(nextUser ? "authenticated" : "anonymous");
    // Keep the stored panel aligned with the account so refresh / deep links
    // open the workspace the server assigned (admin / teacher / student).
    if (nextUser && isPanelId(nextUser.panel)) {
      writeStoredPanel(nextUser.panel);
    }
  }, []);

  /** Apply the outcome of a session read. Only ever called from a callback. */
  const applySession = useCallback(
    (session: { user: AuthUser | null; problem: string | null }) => {
      if (session.problem) setError(session.problem);
      adopt(session.user);
    },
    [adopt]
  );

  /* Restore the session on first paint so a refresh does not sign you out. The
     state update happens inside the `.then` callback, never synchronously in the
     effect body — see `fetchSession`, which is intentionally side-effect free. */
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    fetchSession().then((session) => {
      if (cancelled || !mounted.current) return;
      applySession(session);
    });

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [applySession]);

  /* Platform admin deactivated this school mid-session — drop local state. */
  useEffect(() => {
    const onDeactivated = () => {
      if (!mounted.current) return;
      setError("This school has been deactivated. Please contact support.");
      adopt(null);
      void authApi.logout().catch(() => {});
    };
    window.addEventListener("bisons:school-deactivated", onDeactivated);
    return () => window.removeEventListener("bisons:school-deactivated", onDeactivated);
  }, [adopt]);

  /** Re-read the session cookie from the API. Never throws. */
  const refresh = useCallback(
    () =>
      fetchSession().then((session) => {
        if (!mounted.current) return null;
        applySession(session);
        return session.user;
      }),
    [applySession]
  );

  const signIn = useCallback(
    async (email: string, password: string, remember = true) => {
      setError(null);
      try {
        const data = await authApi.login({ email: email.trim(), password, remember });
        adopt(data.user);
        return data.user;
      } catch (err) {
        setError(describeApiError(err).message);
        adopt(null);
        throw err;
      }
    },
    [adopt]
  );

  const registerSchool = useCallback(
    async (input: RegisterSchoolInput) => {
      setError(null);
      try {
        const data = await authApi.register(input);
        // The API returns a full session, so registration signs the user in.
        adopt(data.user);
        return data.user;
      } catch (err) {
        setError(describeApiError(err).message);
        throw err;
      }
    },
    [adopt]
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the API is unreachable the local session must still be dropped.
    }
    if (!mounted.current) return;
    setError(null);
    setResetEmail(null);
    adopt(null);
  }, [adopt]);

  const setPanel = useCallback((next: PanelId) => writeStoredPanel(next), []);

  const clearError = useCallback(() => setError(null), []);
  const requestPasswordReset = useCallback((email: string) => setResetEmail(email.trim()), []);
  const clearPasswordReset = useCallback(() => setResetEmail(null), []);

  const school = useMemo(() => toSchoolSnapshot(user), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready: status !== "loading",
      status,
      signedIn: status === "authenticated",
      user,
      school,
      subscription: user?.subscription ?? null,
      emailVerified: user?.emailVerified ?? false,
      panel,
      accountEmail: user?.email ?? null,
      error,
      signIn,
      registerSchool,
      signOut,
      refresh,
      setPanel,
      clearError,
      requestPasswordReset,
      resetEmail,
      clearPasswordReset,
    }),
    [
      status, user, school, panel, error, resetEmail,
      signIn, registerSchool, signOut, refresh, setPanel, clearError,
      requestPasswordReset, clearPasswordReset,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
