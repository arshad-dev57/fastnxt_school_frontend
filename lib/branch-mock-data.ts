/* ============================================================================
   BisonsEduCore360 — Branch Mock Data
   Multi-campus demo data for Bisons School System
   ========================================================================== */

import { type Branch, type UserBranchAccess } from "@/lib/branch";
import type { BranchComparisonRow, BranchDashboardStats } from "@/lib/branch";

export const BRANCHES: Branch[] = [
  {
    id: "BR-MAIN",
    name: "Main Campus",
    code: "MAIN",
    address: "12-A, Education Avenue, Gulberg III",
    city: "Lahore",
    phone: "+92 42 1234 5678",
    email: "main@bisons.edu",
    principal: "Amara Reyes",
    logo: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    academicCalendar: "2025-2026",
    openingDate: "2015-03-01",
    status: "Active",
    description: "The flagship campus of Bisons School System, offering Nursery through Grade 10 with full academic and extracurricular facilities.",
    createdAt: "2015-03-01",
    updatedAt: "2026-01-15",
  },
  {
    id: "BR-GUL",
    name: "Gulshan Campus",
    code: "GUL",
    address: "45-B, Gulshan-e-Iqbal, Block 13",
    city: "Karachi",
    phone: "+92 21 9876 5432",
    email: "gulshan@bisons.edu",
    principal: "Hassan Mahmood",
    logo: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    academicCalendar: "2025-2026",
    openingDate: "2018-08-15",
    status: "Active",
    description: "Purpose-built campus in Karachi's Gulshan area, serving the local community with modern classrooms and sports facilities.",
    createdAt: "2018-08-15",
    updatedAt: "2026-01-10",
  },
  {
    id: "BR-NORTH",
    name: "North Campus",
    code: "NORTH",
    address: "78-C, North Nazimabad, Sector 11",
    city: "Karachi",
    phone: "+92 21 4567 8901",
    email: "north@bisons.edu",
    principal: "Fatima Siddiqui",
    logo: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    academicCalendar: "2025-2026",
    openingDate: "2020-01-10",
    status: "Active",
    description: "Growing campus in North Nazimabad, currently offering Nursery to Grade 8 with planned expansion to Grade 10.",
    createdAt: "2020-01-10",
    updatedAt: "2026-01-08",
  },
  {
    id: "BR-DHA",
    name: "DHA Campus",
    code: "DHA",
    address: "Phase 5, DHA, Khayaban-e-Shamsheer",
    city: "Lahore",
    phone: "+92 42 2345 6789",
    email: "dha@bisons.edu",
    principal: "Omar Khalid",
    logo: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    academicCalendar: "2025-2026",
    openingDate: "2022-04-01",
    status: "Active",
    description: "Premium campus in DHA Lahore with state-of-the-art facilities including science labs, library, and indoor sports complex.",
    createdAt: "2022-04-01",
    updatedAt: "2026-01-12",
  },
  {
    id: "BR-ARCHIVED",
    name: "Old City Campus (Closed)",
    code: "OLD",
    address: "23, Old Anarkali, Walled City",
    city: "Lahore",
    phone: "+92 42 3456 7890",
    email: "old@bisons.edu",
    principal: "N/A",
    logo: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    academicCalendar: "2023-2024",
    openingDate: "2012-09-01",
    status: "Archived",
    description: "Legacy campus that was consolidated into Main Campus in 2024. Data retained for historical records.",
    createdAt: "2012-09-01",
    updatedAt: "2024-06-30",
  },
];

export const getBranchById = (id: string): Branch | undefined => BRANCHES.find((b) => b.id === id);
export const getBranchByCode = (code: string): Branch | undefined => BRANCHES.find((b) => b.code === code);
export const getActiveBranches = (): Branch[] => BRANCHES.filter((b) => b.status === "Active");
export const getBranchCodes = (): string[] => BRANCHES.map((b) => b.code);

