/* ============================================================================
   Session cookie name — shared, import-free constant.
   ---------------------------------------------------------------------------
   Kept in its own module with ZERO imports so both the Proxy (edge-safe, runs
   before routing) and the Node route handlers can reference the same name
   without dragging `node:sqlite` / `next/headers` into the Proxy bundle.
   ========================================================================== */

export const SESSION_COOKIE = "bisons_session";

/** Cookie lifetime when "Remember me" is ticked (seconds). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days