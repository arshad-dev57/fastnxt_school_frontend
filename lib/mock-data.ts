/* ============================================================================
   FastNxt — mock data (frontend prototype only, no backend)
   ========================================================================== */

export const SESSIONS = ["2023-2024", "2024-2025", "2025-2026"];
export const SECTIONS = ["A", "B", "C", "D"];
export const CLASS_NAMES = [
  "Nursery", "KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
];
export const GENDERS = ["Male", "Female"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Card", "Online"];

export type ActiveStatus = "Active" | "Inactive";

/* ----------------------------------------------------------------- Classes */
export type ClassRow = {
  id: string; name: string; code: string; sections: string[];
  students: number; teacher: string; status: ActiveStatus;
};

export const CLASS_ROWS: ClassRow[] = [
  { id: "CLS-01", name: "Nursery", code: "NUR", sections: ["A", "B"], students: 54, teacher: "Sana Iqbal", status: "Active" },
  { id: "CLS-02", name: "KG", code: "KG", sections: ["A", "B"], students: 58, teacher: "Hina Aslam", status: "Active" },
  { id: "CLS-03", name: "Grade 1", code: "G1", sections: ["A", "B", "C"], students: 86, teacher: "Nadia Rehman", status: "Active" },
  { id: "CLS-04", name: "Grade 2", code: "G2", sections: ["A", "B", "C"], students: 91, teacher: "Amara Reyes", status: "Active" },
  { id: "CLS-05", name: "Grade 3", code: "G3", sections: ["A", "B"], students: 72, teacher: "Kiran Shah", status: "Active" },
  { id: "CLS-06", name: "Grade 4", code: "G4", sections: ["A", "B"], students: 68, teacher: "Daniel Okafor", status: "Active" },
  { id: "CLS-07", name: "Grade 5", code: "G5", sections: ["A", "B", "C"], students: 83, teacher: "Priya Nair", status: "Active" },
  { id: "CLS-08", name: "Grade 6", code: "G6", sections: ["A", "B"], students: 64, teacher: "Liam Bennett", status: "Active" },
  { id: "CLS-09", name: "Grade 7", code: "G7", sections: ["A", "B"], students: 61, teacher: "Omar Farooq", status: "Active" },
  { id: "CLS-10", name: "Grade 8", code: "G8", sections: ["A", "B"], students: 57, teacher: "Zainab Fatima", status: "Inactive" },
  { id: "CLS-11", name: "Grade 9", code: "G9", sections: ["A", "B"], students: 52, teacher: "Bilal Raza", status: "Active" },
  { id: "CLS-12", name: "Grade 10", code: "G10", sections: ["A", "B"], students: 48, teacher: "Ayesha Malik", status: "Active" },
];

/* ---------------------------------------------------------------- Subjects */
export type SubjectRow = {
  id: string; name: string; code: string;
  type: "Core" | "Elective" | "Activity"; classes: number; status: ActiveStatus;
};

export const SUBJECT_ROWS: SubjectRow[] = [
  { id: "SUB-01", name: "English", code: "ENG", type: "Core", classes: 12, status: "Active" },
  { id: "SUB-02", name: "Mathematics", code: "MATH", type: "Core", classes: 12, status: "Active" },
  { id: "SUB-03", name: "General Science", code: "SCI", type: "Core", classes: 9, status: "Active" },
  { id: "SUB-04", name: "Islamiat", code: "ISL", type: "Core", classes: 12, status: "Active" },
  { id: "SUB-05", name: "Urdu", code: "URD", type: "Core", classes: 12, status: "Active" },
  { id: "SUB-06", name: "Social Studies", code: "SST", type: "Core", classes: 7, status: "Active" },
  { id: "SUB-07", name: "Computer Studies", code: "COMP", type: "Elective", classes: 6, status: "Active" },
  { id: "SUB-08", name: "Art & Craft", code: "ART", type: "Activity", classes: 5, status: "Inactive" },
  { id: "SUB-09", name: "Physical Education", code: "PE", type: "Activity", classes: 8, status: "Active" },
  { id: "SUB-10", name: "Arabic", code: "ARB", type: "Elective", classes: 4, status: "Active" },
];

/* ---------------------------------------------------------------- Students */
export type StudentRow = {
  id: string; name: string; gender: "Male" | "Female"; cls: string; section: string;
  guardian: string; contact: string; admissionDate: string; status: ActiveStatus;
};

export const STUDENT_ROWS: StudentRow[] = [
  { id: "STD-1001", name: "Hamza Khan", gender: "Male", cls: "Grade 10", section: "A", guardian: "Imran Khan", contact: "0300-1234567", admissionDate: "2021-04-12", status: "Active" },
  { id: "STD-1002", name: "Sara Ahmed", gender: "Female", cls: "Grade 9", section: "B", guardian: "Naveed Ahmed", contact: "0301-2345678", admissionDate: "2022-04-09", status: "Active" },
  { id: "STD-1003", name: "Bilal Raza", gender: "Male", cls: "Grade 8", section: "A", guardian: "Tariq Raza", contact: "0302-3456789", admissionDate: "2020-04-15", status: "Active" },
  { id: "STD-1004", name: "Ayesha Malik", gender: "Female", cls: "Grade 10", section: "A", guardian: "Adnan Malik", contact: "0303-4567890", admissionDate: "2021-04-10", status: "Active" },
  { id: "STD-1005", name: "Usman Tariq", gender: "Male", cls: "Grade 7", section: "C", guardian: "Kamran Tariq", contact: "0304-5678901", admissionDate: "2019-04-08", status: "Active" },
  { id: "STD-1006", name: "Zainab Fatima", gender: "Female", cls: "Grade 9", section: "A", guardian: "Sohail Ahmed", contact: "0305-6789012", admissionDate: "2022-04-11", status: "Active" },
  { id: "STD-1007", name: "Ali Hassan", gender: "Male", cls: "Grade 6", section: "B", guardian: "Rizwan Hassan", contact: "0306-7890123", admissionDate: "2018-04-14", status: "Inactive" },
  { id: "STD-1008", name: "Fatima Noor", gender: "Female", cls: "Grade 10", section: "B", guardian: "Salman Noor", contact: "0307-8901234", admissionDate: "2021-04-16", status: "Active" },
  { id: "STD-1009", name: "Omar Farooq", gender: "Male", cls: "Grade 8", section: "B", guardian: "Javed Farooq", contact: "0308-9012345", admissionDate: "2020-04-18", status: "Active" },
  { id: "STD-1010", name: "Hina Sheikh", gender: "Female", cls: "Grade 5", section: "A", guardian: "Farhan Sheikh", contact: "0309-0123456", admissionDate: "2017-04-07", status: "Active" },
  { id: "STD-1011", name: "Daniyal Abbas", gender: "Male", cls: "Grade 4", section: "A", guardian: "Nadeem Abbas", contact: "0310-1234567", admissionDate: "2023-04-05", status: "Active" },
  { id: "STD-1012", name: "Maryam Javed", gender: "Female", cls: "Grade 3", section: "B", guardian: "Kashif Javed", contact: "0311-2345678", admissionDate: "2023-04-09", status: "Active" },
  { id: "STD-1013", name: "Ahmed Raza", gender: "Male", cls: "Grade 2", section: "A", guardian: "Sajid Raza", contact: "0312-3456789", admissionDate: "2024-04-03", status: "Active" },
  { id: "STD-1014", name: "Laiba Anwar", gender: "Female", cls: "Grade 1", section: "C", guardian: "Arshad Anwar", contact: "0313-4567890", admissionDate: "2024-04-06", status: "Active" },
];

export type EmployeeRow = {
  id: string; name: string; designation: string; department: string;
  phone: string; email: string; joining: string; status: ActiveStatus;
};

export const EMPLOYEE_ROWS: EmployeeRow[] = [
  { id: "EMP-001", name: "Amara Reyes", designation: "Principal", department: "Administration", phone: "0320-1112223", email: "amara.reyes@school.local", joining: "2015-03-01", status: "Active" },
  { id: "EMP-002", name: "Daniel Okafor", designation: "Vice Principal", department: "Administration", phone: "0321-2223334", email: "daniel.okafor@school.local", joining: "2016-06-12", status: "Active" },
  { id: "EMP-003", name: "Priya Nair", designation: "Senior Teacher", department: "Academics", phone: "0322-3334445", email: "priya.nair@school.local", joining: "2017-08-20", status: "Active" },
  { id: "EMP-004", name: "Liam Bennett", designation: "Teacher", department: "Academics", phone: "0323-4445556", email: "liam.bennett@school.local", joining: "2018-09-05", status: "Active" },
  { id: "EMP-005", name: "Sana Iqbal", designation: "Teacher", department: "Academics", phone: "0324-5556667", email: "sana.iqbal@school.local", joining: "2019-04-02", status: "Active" },
  { id: "EMP-006", name: "Bilal Raza", designation: "Teacher", department: "Academics", phone: "0325-6667778", email: "bilal.raza@school.local", joining: "2020-01-15", status: "Active" },
  { id: "EMP-007", name: "Maria Fernandes", designation: "Accountant", department: "Finance", phone: "0326-7778889", email: "maria.f@school.local", joining: "2018-02-10", status: "Active" },
  { id: "EMP-008", name: "Hassan Sheikh", designation: "Receptionist", department: "Front Office", phone: "0327-8889990", email: "hassan.s@school.local", joining: "2021-05-22", status: "Active" },
  { id: "EMP-009", name: "Nadia Rehman", designation: "Teacher", department: "Academics", phone: "0328-9990001", email: "nadia.rehman@school.local", joining: "2019-08-30", status: "Inactive" },
  { id: "EMP-010", name: "Kiran Shah", designation: "Lab Assistant", department: "Science Lab", phone: "0329-0001112", email: "kiran.shah@school.local", joining: "2022-03-14", status: "Active" },
  { id: "EMP-011", name: "Farhan Sheikh", designation: "IT Support", department: "Technology", phone: "0330-1112224", email: "farhan.s@school.local", joining: "2020-11-08", status: "Active" },
  { id: "EMP-012", name: "Ayesha Malik", designation: "Teacher", department: "Academics", phone: "0331-2223335", email: "ayesha.malik@school.local", joining: "2021-09-01", status: "Active" },
];

/* ---------------------------------------------------------------- Families */
export type FamilyRow = {
  id: string; guardian: string; phone: string; email: string; address: string;
  students: number; status: ActiveStatus; studentNames: string[]; classList: string[];
  billed: number; paid: number; balance: number;
};

export const FAMILY_ROWS: FamilyRow[] = [
  { id: "FAM-001", guardian: "Imran Khan", phone: "0300-1234567", email: "imran.khan@mail.com", address: "12-B Model Town, Lahore", students: 2, status: "Active", studentNames: ["Hamza Khan", "Hira Khan"], classList: ["Grade 10-A", "Grade 6-B"], billed: 42500, paid: 34000, balance: 8500 },
  { id: "FAM-002", guardian: "Naveed Ahmed", phone: "0301-2345678", email: "naveed.ahmed@mail.com", address: "45 Gulberg III, Lahore", students: 1, status: "Active", studentNames: ["Sara Ahmed"], classList: ["Grade 9-B"], billed: 21000, paid: 21000, balance: 0 },
  { id: "FAM-003", guardian: "Tariq Raza", phone: "0302-3456789", email: "tariq.raza@mail.com", address: "8-D Johar Town, Lahore", students: 2, status: "Active", studentNames: ["Bilal Raza", "Basit Raza"], classList: ["Grade 8-A", "Grade 3-A"], billed: 38000, paid: 20000, balance: 18000 },
  { id: "FAM-004", guardian: "Adnan Malik", phone: "0303-4567890", email: "adnan.malik@mail.com", address: "22 Faisal Town, Lahore", students: 1, status: "Active", studentNames: ["Ayesha Malik"], classList: ["Grade 10-A"], billed: 23500, paid: 12000, balance: 11500 },
  { id: "FAM-005", guardian: "Kamran Tariq", phone: "0304-5678901", email: "kamran.tariq@mail.com", address: "77 DHA Phase 3, Lahore", students: 3, status: "Active", studentNames: ["Usman Tariq", "Umar Tariq", "Umaima Tariq"], classList: ["Grade 7-C", "Grade 4-A", "Grade 1-B"], billed: 65000, paid: 65000, balance: 0 },
  { id: "FAM-006", guardian: "Sohail Ahmed", phone: "0305-6789012", email: "sohail.ahmed@mail.com", address: "16 Wapda Town, Lahore", students: 1, status: "Active", studentNames: ["Zainab Fatima"], classList: ["Grade 9-A"], billed: 21000, paid: 5000, balance: 16000 },
  { id: "FAM-007", guardian: "Rizwan Hassan", phone: "0306-7890123", email: "rizwan.hassan@mail.com", address: "3 Cavalry Ground, Lahore", students: 1, status: "Inactive", studentNames: ["Ali Hassan"], classList: ["Grade 6-B"], billed: 18000, paid: 18000, balance: 0 },
  { id: "FAM-008", guardian: "Salman Noor", phone: "0307-8901234", email: "salman.noor@mail.com", address: "90 Askari 10, Lahore", students: 2, status: "Active", studentNames: ["Fatima Noor", "Fahad Noor"], classList: ["Grade 10-B", "Grade 2-A"], billed: 41000, paid: 41000, balance: 0 },
];

/* ---------------------------------------------------------- Fee Particulars */
export type FeeParticular = {
  id: string; particular: string; description: string; amount: number;
  frequency: "Monthly" | "Quarterly" | "Annually" | "One-time"; status: ActiveStatus;
};

export const FEE_PARTICULARS: FeeParticular[] = [
  { id: "FP-01", particular: "Tuition Fee", description: "Monthly tuition charges for all classes", amount: 8000, frequency: "Monthly", status: "Active" },
  { id: "FP-02", particular: "Admission Fee", description: "One-time admission processing charge", amount: 15000, frequency: "One-time", status: "Active" },
  { id: "FP-03", particular: "Exam Fee", description: "Term examination charges", amount: 500, frequency: "Quarterly", status: "Active" },
  { id: "FP-04", particular: "Transport Fee", description: "School van / bus service (per route)", amount: 2000, frequency: "Monthly", status: "Active" },
  { id: "FP-05", particular: "Computer Fee", description: "Computer lab & IT resources", amount: 1000, frequency: "Monthly", status: "Active" },
  { id: "FP-06", particular: "Library Fee", description: "Library access and book maintenance", amount: 300, frequency: "Monthly", status: "Active" },
  { id: "FP-07", particular: "Sports Fee", description: "Sports activities and equipment", amount: 400, frequency: "Monthly", status: "Active" },
  { id: "FP-08", particular: "Annual Charges", description: "Yearly development and maintenance", amount: 6000, frequency: "Annually", status: "Active" },
];

/* ----------------------------------------------------------- Fee Structure */
export type FeeStructureRow = {
  id: string; session: string; cls: string; section: string;
  particular: string; amount: number;
  frequency: "Monthly" | "Quarterly" | "Annually" | "One-time"; dueDate: string;
};

export const FEE_STRUCTURE: FeeStructureRow[] = [
  { id: "FS-01", session: "2025-2026", cls: "Grade 10", section: "A", particular: "Tuition Fee", amount: 8000, frequency: "Monthly", dueDate: "2026-02-10" },
  { id: "FS-02", session: "2025-2026", cls: "Grade 10", section: "A", particular: "Computer Fee", amount: 1000, frequency: "Monthly", dueDate: "2026-02-10" },
  { id: "FS-03", session: "2025-2026", cls: "Grade 10", section: "A", particular: "Exam Fee", amount: 500, frequency: "Quarterly", dueDate: "2026-02-10" },
  { id: "FS-04", session: "2025-2026", cls: "Grade 10", section: "A", particular: "Transport Fee", amount: 2000, frequency: "Monthly", dueDate: "2026-02-10" },
  { id: "FS-05", session: "2025-2026", cls: "Grade 9", section: "B", particular: "Tuition Fee", amount: 7500, frequency: "Monthly", dueDate: "2026-02-10" },
  { id: "FS-06", session: "2025-2026", cls: "Grade 9", section: "B", particular: "Library Fee", amount: 300, frequency: "Monthly", dueDate: "2026-02-10" },
  { id: "FS-07", session: "2025-2026", cls: "Grade 5", section: "A", particular: "Tuition Fee", amount: 6000, frequency: "Monthly", dueDate: "2026-02-10" },
];

/* --------------------------------------------------------- Discount Types */
export type DiscountType = {
  id: string; name: string; basis: "Percentage" | "Fixed Amount"; value: number;
  description: string; status: ActiveStatus;
};

export const DISCOUNT_TYPES: DiscountType[] = [
  { id: "DIS-01", name: "Sibling Discount", basis: "Percentage", value: 10, description: "For second child onwards in the same family", status: "Active" },
  { id: "DIS-02", name: "Scholarship", basis: "Percentage", value: 25, description: "Merit-based scholarship for top performers", status: "Active" },
  { id: "DIS-03", name: "Staff Child Discount", basis: "Percentage", value: 50, description: "For children of school employees", status: "Active" },
  { id: "DIS-04", name: "Early Payment Discount", basis: "Fixed Amount", value: 500, description: "On full payment before due date", status: "Active" },
  { id: "DIS-05", name: "Special Discount", basis: "Fixed Amount", value: 1000, description: "Discretionary discount by administration", status: "Inactive" },
];

/* --------------------------------------------------------- Fee Invoices */
export type InvoiceStatus = "Paid" | "Partially Paid" | "Pending" | "Overdue";
export type InvoiceRow = {
  id: string; student: string; cls: string; section: string; period: string;
  issue: string; due: string; total: number; discount: number; paid: number;
  balance: number; status: InvoiceStatus;
};

export const INVOICES: InvoiceRow[] = [
  { id: "INV-2026-0001", student: "Hamza Khan", cls: "Grade 10", section: "A", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 23500, discount: 0, paid: 0, balance: 23500, status: "Overdue" },
  { id: "INV-2026-0002", student: "Sara Ahmed", cls: "Grade 9", section: "B", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 21000, discount: 1000, paid: 20000, balance: 0, status: "Paid" },
  { id: "INV-2026-0003", student: "Bilal Raza", cls: "Grade 8", section: "A", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 20500, discount: 0, paid: 10000, balance: 10500, status: "Partially Paid" },
  { id: "INV-2026-0004", student: "Ayesha Malik", cls: "Grade 10", section: "A", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 23500, discount: 2000, paid: 12000, balance: 9500, status: "Partially Paid" },
  { id: "INV-2026-0005", student: "Usman Tariq", cls: "Grade 7", section: "C", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 18000, discount: 0, paid: 0, balance: 18000, status: "Pending" },
  { id: "INV-2026-0006", student: "Zainab Fatima", cls: "Grade 9", section: "A", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 21000, discount: 0, paid: 0, balance: 21000, status: "Overdue" },
  { id: "INV-2026-0007", student: "Ali Hassan", cls: "Grade 6", section: "B", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 18000, discount: 500, paid: 17500, balance: 0, status: "Paid" },
  { id: "INV-2026-0008", student: "Fatima Noor", cls: "Grade 10", section: "B", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 23500, discount: 0, paid: 23500, balance: 0, status: "Paid" },
  { id: "INV-2026-0009", student: "Omar Farooq", cls: "Grade 8", section: "B", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 20500, discount: 0, paid: 0, balance: 20500, status: "Pending" },
  { id: "INV-2026-0010", student: "Hina Sheikh", cls: "Grade 5", section: "A", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 17000, discount: 1000, paid: 16000, balance: 0, status: "Paid" },
  { id: "INV-2026-0011", student: "Daniyal Abbas", cls: "Grade 4", section: "A", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 16000, discount: 0, paid: 8000, balance: 8000, status: "Partially Paid" },
  { id: "INV-2026-0012", student: "Maryam Javed", cls: "Grade 3", section: "B", period: "Jan 2026", issue: "2026-01-01", due: "2026-01-10", total: 15500, discount: 0, paid: 0, balance: 15500, status: "Overdue" },
];

/* ------------------------------------------------------ Account Transactions */
export type TxRow = {
  id: string; date: string; ref: string; description: string;
  income: number; expense: number; balance: number; method: string; category: string;
};

export const TRANSACTIONS: TxRow[] = [
  { id: "TX-0001", date: "2026-01-02", ref: "RCP-1001", description: "Fee collection — Sara Ahmed (Grade 9-B)", income: 20000, expense: 0, balance: 20000, method: "Cash", category: "Fee Collection" },
  { id: "TX-0002", date: "2026-01-03", ref: "RCP-1002", description: "Fee collection — Ali Hassan (Grade 6-B)", income: 17500, expense: 0, balance: 37500, method: "Bank Transfer", category: "Fee Collection" },
  { id: "TX-0003", date: "2026-01-04", ref: "VCH-2001", description: "Electricity bill — December", income: 0, expense: 48000, balance: -10500, method: "Bank Transfer", category: "Utilities" },
  { id: "TX-0004", date: "2026-01-05", ref: "RCP-1003", description: "Fee collection — Fatima Noor (Grade 10-B)", income: 23500, expense: 0, balance: 13000, method: "Online", category: "Fee Collection" },
  { id: "TX-0005", date: "2026-01-06", ref: "VCH-2002", description: "Staff salaries — December", income: 0, expense: 325000, balance: -312000, method: "Bank Transfer", category: "Salaries" },
  { id: "TX-0006", date: "2026-01-07", ref: "RCP-1004", description: "Admission fee — Laiba Anwar", income: 15000, expense: 0, balance: -297000, method: "Cash", category: "Admissions" },
  { id: "TX-0007", date: "2026-01-08", ref: "VCH-2003", description: "Science lab equipment purchase", income: 0, expense: 62000, balance: -359000, method: "Cheque", category: "Supplies" },
  { id: "TX-0008", date: "2026-01-09", ref: "RCP-1005", description: "Fee collection — Hina Sheikh (Grade 5-A)", income: 16000, expense: 0, balance: -343000, method: "Cash", category: "Fee Collection" },
  { id: "TX-0009", date: "2026-01-10", ref: "VCH-2004", description: "Transport fuel & maintenance", income: 0, expense: 38000, balance: -381000, method: "Cash", category: "Transport" },
  { id: "TX-0010", date: "2026-01-11", ref: "RCP-1006", description: "Fee collection — Daniyal Abbas (Grade 4-A)", income: 8000, expense: 0, balance: -373000, method: "Card", category: "Fee Collection" },
  { id: "TX-0011", date: "2026-01-12", ref: "VCH-2005", description: "Stationery & printing", income: 0, expense: 21500, balance: -394500, method: "Cash", category: "Supplies" },
  { id: "TX-0012", date: "2026-01-13", ref: "RCP-1007", description: "Fee collection — Bilal Raza (Grade 8-A)", income: 10000, expense: 0, balance: -384500, method: "Online", category: "Fee Collection" },
];

/* ------------------------------------------------------- User Accounts */
/** @deprecated Prefer `UserRole` from `@/lib/branch` — kept for mock seed rows. */
export type UserRole = import("@/lib/branch").UserRole | "Administrator";
export type UserRow = {
  id: string; name: string; email: string; phone?: string; role: string;
  branchId?: string | null; lastLogin: string; status: ActiveStatus;
};

export const USER_ROWS: UserRow[] = [
  { id: "USR-01", name: "Amara Reyes", email: "amara.reyes@school.local", phone: "0300-1112233", role: "Super Admin", lastLogin: "2026-01-13 09:12", status: "Active" },
  { id: "USR-02", name: "Daniel Okafor", email: "daniel.okafor@school.local", phone: "0300-2223344", role: "Owner", lastLogin: "2026-01-13 08:40", status: "Active" },
  { id: "USR-03", name: "Priya Nair", email: "priya.nair@school.local", phone: "0300-3334455", role: "Branch Admin", lastLogin: "2026-01-12 15:22", status: "Active" },
  { id: "USR-04", name: "Liam Bennett", email: "liam.bennett@school.local", phone: "0300-4445566", role: "Teacher", lastLogin: "2026-01-12 11:05", status: "Active" },
  { id: "USR-05", name: "Maria Fernandes", email: "maria.f@school.local", phone: "0300-5556677", role: "Accountant", lastLogin: "2026-01-11 14:48", status: "Active" },
  { id: "USR-06", name: "Hassan Sheikh", email: "hassan.s@school.local", phone: "0300-6667788", role: "Receptionist", lastLogin: "2026-01-10 09:30", status: "Active" },
  { id: "USR-07", name: "Nadia Rehman", email: "nadia.rehman@school.local", phone: "0300-7778899", role: "Teacher", lastLogin: "2025-12-20 16:10", status: "Inactive" },
  { id: "USR-08", name: "Farhan Sheikh", email: "farhan.s@school.local", phone: "0300-8889900", role: "Branch Admin", lastLogin: "2026-01-09 10:02", status: "Active" },
];

export const USER_ROLES: UserRole[] = ["Super Admin", "Owner", "Branch Admin", "Accountant", "Receptionist", "Teacher", "Student"];

/* ---------------------------------------------------- Roles & Permissions */
export type PermissionGroup = { module: string; actions: string[] };

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { module: "Students", actions: ["View", "Add", "Edit", "Delete", "Promote"] },
  { module: "Classes", actions: ["View", "Add", "Edit", "Delete"] },
  { module: "Subjects", actions: ["View", "Add", "Edit", "Assign"] },
  { module: "Employees", actions: ["View", "Add", "Edit", "Delete"] },
  { module: "Fees", actions: ["View", "Create Invoice", "Record Payment"] },
  { module: "Accounts", actions: ["View", "Add Income", "Add Expense", "View Statement"] },
];

