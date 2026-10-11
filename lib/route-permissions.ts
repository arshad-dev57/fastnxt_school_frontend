import type { AccessModule } from "@/lib/branch-access";

/**
 * Longest-prefix wins. `null` module = always allowed (account, logout, etc.).
 * Keep in sync with `lib/admin-nav.ts` modules.
 */
const ROUTE_MODULES: { prefix: string; module: AccessModule | null }[] = [
  { prefix: "/logout", module: null },
  { prefix: "/subscription", module: null },
  { prefix: "/settings/account", module: null },
  { prefix: "/notifications", module: null },
  { prefix: "/dashboard", module: "dashboard" },
  { prefix: "/admissions", module: "admissions" },
  { prefix: "/front-office", module: "frontoffice" },
  { prefix: "/students", module: "students" },
  { prefix: "/certificates", module: "certificates" },
  { prefix: "/classes", module: "classes" },
  { prefix: "/subjects", module: "subjects" },
  { prefix: "/employees/job-letters", module: "recruitment" },
  { prefix: "/employees", module: "employees" },
  { prefix: "/recruitment", module: "recruitment" },
  { prefix: "/accounts", module: "accounts" },
  { prefix: "/fees", module: "fees" },
  { prefix: "/families", module: "families" },
  { prefix: "/attendance", module: "attendance" },
  { prefix: "/timetable", module: "timetable" },
  { prefix: "/exams", module: "exams" },
  { prefix: "/results", module: "results" },
  { prefix: "/homework", module: "homework" },
  { prefix: "/leave", module: "leave" },
  { prefix: "/payroll", module: "payroll" },
  { prefix: "/library", module: "library" },
  { prefix: "/transport", module: "transport" },
  { prefix: "/hostel", module: "hostel" },
  { prefix: "/health", module: "health" },
  { prefix: "/discipline", module: "discipline" },
  { prefix: "/inventory", module: "inventory" },
  { prefix: "/assets", module: "assets" },
  { prefix: "/communication", module: "communication" },
  { prefix: "/events", module: "events" },
  { prefix: "/meetings", module: "meetings" },
  { prefix: "/tasks", module: "tasks" },
  { prefix: "/complaints", module: "complaints" },
  { prefix: "/reports", module: "reports" },
  { prefix: "/users", module: "users" },
  { prefix: "/audit", module: "audit" },
  { prefix: "/settings", module: "settings" },
];

/** Resolve the AccessModule for an admin-panel pathname (or null = open). */
export function moduleForPath(pathname: string): AccessModule | null | undefined {
  const path = pathname.split("?")[0] || "/";
  let best: { prefix: string; module: AccessModule | null } | null = null;
  for (const row of ROUTE_MODULES) {
    if (path === row.prefix || path.startsWith(row.prefix + "/")) {
      if (!best || row.prefix.length > best.prefix.length) best = row;
    }
  }
  return best ? best.module : undefined;
}
