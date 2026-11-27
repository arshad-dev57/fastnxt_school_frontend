/** Public legal / Google OAuth verification copy. */

export const APP_NAME = "FastNxt";
export const SUPPORT_EMAIL = "info@fastnxt.com";
export const APP_DOMAIN = "school.fastnxt.com";
export const APP_ORIGIN = `https://${APP_DOMAIN}`;
export const LEGAL_LAST_UPDATED = "November 27, 2026";

/** Google OAuth scopes requested for Meet link creation (see backend google-oauth.service). */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
] as const;

export const GOOGLE_USER_DATA_POLICY_URL =
  "https://developers.google.com/terms/api-services-user-data-policy";