/* ------------------------------------------------------ Admission Letters */
export type AdmissionLetter = {
  id: string; student: string; admissionNo: string; cls: string; section: string;
  date: string; status: "Generated" | "Pending" | "Printed";
};

export const ADMISSION_LETTERS: AdmissionLetter[] = [
  { id: "AL-001", student: "Laiba Anwar", admissionNo: "ADM-2026-0014", cls: "Grade 1", section: "C", date: "2026-01-06", status: "Generated" },
  { id: "AL-002", student: "Ahmed Raza", admissionNo: "ADM-2026-0013", cls: "Grade 2", section: "A", date: "2026-01-05", status: "Printed" },
  { id: "AL-003", student: "Maryam Javed", admissionNo: "ADM-2026-0012", cls: "Grade 3", section: "B", date: "2026-01-04", status: "Generated" },
  { id: "AL-004", student: "Daniyal Abbas", admissionNo: "ADM-2026-0011", cls: "Grade 4", section: "A", date: "2026-01-03", status: "Pending" },
  { id: "AL-005", student: "Hira Khan", admissionNo: "ADM-2026-0010", cls: "Grade 6", section: "B", date: "2026-01-02", status: "Printed" },
  { id: "AL-006", student: "Fahad Noor", admissionNo: "ADM-2026-0009", cls: "Grade 2", section: "A", date: "2025-12-28", status: "Generated" },
];