export const BRANCH_DASHBOARD_STATS: BranchDashboardStats[] = [
  { branchId: "BR-MAIN", branchName: "Main Campus", students: 1500, attendance: 95, feeCollection: 4200000, outstandingFees: 460000, admissions: 84, employees: 126, expenses: 2780000, income: 4650000, exams: 4, results: 1420, transport: 418, inventory: 892, upcomingEvents: 6 },
  { branchId: "BR-GUL", branchName: "Gulshan Campus", students: 1200, attendance: 93, feeCollection: 3100000, outstandingFees: 390000, admissions: 61, employees: 98, expenses: 2020000, income: 3440000, exams: 4, results: 1131, transport: 326, inventory: 704, upcomingEvents: 4 },
  { branchId: "BR-NORTH", branchName: "North Campus", students: 950, attendance: 92, feeCollection: 2400000, outstandingFees: 310000, admissions: 48, employees: 74, expenses: 1570000, income: 2680000, exams: 3, results: 876, transport: 241, inventory: 518, upcomingEvents: 3 },
  { branchId: "BR-DHA", branchName: "DHA Campus", students: 1200, attendance: 96, feeCollection: 2800000, outstandingFees: 280000, admissions: 73, employees: 104, expenses: 2310000, income: 3150000, exams: 4, results: 1144, transport: 359, inventory: 781, upcomingEvents: 5 },
];

export const BRANCH_COMPARISON: BranchComparisonRow[] = BRANCH_DASHBOARD_STATS.map((item) => ({
  branchId: item.branchId, branchName: item.branchName, branchCode: getBranchById(item.branchId)?.code ?? "",
  students: item.students, attendance: item.attendance, feeCollection: item.feeCollection, outstanding: item.outstandingFees,
  admissions: item.admissions, employees: item.employees, expenses: item.expenses, income: item.income,
  examAverage: item.branchId === "BR-DHA" ? 86 : item.branchId === "BR-MAIN" ? 83 : item.branchId === "BR-GUL" ? 81 : 79,
}));

// Branch-specific numbering prefixes
export const BRANCH_NUMBERING: Record<string, { students: string; fees: string; expenses: string; admissions: string }> = {
  "BR-MAIN": { students: "MAIN-STU", fees: "MAIN-FEE", expenses: "MAIN-EXP", admissions: "MAIN-ADM" },
  "BR-GUL": { students: "GUL-STU", fees: "GUL-FEE", expenses: "GUL-EXP", admissions: "GUL-ADM" },
  "BR-NORTH": { students: "NORTH-STU", fees: "NORTH-FEE", expenses: "NORTH-EXP", admissions: "NORTH-ADM" },
  "BR-DHA": { students: "DHA-STU", fees: "DHA-FEE", expenses: "DHA-EXP", admissions: "DHA-ADM" },
};

// Default user branch access for demo. A user may own one, several or all campuses.
export const DEMO_USER_BRANCH_ACCESS: Record<string, UserBranchAccess> = {
  "USR-01": { userId: "USR-01", branchIds: ["BR-MAIN", "BR-GUL", "BR-NORTH", "BR-DHA"], role: "Super Admin", isPrimary: true },
  "USR-02": { userId: "USR-02", branchIds: ["BR-MAIN", "BR-GUL", "BR-NORTH", "BR-DHA"], role: "Owner", isPrimary: true },
  "USR-03": { userId: "USR-03", branchIds: ["BR-MAIN"], role: "Branch Admin", isPrimary: true },
  "USR-04": { userId: "USR-04", branchIds: ["BR-MAIN"], role: "Teacher", isPrimary: true },
  "USR-05": { userId: "USR-05", branchIds: ["BR-MAIN", "BR-GUL"], role: "Accountant", isPrimary: true },
  "USR-06": { userId: "USR-06", branchIds: ["BR-GUL"], role: "Branch Admin", isPrimary: true },
  "USR-07": { userId: "USR-07", branchIds: ["BR-DHA"], role: "Receptionist", isPrimary: true },
  "USR-08": { userId: "USR-08", branchIds: ["BR-MAIN", "BR-NORTH"], role: "Branch Admin", isPrimary: true },
};

export type UserBranchAccessMap = typeof DEMO_USER_BRANCH_ACCESS;

/** First demo access record for a role — used by the "View as role" preview. */
export function demoAccessForRole(role: string): UserBranchAccess | null {
  return Object.values(DEMO_USER_BRANCH_ACCESS).find((a) => a.role === role) ?? null;
}
