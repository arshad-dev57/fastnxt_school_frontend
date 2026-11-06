/* ============================================================================
   FastNxt — Panel registry (single source of truth)
   ---------------------------------------------------------------------------
   The three workspaces a signed-in user can open. Shared by the Panel Switcher
   and post-login redirects, so the panel list and landing route live in one place.

   SCOPE: pure front-end routing — no authentication, permissions or API.
   Adding a Parent / Accountant / HR panel later means pushing one more entry
   into PANELS; the switcher picks it up for free.
   ========================================================================== */

import { GraduationCap, LayoutDashboard, User, type LucideIcon } from "lucide-react";

export type PanelId = "admin" | "teacher" | "student";

export type PanelOption = {
  id: PanelId;
  /** Full name, e.g. "Admin Panel" (used by the switcher). */
  label: string;
  /** One-word name, e.g. "Admin" (compact UI / switcher). */
  short: string;
  /** One-line description of what the panel is for. */
  blurb: string;
  /** Landing screen of the panel — what navigation targets. */
  href: string;
  Icon: LucideIcon;
};

export const PANELS: PanelOption[] = [
  {
    id: "admin",
    label: "Admin Panel",
    short: "Admin",
    blurb: "School-wide management, staff and settings",
    href: "/dashboard",
    Icon: LayoutDashboard,
  },
  {
    id: "teacher",
    label: "Teacher Panel",
    short: "Teacher",
    blurb: "Classes, attendance and grading",
    href: "/teacher",
    Icon: GraduationCap,
  },
  {
    id: "student",
    label: "Student Panel",
    short: "Student",
    blurb: "Timetable, results and homework",
    href: "/student",
    Icon: User,
  },
];

export const DEFAULT_PANEL: PanelId = "admin";

/** Which panel a URL belongs to. The Teacher and Student panels live in their
    own route trees (/teacher/*, /student/*); every other Admin route falls
    through to "admin", so /students, /fees, /accounts … read as the Admin Panel. */
export function panelFromPath(pathname: string | null): PanelId {
  const path = pathname ?? "";
  if (path === "/teacher" || path.startsWith("/teacher/")) return "teacher";
  if (path === "/student" || path.startsWith("/student/")) return "student";
  return "admin";
}

export function isPanelId(value: unknown): value is PanelId {
  return value === "admin" || value === "teacher" || value === "student";
}

/** Panel lookup that never returns undefined (falls back to the first panel). */
export function panelById(id: PanelId): PanelOption {
  return PANELS.find((p) => p.id === id) ?? PANELS[0];
}
