/* ============================================================================
   Admin sidebar / rail catalog — every link carries the AccessModule used by
   role permissions (`can(module, "view")`) so nav stays in sync with Roles UI.
   ========================================================================== */

import type { IconType } from "@/components/ui";
import type { AccessModule } from "@/lib/branch-access";
import {
  Home, Users, Briefcase, Wallet, BarChart3, LayoutDashboard, School, BookOpen,
  ReceiptText, Users2, ShieldCheck, Settings, UserPlus, CalendarCheck, CalendarClock,
  GraduationCap, CalendarOff, Megaphone, Bus, Building2, HeartPulse, ShieldAlert,
  Boxes, ListChecks, MessageSquareWarning, NotebookPen, BedDouble, DoorOpen,
  TrendingUp, Video,
} from "lucide-react";

export type AdminNavChild = {
  label: string;
  href: string;
  /** Permission module required to see this link. Null = always visible. */
  module: AccessModule | null;
};

export type AdminNavGroup = {
  k: string;
  label: string;
  Icon: IconType;
  href?: string;
  /** For leaf groups (e.g. Dashboard) that have an href and no children. */
  module?: AccessModule | null;
  children: AdminNavChild[];
};

export type AdminRailItem = {
  k: string;
  label: string;
  Icon: IconType;
  href: string;
  module: AccessModule;
};