/* ---------------------------------------------------------- Job Letters */
export type JobLetter = {
  id: string; employee: string; designation: string; department: string;
  date: string; status: "Generated" | "Pending" | "Printed";
};

export const JOB_LETTERS: JobLetter[] = [
  { id: "JL-001", employee: "Ayesha Malik", designation: "Teacher", department: "Academics", date: "2026-01-08", status: "Generated" },
  { id: "JL-002", employee: "Kiran Shah", designation: "Lab Assistant", department: "Science Lab", date: "2026-01-05", status: "Printed" },
  { id: "JL-003", employee: "Farhan Sheikh", designation: "IT Support", department: "Technology", date: "2025-12-30", status: "Generated" },
  { id: "JL-004", employee: "Hassan Sheikh", designation: "Receptionist", department: "Front Office", date: "2025-12-22", status: "Pending" },
  { id: "JL-005", employee: "Maria Fernandes", designation: "Accountant", department: "Finance", date: "2025-12-15", status: "Printed" },
];

/* ------------------------------------------------------ Rules & Regulations */
export type RuleRow = { id: string; title: string; body: string; status: ActiveStatus };

export const RULES: RuleRow[] = [
  { id: "RULE-01", title: "Uniform Policy", body: "All students must wear the prescribed school uniform on all working days. Sports uniform is allowed only on designated days.", status: "Active" },
  { id: "RULE-02", title: "Punctuality", body: "Students must arrive at school before the assembly bell. Late arrivals require a guardian note.", status: "Active" },
  { id: "RULE-03", title: "Leave & Absence", body: "Leave applications must be submitted in advance through the class teacher or the school portal.", status: "Active" },
  { id: "RULE-04", title: "Fee Payment", body: "Monthly fees must be paid by the 10th of each month. A late fee may apply after the due date.", status: "Active" },
  { id: "RULE-05", title: "Mobile Phones", body: "Mobile phones are not permitted inside classrooms without prior permission from the administration.", status: "Inactive" },
  { id: "RULE-06", title: "Discipline", body: "Bullying, harassment, or damage to school property is strictly prohibited and may lead to disciplinary action.", status: "Active" },
];

