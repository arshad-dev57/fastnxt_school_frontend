/* ============================================================================
   BisonsEduCore360 — Role + Branch Access Control
   ---------------------------------------------------------------------------
   Permissions are the combination of (module × action × branch scope).
   This is the single source of truth for the Role & Permissions screen and for
   UI-level gating. Once an API exists, the server MUST enforce the same rules.
   ========================================================================== */

import type { PermissionAction, BranchScope, Permission, UserRole } from "@/lib/branch";

export type AccessModule =
  | "dashboard"
  | "admissions"
  | "students"
  | "families"
  | "classes"
  | "subjects"
  | "timetable"
  | "attendance"
  | "exams"
  | "results"
  | "homework"
  | "certificates"
  | "fees"
  | "accounts"
  | "payroll"
  | "employees"
  | "recruitment"
  | "leave"
  | "library"
  | "transport"
  | "hostel"
  | "health"
  | "discipline"
  | "inventory"
  | "assets"
  | "frontoffice"
  | "communication"
  | "events"
  | "meetings"
  | "tasks"
  | "complaints"
  | "reports"
  | "audit"
  | "users"
  | "settings";

export type ModuleMeta = { key: AccessModule; label: string; group: string };

export const ACCESS_MODULES: ModuleMeta[] = [
  { key: "dashboard", label: "Dashboard", group: "General" },
  { key: "admissions", label: "Admissions", group: "Academics" },
  { key: "students", label: "Students", group: "Academics" },
  { key: "families", label: "Families", group: "Academics" },
  { key: "classes", label: "Classes", group: "Academics" },
  { key: "subjects", label: "Subjects", group: "Academics" },
  { key: "timetable", label: "Timetable", group: "Academics" },
  { key: "attendance", label: "Attendance", group: "Academics" },
  { key: "exams", label: "Exams", group: "Examinations" },
  { key: "results", label: "Results", group: "Examinations" },
  { key: "homework", label: "Homework / LMS", group: "Examinations" },
  { key: "certificates", label: "Certificates", group: "Examinations" },
  { key: "fees", label: "Fees", group: "Finance" },
  { key: "accounts", label: "Accounting", group: "Finance" },
  { key: "payroll", label: "Payroll", group: "Finance" },
  { key: "employees", label: "Employees", group: "Human Resources" },
  { key: "recruitment", label: "Recruitment", group: "Human Resources" },
  { key: "leave", label: "Leave", group: "Human Resources" },
  { key: "library", label: "Library", group: "Operations" },
  { key: "transport", label: "Transport", group: "Operations" },
  { key: "hostel", label: "Hostel", group: "Operations" },
  { key: "health", label: "Health", group: "Operations" },
  { key: "discipline", label: "Discipline", group: "Operations" },
  { key: "inventory", label: "Inventory", group: "Operations" },
  { key: "assets", label: "Assets", group: "Operations" },
  { key: "frontoffice", label: "Front Office", group: "Operations" },
  { key: "communication", label: "Communication", group: "Communication" },
  { key: "events", label: "Events", group: "Communication" },
  { key: "meetings", label: "Meetings", group: "Communication" },
  { key: "tasks", label: "Tasks", group: "Workspace" },
  { key: "complaints", label: "Complaints", group: "Workspace" },
  { key: "reports", label: "Reports", group: "Management" },
  { key: "audit", label: "Audit Log", group: "Management" },
  { key: "users", label: "User Management", group: "System" },
  { key: "settings", label: "Settings", group: "System" },
];

export const ALL_MODULE_KEYS: AccessModule[] = ACCESS_MODULES.map((m) => m.key);

export const PERMISSION_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "manage"];

type RoleDef = {
  role: UserRole;
  label: string;
  scope: BranchScope;
  description: string;
  /** Modules the role can reach (default action set is applied to each). */
  modules: AccessModule[] | "*";
  /** Optional per-module action override. */
  actions?: Partial<Record<AccessModule, PermissionAction[]>>;
  defaultActions: PermissionAction[];
};

const FULL: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "manage"];
const ACADEMIC: PermissionAction[] = ["view", "create", "edit", "export"];