export type AdminRailGroup = { label: string; items: AdminRailItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  { k: "dashboard", label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard", module: "dashboard", children: [] },
  {
    k: "admissions_students", label: "Admissions & Students", Icon: UserPlus, children: [
      { label: "Admission Pipeline (Leads)", href: "/admissions", module: "admissions" },
      { label: "New Student Admission", href: "/students/new", module: "students" },
      { label: "Front Office & Visitors", href: "/front-office", module: "frontoffice" },
      { label: "All Enrolled Students", href: "/students", module: "students" },
      { label: "Admission Letters", href: "/students/admission-letters", module: "students" },
      { label: "Promote & Transfer Students", href: "/students/promote", module: "students" },
      { label: "Student ID Cards", href: "/students/id-cards", module: "students" },
      { label: "Print Student List", href: "/students/print-list", module: "students" },
      { label: "Certificates & Documents", href: "/certificates", module: "certificates" },
    ],
  },
  {
    k: "classes", label: "Classes", Icon: School, children: [
      { label: "All Classes", href: "/classes", module: "classes" },
      { label: "New Class", href: "/classes/new", module: "classes" },
    ],
  },
  {
    k: "subjects", label: "Subjects", Icon: BookOpen, children: [
      { label: "All Subjects", href: "/subjects", module: "subjects" },
      { label: "Classes with Subjects", href: "/subjects/classes", module: "subjects" },
      { label: "Assign Subjects", href: "/subjects/assign", module: "subjects" },
    ],
  },
  {
    k: "employees", label: "Employees", Icon: Briefcase, children: [
      { label: "All Employees", href: "/employees", module: "employees" },
      { label: "Add New Employee", href: "/employees/new", module: "employees" },
      { label: "Job Letters", href: "/employees/job-letters", module: "recruitment" },
    ],
  },
  {
    k: "accounts", label: "Accounting", Icon: Wallet, children: [
      { label: "Dashboard", href: "/accounts", module: "accounts" },
      { label: "Income & Expense", href: "/accounts/income", module: "accounts" },
      { label: "Add Expense", href: "/accounts/expense", module: "accounts" },
      { label: "Journal Entries", href: "/accounts/journal-entries", module: "accounts" },
      { label: "Receipt Vouchers", href: "/accounts/receipt-vouchers", module: "accounts" },
      { label: "Payment Vouchers", href: "/accounts/payment-vouchers", module: "accounts" },
      { label: "Chart of Accounts", href: "/accounts/chart-of-accounts", module: "accounts" },
      { label: "Account Statement", href: "/accounts/statement", module: "accounts" },
      { label: "General Ledger", href: "/accounts/general-ledger", module: "accounts" },
      { label: "Cash & Bank", href: "/accounts/cash-bank", module: "accounts" },
      { label: "Bank Reconciliation", href: "/accounts/bank-reconciliation", module: "accounts" },
      { label: "Fee Receivables", href: "/accounts/fee-receivables", module: "accounts" },
      { label: "Trial Balance", href: "/accounts/trial-balance", module: "accounts" },
      { label: "Profit & Loss", href: "/accounts/profit-loss", module: "accounts" },
      { label: "Balance Sheet", href: "/accounts/balance-sheet", module: "accounts" },
      { label: "Cash Flow", href: "/accounts/cash-flow", module: "accounts" },
      { label: "Accounting Reports", href: "/accounts/reports", module: "accounts" },
      { label: "Budgets", href: "/accounts/budgets", module: "accounts" },
    ],
  },
  {
    k: "fees", label: "Fees", Icon: ReceiptText, children: [
      { label: "Fees Particulars", href: "/fees/particulars", module: "fees" },
      { label: "Fee Structure", href: "/fees/structure", module: "fees" },
      { label: "Discount Types", href: "/fees/discounts", module: "fees" },
      { label: "Fee Invoices", href: "/fees/invoices", module: "fees" },
    ],
  },
  {
    k: "families", label: "Families", Icon: Users2, children: [
      { label: "Manage Families", href: "/families", module: "families" },
    ],
  },
  {
    k: "attendance", label: "Attendance", Icon: CalendarCheck, children: [
      { label: "Student Attendance", href: "/attendance", module: "attendance" },
      { label: "Staff Attendance", href: "/attendance/employees", module: "attendance" },
    ],
  },
  {
    k: "timetable", label: "Timetable", Icon: CalendarClock, children: [
      { label: "Class / Teacher / Room", href: "/timetable", module: "timetable" },
    ],
  },
  {
    k: "exams", label: "Exams & Results", Icon: GraduationCap, children: [
      { label: "All Exams", href: "/exams", module: "exams" },
      { label: "Date Sheet", href: "/exams/schedule", module: "exams" },
      { label: "Results", href: "/results", module: "results" },
      { label: "Homework / LMS", href: "/homework", module: "homework" },
    ],
  },
  {
    k: "leave", label: "Leave", Icon: CalendarOff, children: [
      { label: "Leave Requests", href: "/leave", module: "leave" },
    ],
  },
  {
    k: "payroll", label: "Payroll", Icon: Wallet, children: [
      { label: "Payroll Cycles", href: "/payroll", module: "payroll" },
      { label: "Salary Structures", href: "/payroll/structures", module: "payroll" },
    ],
  },
  {
    k: "library", label: "Library", Icon: BookOpen, children: [
      { label: "Catalogue", href: "/library", module: "library" },
      { label: "Issue & Return", href: "/library/issue", module: "library" },
    ],
  },
  {
    k: "transport", label: "Transport", Icon: Bus, children: [
      { label: "Fleet", href: "/transport", module: "transport" },
      { label: "Routes", href: "/transport/routes", module: "transport" },
    ],
  },
  {
    k: "hostel", label: "Hostel", Icon: Building2, children: [
      { label: "Rooms & Occupancy", href: "/hostel", module: "hostel" },
    ],
  },
  {
    k: "health", label: "Health", Icon: HeartPulse, children: [
      { label: "Medical Records", href: "/health", module: "health" },
    ],
  },
  {
    k: "discipline", label: "Discipline", Icon: ShieldAlert, children: [
      { label: "Incidents", href: "/discipline", module: "discipline" },
    ],
  },
  {
    k: "inventory", label: "Inventory & Assets", Icon: Boxes, children: [
      { label: "Inventory", href: "/inventory", module: "inventory" },
      { label: "Assets", href: "/assets", module: "assets" },
    ],
  },
  {
    k: "communication", label: "Communication", Icon: Megaphone, children: [
      { label: "Notices", href: "/communication", module: "communication" },
      { label: "Events", href: "/events", module: "events" },
      { label: "Meetings", href: "/meetings", module: "meetings" },
      { label: "Schedule Meeting", href: "/meetings/new", module: "meetings" },
    ],
  },
  {
    k: "tasks", label: "Tasks", Icon: ListChecks, children: [
      { label: "Task Board", href: "/tasks", module: "tasks" },
    ],
  },
  {
    k: "complaints", label: "Complaints", Icon: MessageSquareWarning, children: [
      { label: "Tickets", href: "/complaints", module: "complaints" },
    ],
  },
  {
    k: "reports", label: "Reports", Icon: BarChart3, children: [
      { label: "Reports Center", href: "/reports", module: "reports" },
      { label: "Branch Performance", href: "/reports/branch-performance", module: "reports" },
    ],
  },
  {
    k: "users", label: "User Management", Icon: ShieldCheck, children: [
      { label: "Manage Login / Accounts", href: "/users", module: "users" },
      { label: "Roles & Permissions", href: "/users/roles", module: "users" },
    ],
  },
  {
    k: "settings", label: "General Settings", Icon: Settings, children: [
      { label: "Institute Profile", href: "/settings/institute", module: "settings" },
      { label: "Branches & Campuses", href: "/settings/branches", module: "settings" },
      { label: "Fee Voucher Layout", href: "/settings/fee-voucher", module: "settings" },
      { label: "Admission Letter Layout", href: "/settings/admission-letter", module: "settings" },
      { label: "Job Letter Layout", href: "/settings/job-letter", module: "settings" },
      { label: "Rules & Regulations", href: "/settings/rules", module: "settings" },
      { label: "Theme & Language", href: "/settings/theme", module: "settings" },
      { label: "Account Settings", href: "/settings/account", module: null },
      { label: "Audit Log", href: "/audit", module: "audit" },
      { label: "Logout", href: "/logout", module: null },
    ],
  },
];

export const ADMIN_ICON_RAIL: AdminRailGroup[] = [
  {
    label: "Overview", items: [
      { k: "dashboard", label: "Dashboard", Icon: Home, href: "/dashboard", module: "dashboard" },
      { k: "students", label: "Students", Icon: Users, href: "/students", module: "students" },
      { k: "employees", label: "Employees", Icon: Briefcase, href: "/employees", module: "employees" },
      { k: "fees", label: "Fees", Icon: Wallet, href: "/fees/invoices", module: "fees" },
      { k: "accounts", label: "Accounts", Icon: BarChart3, href: "/accounts", module: "accounts" },
    ],
  },
  {
    label: "Academics", items: [
      { k: "admissions", label: "Admissions", Icon: UserPlus, href: "/admissions", module: "admissions" },
      { k: "attendance", label: "Attendance", Icon: CalendarCheck, href: "/attendance", module: "attendance" },
      { k: "timetable", label: "Timetable", Icon: CalendarClock, href: "/timetable", module: "timetable" },
      { k: "classes", label: "Classes", Icon: School, href: "/classes", module: "classes" },
      { k: "exams", label: "Exams & Results", Icon: GraduationCap, href: "/exams", module: "exams" },
      { k: "homework", label: "Homework / LMS", Icon: NotebookPen, href: "/homework", module: "homework" },
    ],
  },
  {
    label: "Operations", items: [
      { k: "library", label: "Library", Icon: BookOpen, href: "/library", module: "library" },
      { k: "transport", label: "Transport", Icon: Bus, href: "/transport", module: "transport" },
      { k: "hostel", label: "Hostel", Icon: BedDouble, href: "/hostel", module: "hostel" },
      { k: "inventory", label: "Inventory", Icon: Boxes, href: "/inventory", module: "inventory" },
      { k: "frontoffice", label: "Front Office", Icon: DoorOpen, href: "/front-office", module: "frontoffice" },
      { k: "health", label: "Health", Icon: HeartPulse, href: "/health", module: "health" },
    ],
  },
  {
    label: "Manage", items: [
      { k: "communication", label: "Communication", Icon: Megaphone, href: "/communication", module: "communication" },
      { k: "meetings", label: "Meetings", Icon: Video, href: "/meetings", module: "meetings" },
      { k: "tasks", label: "Tasks", Icon: ListChecks, href: "/tasks", module: "tasks" },
      { k: "reports", label: "Reports", Icon: TrendingUp, href: "/reports", module: "reports" },
      { k: "settings", label: "Settings", Icon: Settings, href: "/settings/branches", module: "settings" },
    ],
  },
];

type CanFn = (module: AccessModule, action?: "view") => boolean;

/** Filter sidebar groups/children by `can(module, "view")`. */
export function filterAdminNav(nav: AdminNavGroup[], can: CanFn): AdminNavGroup[] {
  return nav
    .map((g) => {
      if (g.children.length === 0) {
        const mod = g.module ?? null;
        if (mod && !can(mod, "view")) return null;
        return g;
      }
      const children = g.children.filter((c) => !c.module || can(c.module, "view"));
      if (children.length === 0) return null;
      return { ...g, children };
    })
    .filter(Boolean) as AdminNavGroup[];
}

/** Filter icon rail groups by module view permission. */
export function filterAdminRail(groups: AdminRailGroup[], can: CanFn): AdminRailGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => can(i.module, "view")),
    }))
    .filter((g) => g.items.length > 0);
}