/* ------------------------------------------------------------ Dashboard */
export const DASHBOARD_STATS = {
  totalStudents: 794, activeStudents: 741, inactiveStudents: 53,
  totalClasses: 12, totalEmployees: 68,
  pendingFees: 486000, collectedFees: 1245000, expenses: 494500, income: 1705000,
};

export const RECENT_ADMISSIONS = STUDENT_ROWS.slice(9, 14);

export const RECENT_ACTIVITIES = [
  { id: 1, text: "New admission approved for Laiba Anwar (Grade 1-C)", time: "10 minutes ago", tone: "green" },
  { id: 2, text: "Fee payment recorded for Sara Ahmed — Rs 20,000", time: "1 hour ago", tone: "blue" },
  { id: 3, text: "Monthly invoice batch generated for January 2026", time: "3 hours ago", tone: "purple" },
  { id: 4, text: "New employee added: Ayesha Malik (Teacher)", time: "Yesterday", tone: "green" },
  { id: 5, text: "Grade 8-B attendance marked as incomplete", time: "Yesterday", tone: "orange" },
  { id: 6, text: "Scholarship discount applied to family FAM-004", time: "2 days ago", tone: "blue" },
];

/* -------------------------------------------------------- Notifications */
export type NotificationRow = {
  id: number; title: string; message: string; time: string;
  icon: "user" | "fee" | "invoice" | "calendar" | "staff" | "chat";
  tone: "blue" | "green" | "purple" | "orange" | "red" | "gray";
  read: boolean;
};