const ACADEMIC_MODULES: AccessModule[] = [
  "dashboard", "admissions", "students", "families", "classes", "subjects", "timetable",
  "attendance", "exams", "results", "homework", "certificates", "fees", "employees",
  "recruitment", "leave", "library", "transport", "hostel", "health", "discipline",
  "inventory", "assets", "frontoffice", "communication", "events", "meetings", "tasks", "complaints", "reports",
];

export const ROLE_DEFS: RoleDef[] = [
  {
    role: "Super Admin", label: "Super Admin", scope: "all",
    description: "Unrestricted access to every module and every campus.",
    modules: "*", defaultActions: FULL,
  },
  {
    role: "Owner", label: "Owner", scope: "all",
    description: "Institution owner — consolidated reporting across all campuses.",
    modules: "*", defaultActions: FULL,
  },
  {
    role: "Principal", label: "Principal", scope: "branch",
    description: "Runs a single campus: academics, staff, fees and reports.",
    modules: ACADEMIC_MODULES,
    actions: { fees: ["view", "approve", "export"] },
    defaultActions: ACADEMIC,
  },
  {
    role: "Branch Admin", label: "Branch Admin", scope: "branch",
    description: "Day-to-day administration of one campus.",
    modules: ACADEMIC_MODULES,
    defaultActions: ACADEMIC,
  },
  {
    role: "Academic Coordinator", label: "Academic Coordinator", scope: "branch",
    description: "Oversees academics: classes, timetable, exams and results.",
    modules: ["dashboard", "students", "classes", "subjects", "timetable", "attendance", "exams", "results", "homework", "certificates", "communication", "events", "meetings", "reports"],
    defaultActions: ACADEMIC,
  },
  {
    role: "Teacher", label: "Teacher", scope: "own",
    description: "Own classes only: attendance, homework, marks and lesson plans.",
    modules: ["dashboard", "classes", "students", "timetable", "attendance", "homework", "exams", "results", "communication", "meetings", "tasks", "leave", "payroll", "settings"],
    actions: {
      leave: ["view", "create", "edit", "approve"],
      payroll: ["view"],
      settings: ["view"],
      students: ["view"],
      classes: ["view"],
    },
    defaultActions: ["view", "create", "edit"],
  },
  {
    role: "Accountant", label: "Accountant", scope: "multiple",
    description: "Fees, receipts and accounting for assigned campuses.",
    modules: ["dashboard", "fees", "accounts", "reports", "students"],
    actions: { students: ["view", "export"] },
    defaultActions: ["view", "create", "edit", "export"],
  },
  {
    role: "HR Manager", label: "HR Manager", scope: "branch",
    description: "Employees, recruitment, leave, payroll and performance.",
    modules: ["dashboard", "employees", "recruitment", "leave", "payroll", "reports", "communication"],
    defaultActions: ["view", "create", "edit", "approve", "export"],
  },
  {
    role: "Receptionist", label: "Receptionist", scope: "branch",
    description: "Front office: enquiries, visitors, gate passes and calls.",
    modules: ["dashboard", "frontoffice", "admissions", "students", "communication", "tasks"],
    defaultActions: ["view", "create"],
  },
  {
    role: "Librarian", label: "Librarian", scope: "branch",
    description: "Catalogue, issue, return and fines for one campus library.",
    modules: ["dashboard", "library", "students", "reports"],
    defaultActions: ["view", "create", "edit"],
  },
  {
    role: "Transport Manager", label: "Transport Manager", scope: "branch",
    description: "Vehicles, routes, drivers and transport assignments.",
    modules: ["dashboard", "transport", "students", "reports"],
    defaultActions: ["view", "create", "edit"],
  },
  {
    role: "Hostel Warden", label: "Hostel Warden", scope: "branch",
    description: "Hostel rooms, allocation, out-passes and mess.",
    modules: ["dashboard", "hostel", "students", "health", "reports"],
    defaultActions: ["view", "create", "edit"],
  },
  {
    role: "Parent", label: "Parent", scope: "own",
    description: "Parent portal — only their own children's records.",
    modules: ["attendance", "exams", "results", "fees", "homework", "communication", "events", "meetings", "leave", "complaints", "transport", "library", "timetable"],
    defaultActions: ["view"],
  },
  {
    role: "Student", label: "Student", scope: "own",
    description: "Student portal — own timetable, homework, results and library.",
    modules: ["dashboard", "timetable", "attendance", "exams", "results", "homework", "library", "events", "communication", "meetings", "certificates", "leave", "settings"],
    actions: { leave: ["view", "create"], settings: ["view"] },
    defaultActions: ["view"],
  },
];

