/* ============================================================================
   BisonsEduCore360 — Multi-Branch / Multi-Campus Types & Context
   ========================================================================== */

export type BranchStatus = "Active" | "Inactive" | "Archived";

export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  principal: string;
  logo?: string;
  timezone: string;
  currency: string;
  academicCalendar: string;
  openingDate: string;
  status: BranchStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type UserBranchAccess = {
  userId: string;
  branchIds: string[];
  role: UserRole;
  isPrimary: boolean;
};

export type UserRole =
  | "Super Admin"
  | "Owner"
  | "Branch Admin"
  | "Accountant"
  | "Receptionist"
  | "Teacher"
  | "Student";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "manage";

export type BranchScope = "own" | "branch" | "multiple" | "all";

export type Permission = {
  module: string;
  action: PermissionAction;
  branchScope: BranchScope;
};

export type RolePermissions = {
  role: UserRole;
  permissions: Permission[];
};

export type BranchSettings = {
  branchId: string;
  academicSession: string;
  classes: string[];
  sections: string[];
  feeStructures: string[];
  feeHeads: string[];
  discounts: string[];
  fineRules: string[];
  timetable: string[];
  holidays: string[];
  workingDays: string[];
  examConfig: string[];
  gradingConfig: string[];
  transportRoutes: string[];
  library: string[];
  inventory: string[];
  payrollSettings: string[];
  expenseCategories: string[];
  numberingPrefix: string;
};

export type BranchDashboardStats = {
  branchId: string;
  branchName: string;
  students: number;
  attendance: number;
  feeCollection: number;
  outstandingFees: number;
  admissions: number;
  employees: number;
  expenses: number;
  income: number;
  exams: number;
  results: number;
  transport: number;
  inventory: number;
  upcomingEvents: number;
};

export type BranchComparisonRow = {
  branchId: string;
  branchName: string;
  branchCode: string;
  students: number;
  attendance: number;
  feeCollection: number;
  outstanding: number;
  admissions: number;
  employees: number;
  expenses: number;
  income: number;
  examAverage: number;
};

export type StudentBranchHistory = {
  studentId: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  fromDate: string;
  toDate: string | null;
  reason: string;
  isCurrent: boolean;
};

export type EmployeeBranchAssignment = {
  employeeId: string;
  primaryBranchId: string;
  additionalBranchIds: string[];
};