export const NOTIFICATIONS: NotificationRow[] = [
  { id: 1, title: "New admission request", message: "Laiba Anwar has applied for Grade 1-C. Review the admission form.", time: "10 minutes ago", icon: "user", tone: "blue", read: false },
  { id: 2, title: "Fee payment received", message: "Rs 20,000 received from Sara Ahmed (Grade 5-A).", time: "1 hour ago", icon: "fee", tone: "green", read: false },
  { id: 3, title: "Invoice batch generated", message: "Monthly invoices for January 2026 are ready to send.", time: "3 hours ago", icon: "invoice", tone: "purple", read: false },
  { id: 4, title: "Attendance incomplete", message: "Grade 8-B attendance was not marked for today.", time: "Yesterday", icon: "calendar", tone: "orange", read: true },
  { id: 5, title: "New employee added", message: "Ayesha Malik was added as a Teacher in Academics.", time: "Yesterday", icon: "staff", tone: "blue", read: true },
  { id: 6, title: "New message from guardian", message: "Parent of Bilal Raza (Grade 9-A) sent a message.", time: "2 days ago", icon: "chat", tone: "gray", read: true },
];

export const UPCOMING_EVENTS = [
  { id: 1, title: "Parent–Teacher Meeting", date: "Feb 08, 2026", tag: "Meeting" },
  { id: 2, title: "Mid-term Examinations Begin", date: "Feb 12, 2026", tag: "Exams" },
  { id: 3, title: "Annual Sports Day", date: "Feb 20, 2026", tag: "Event" },
  { id: 4, title: "Fee Submission Deadline", date: "Feb 10, 2026", tag: "Finance" },
];

