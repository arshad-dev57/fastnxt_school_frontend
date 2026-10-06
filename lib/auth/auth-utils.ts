/* ============================================================================
   BisonsEduCore360 — Authentication form helpers (frontend only)
   ---------------------------------------------------------------------------
   Small, dependency-free helpers shared by the auth screens: email masking for
   the "verify your email" screen, lightweight client-side form validation and
   the country list used by school registration.

   NOTE: none of this authenticates anything — it only makes the demo UI feel
   like a real product. Real validation/authorization must happen on the server
   once a backend is plugged in.
   ========================================================================== */

/** `amara.reyes@school.edu` → `am***@school.edu` (masked for display). */
export function maskEmail(email: string): string {
  const value = (email ?? "").trim();
  const at = value.indexOf("@");
  if (at <= 0) return value;
  const local = value.slice(0, at);
  const domain = value.slice(at);
  const head = local.slice(0, Math.min(2, local.length));
  const tail = local.length > 3 ? local.slice(-1) : "";
  const stars = "*".repeat(Math.max(2, local.length - head.length - tail.length));
  return `${head}${stars}${tail}${domain}`;
}

/** Deliberately permissive — enough to catch typos in a demo, nothing more. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email ?? "").trim());
}

export const COUNTRIES = [
  "Pakistan", "India", "Bangladesh", "Sri Lanka", "Nepal", "Afghanistan",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain",
  "Turkey", "Malaysia", "Indonesia", "Singapore", "China", "Japan", "South Korea",
  "United Kingdom", "United States", "Canada", "Australia", "New Zealand",
  "Germany", "France", "Netherlands", "Spain", "Italy", "South Africa",
  "Nigeria", "Kenya", "Egypt", "Brazil", "Other",
] as const;

/** Minimum password length shown as a hint on the registration form. */
export const MIN_PASSWORD_LENGTH = 8;
