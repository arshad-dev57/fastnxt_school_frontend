/* ============================================================================
   FastNxt — dashboard analytics mock data (frontend only)
   ---------------------------------------------------------------------------
   ⚠️  All numbers are clearly FICTIONAL demo values for the prototype.
       They are grouped by module and typed so they can be swapped 1:1 with API
       responses later without touching the chart components.
   ========================================================================== */

export type TrendPoint = { label: string; total: number; admissions: number };
export type AttendancePoint = { label: string; present: number; absent: number; late: number; leave: number };
export type FeeMonth = { label: string; expected: number; collected: number; pending: number };
export type Slice = { label: string; value: number };
export type MetricPoint = { label: string; value: number };

/* ------------------------------------------------------- Student enrollment */
export type PeriodKey = "7d" | "30d" | "6m" | "1y";

export const ENROLLMENT_PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
];

export const enrollmentData: Record<PeriodKey, TrendPoint[]> = {
  "7d": [
    { label: "Mon", total: 1281, admissions: 4 },
    { label: "Tue", total: 1284, admissions: 6 },
    { label: "Wed", total: 1286, admissions: 3 },
    { label: "Thu", total: 1289, admissions: 7 },
    { label: "Fri", total: 1290, admissions: 2 },
    { label: "Sat", total: 1292, admissions: 5 },
    { label: "Sun", total: 1294, admissions: 3 },
  ],
  "30d": [
    { label: "Week 1", total: 1256, admissions: 18 },
    { label: "Week 2", total: 1268, admissions: 22 },
    { label: "Week 3", total: 1279, admissions: 16 },
    { label: "Week 4", total: 1288, admissions: 21 },
    { label: "Week 5", total: 1294, admissions: 9 },
  ],
  "6m": [
    { label: "Sep", total: 1180, admissions: 42 },
    { label: "Oct", total: 1206, admissions: 38 },
    { label: "Nov", total: 1231, admissions: 31 },
    { label: "Dec", total: 1252, admissions: 26 },
    { label: "Jan", total: 1276, admissions: 29 },
    { label: "Feb", total: 1294, admissions: 24 },
  ],
  "1y": [
    { label: "Jan", total: 980, admissions: 28 },
    { label: "Feb", total: 1004, admissions: 33 },
    { label: "Mar", total: 1021, admissions: 26 },
    { label: "Apr", total: 1043, admissions: 30 },
    { label: "May", total: 1062, admissions: 22 },
    { label: "Jun", total: 1088, admissions: 35 },
    { label: "Jul", total: 1110, admissions: 27 },
    { label: "Aug", total: 1138, admissions: 40 },
    { label: "Sep", total: 1160, admissions: 44 },
    { label: "Oct", total: 1192, admissions: 36 },
    { label: "Nov", total: 1230, admissions: 30 },
    { label: "Dec", total: 1294, admissions: 29 },
  ],
};

/* --------------------------------------------------------------- Attendance */
export const attendanceData: AttendancePoint[] = [
  { label: "Mon", present: 738, absent: 32, late: 16, leave: 8 },
  { label: "Tue", present: 746, absent: 26, late: 14, leave: 8 },
  { label: "Wed", present: 731, absent: 38, late: 17, leave: 8 },
  { label: "Thu", present: 752, absent: 22, late: 12, leave: 8 },
  { label: "Fri", present: 744, absent: 30, late: 12, leave: 8 },
  { label: "Sat", present: 601, absent: 44, late: 21, leave: 128 },
];

export const attendanceSummary: Slice[] = [
  { label: "Present", value: 92 },
  { label: "Absent", value: 4 },
  { label: "Late", value: 2 },
  { label: "Leave", value: 2 },
];

/* -------------------------------------------------------------------- Fees */
export const feeCollectionData: FeeMonth[] = [
  { label: "Jan", expected: 1380000, collected: 1245000, pending: 135000 },
  { label: "Feb", expected: 1400000, collected: 1302000, pending: 98000 },
  { label: "Mar", expected: 1400000, collected: 1188000, pending: 212000 },
  { label: "Apr", expected: 1420000, collected: 1331000, pending: 89000 },
  { label: "May", expected: 1420000, collected: 1267000, pending: 153000 },
  { label: "Jun", expected: 1450000, collected: 1389000, pending: 61000 },
  { label: "Jul", expected: 1450000, collected: 1294000, pending: 156000 },
  { label: "Aug", expected: 1480000, collected: 1358000, pending: 122000 },
];

export const feeSummary = { totalCollected: 10373000, totalPending: 1026000, collectionRate: 88.6 };

export const feeStatusData: Slice[] = [
  { label: "Collected", value: 72 },
  { label: "Pending", value: 18 },
  { label: "Overdue", value: 7 },
  { label: "Discounted", value: 3 },
];

/* ---------------------------------------------- Students by class / gender */
export const classDistributionData: MetricPoint[] = [
  { label: "Nursery", value: 54 },
  { label: "KG", value: 58 },
  { label: "Grade 1", value: 86 },
  { label: "Grade 2", value: 91 },
  { label: "Grade 3", value: 72 },
  { label: "Grade 4", value: 68 },
  { label: "Grade 5", value: 83 },
  { label: "Grade 6", value: 64 },
  { label: "Grade 7", value: 61 },
  { label: "Grade 8", value: 57 },
  { label: "Grade 9", value: 52 },
  { label: "Grade 10", value: 48 },
];

export const genderData: Slice[] = [
  { label: "Male", value: 418 },
  { label: "Female", value: 371 },
  { label: "Other", value: 5 },
];

/* --------------------------------------------------------------- Employees */
export const employeeData: MetricPoint[] = [
  { label: "Teaching", value: 42 },
  { label: "Administration", value: 10 },
  { label: "Accounts", value: 6 },
  { label: "Transport", value: 6 },
  { label: "Support", value: 4 },
];

export const employeeSummary = { total: 68, teaching: 42, admin: 10, support: 16, active: 62, inactive: 6 };

/* -------------------------------------------------------------- Admissions */
export const admissionsData = [
  { label: "Sep", applications: 42, approved: 34, pending: 5, rejected: 3 },
  { label: "Oct", applications: 38, approved: 31, pending: 4, rejected: 3 },
  { label: "Nov", applications: 31, approved: 25, pending: 4, rejected: 2 },
  { label: "Dec", applications: 26, approved: 22, pending: 3, rejected: 1 },
  { label: "Jan", applications: 29, approved: 24, pending: 4, rejected: 1 },
  { label: "Feb", applications: 24, approved: 19, pending: 4, rejected: 1 },
];

export const admissionsSummary = { applications: 190, approved: 155, pending: 24, rejected: 11 };

/* --------------------------------------------------------- Exams & results */
export const classPerformanceData: MetricPoint[] = [
  { label: "Grade 1", value: 78 },
  { label: "Grade 2", value: 82 },
  { label: "Grade 3", value: 75 },
  { label: "Grade 4", value: 88 },
  { label: "Grade 5", value: 84 },
  { label: "Grade 6", value: 80 },
  { label: "Grade 7", value: 77 },
  { label: "Grade 8", value: 73 },
];

export const resultsSummary = { averageMarks: 79.6, passRate: 86.4, failRate: 13.6 };