export const ENROLLMENT_TREND = [
  { label: "Aug", value: 720 }, { label: "Sep", value: 742 }, { label: "Oct", value: 755 },
  { label: "Nov", value: 768 }, { label: "Dec", value: 781 }, { label: "Jan", value: 794 },
];

export const FEE_COLLECTION_TREND = [
  { label: "Sep", value: 980000 }, { label: "Oct", value: 1120000 },
  { label: "Nov", value: 1050000 }, { label: "Dec", value: 1180000 }, { label: "Jan", value: 1245000 },
];

/* ------------------------------------------------------------- Constants */
export const DESIGNATIONS = [
  "Principal", "Vice Principal", "Senior Teacher", "Teacher", "Accountant",
  "Receptionist", "Lab Assistant", "IT Support", "Librarian", "Driver", "Security Guard",
];
export const DEPARTMENTS = [
  "Administration", "Academics", "Finance", "Front Office", "Science Lab",
  "Technology", "Library", "Transport", "Security",
];
export const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Part-time", "Visiting"];
export const INCOME_CATEGORIES = ["Fee Collection", "Admissions", "Donations", "Events", "Rent", "Miscellaneous"];
export const EXPENSE_CATEGORIES = ["Salaries", "Utilities", "Supplies", "Transport", "Maintenance", "Events", "Marketing", "Miscellaneous"];
export const FREQUENCIES = ["Monthly", "Quarterly", "Annually", "One-time"];

export const SCHOOL = {
  name: "FastNxt School System",
  shortName: "FastNxt",
  address: "",
  phone: "",
  email: "",
  website: "",
  instituteNo: "",
  principal: "",
  session: "2025-2026",
};