export const BRANCH_SCOPES: BranchScope[] = ["own", "branch", "multiple", "all"];

export const SCOPE_LABELS: Record<BranchScope, string> = {
  own: "Own records only",
  branch: "Single campus",
  multiple: "Multiple campuses",
  all: "All campuses",
};

/** Resolve the effective permission list for a role. */
export function getRolePermissions(role: UserRole): Permission[] {
  const def = ROLE_DEFS.find((r) => r.role === role);
  if (!def) return [];
  const modules = def.modules === "*" ? ALL_MODULE_KEYS : def.modules;
  return modules.flatMap((m) =>
    (def.actions?.[m] ?? def.defaultActions).map((action) => ({ module: m, action, branchScope: def.scope })),
  );
}

export function getRoleDef(role: UserRole): RoleDef | undefined {
  return ROLE_DEFS.find((r) => r.role === role);
}

export function roleHasPermission(role: UserRole, module: AccessModule, action: PermissionAction): boolean {
  return getRolePermissions(role).some((p) => p.module === module && p.action === action);
}

/** Flat map key used by the Roles UI and the session payload. */
export function permissionKey(module: string, action: string) {
  return `${module}::${action}`;
}

export type PermissionMap = Record<string, boolean>;

/** Modules a role can see at all (used to softly filter navigation). */
export function accessibleModules(role: UserRole): Set<string> {
  return new Set(getRolePermissions(role).filter((p) => p.action === "view").map((p) => p.module));
}

export function roleScope(role: UserRole): BranchScope {
  return getRoleDef(role)?.scope ?? "own";
}

export const DEFAULT_ROLE_LIST: UserRole[] = ROLE_DEFS.map((r) => r.role);

/** Normalize legacy / alternate role labels onto the catalog. */
export function normalizeUserRole(role: string | null | undefined): UserRole {
  const raw = String(role || "").trim();
  if (raw === "Admin" || raw === "Administrator") return "Super Admin";
  if ((DEFAULT_ROLE_LIST as string[]).includes(raw)) return raw as UserRole;
  return "Receptionist";
}

/** Seed a boolean map from ROLE_DEFS (used when the API has no custom matrix). */
export function permissionMapFromRole(role: UserRole): PermissionMap {
  const all: PermissionMap = {};
  for (const p of getRolePermissions(role)) {
    all[permissionKey(p.module, p.action)] = true;
  }
  return all;
}

export function mapHasPermission(
  map: PermissionMap | null | undefined,
  module: AccessModule,
  action: PermissionAction = "view",
): boolean {
  if (!map) return false;
  return map[permissionKey(module, action)] === true;
}

/** Prefer a non-empty API map; otherwise fall back to ROLE_DEFS for the role. */
export function resolvePermissionMap(
  role: UserRole,
  apiMap: PermissionMap | null | undefined,
): PermissionMap {
  if (apiMap && Object.keys(apiMap).length > 0) return apiMap;
  return permissionMapFromRole(role);
}

export function permissionsFromMap(map: PermissionMap, scope: BranchScope = "branch"): Permission[] {
  const out: Permission[] = [];
  for (const [key, on] of Object.entries(map)) {
    if (!on) continue;
    const [module, action] = key.split("::");
    if (!module || !action) continue;
    out.push({ module, action: action as PermissionAction, branchScope: scope });
  }
  return out;
}

export function accessibleModulesFromMap(map: PermissionMap): Set<string> {
  return new Set(
    Object.entries(map)
      .filter(([key, on]) => on && key.endsWith("::view"))
      .map(([key]) => key.replace(/::view$/, "")),
  );
}

/** Grouped module matrix used by the Roles & Permissions screen. */
export function groupedModules(): { group: string; modules: ModuleMeta[] }[] {
  const groups: { group: string; modules: ModuleMeta[] }[] = [];
  for (const m of ACCESS_MODULES) {
    const found = groups.find((g) => g.group === m.group);
    if (found) found.modules.push(m);
    else groups.push({ group: m.group, modules: [m] });
  }
  return groups;
}

