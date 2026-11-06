/* ============================================================================
   FastNxt — School-module mock data (frontend prototype only)
   ---------------------------------------------------------------------------
   Every record carries a real `branchId` so branch isolation is a straight
   match (no hashing). Relationships stay realistic:
     Branch → Class → Section → Student → (Attendance, Fees, Exams, …)
     Branch → Employee  → (Attendance, Leave, Payroll)
     Branch → Vehicle   → Route → Students
   ========================================================================== */

import { BRANCH_DASHBOARD_STATS } from "@/lib/branch-mock-data";

export const BID = { MAIN: "BR-MAIN", GUL: "BR-GUL", NORTH: "BR-NORTH", DHA: "BR-DHA" } as const;
export type BranchId = (typeof BID)[keyof typeof BID];

/* --------------------------------------------------------------- Timetable */
export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "08:00", end: "08:45" }, 2: { start: "08:45", end: "09:30" },
  3: { start: "09:40", end: "10:25" }, 4: { start: "10:25", end: "11:10" },
  5: { start: "11:40", end: "12:25" }, 6: { start: "12:25", end: "13:10" },
  7: { start: "13:20", end: "14:05" }, 8: { start: "14:05", end: "14:50" },
};

export type TimetableSlot = {
  id: string; branchId: string; cls: string; section: string;
  day: (typeof WEEK_DAYS)[number]; period: number;
  subject: string; teacher: string; room: string;
};

export const TIMETABLE_SLOTS: TimetableSlot[] = [
  { id: "TT-001", branchId: BID.MAIN, cls: "Grade 10", section: "A", day: "Monday", period: 1, subject: "Mathematics", teacher: "Bilal Raza", room: "R-101" },
  { id: "TT-002", branchId: BID.MAIN, cls: "Grade 10", section: "A", day: "Monday", period: 2, subject: "English", teacher: "Ayesha Malik", room: "R-101" },
  { id: "TT-003", branchId: BID.MAIN, cls: "Grade 10", section: "A", day: "Monday", period: 3, subject: "Physics", teacher: "Kiran Shah", room: "Lab-1" },
  { id: "TT-004", branchId: BID.MAIN, cls: "Grade 10", section: "A", day: "Monday", period: 4, subject: "Urdu", teacher: "Nadia Rehman", room: "R-101" },
  { id: "TT-005", branchId: BID.MAIN, cls: "Grade 9", section: "B", day: "Monday", period: 1, subject: "Mathematics", teacher: "Bilal Raza", room: "R-102" },
  { id: "TT-006", branchId: BID.MAIN, cls: "Grade 9", section: "B", day: "Monday", period: 2, subject: "Islamiat", teacher: "Omar Farooq", room: "R-102" },
  { id: "TT-007", branchId: BID.MAIN, cls: "Grade 9", section: "B", day: "Tuesday", period: 1, subject: "English", teacher: "Ayesha Malik", room: "R-102" },
  { id: "TT-008", branchId: BID.GUL, cls: "Grade 8", section: "A", day: "Monday", period: 1, subject: "Mathematics", teacher: "Sana Iqbal", room: "G-201" },
  { id: "TT-009", branchId: BID.GUL, cls: "Grade 8", section: "A", day: "Monday", period: 2, subject: "Science", teacher: "Hina Aslam", room: "G-Lab" },
  { id: "TT-010", branchId: BID.GUL, cls: "Grade 7", section: "A", day: "Monday", period: 1, subject: "English", teacher: "Daniel Okafor", room: "G-202" },
  { id: "TT-011", branchId: BID.NORTH, cls: "Grade 6", section: "A", day: "Monday", period: 1, subject: "Mathematics", teacher: "Priya Nair", room: "N-101" },
  { id: "TT-012", branchId: BID.NORTH, cls: "Grade 6", section: "A", day: "Monday", period: 2, subject: "Science", teacher: "Liam Bennett", room: "N-Lab" },
  { id: "TT-013", branchId: BID.DHA, cls: "Grade 5", section: "A", day: "Monday", period: 1, subject: "English", teacher: "Maria Fernandes", room: "D-101" },
  { id: "TT-014", branchId: BID.DHA, cls: "Grade 5", section: "A", day: "Monday", period: 2, subject: "Mathematics", teacher: "Farhan Sheikh", room: "D-101" },
  { id: "TT-015", branchId: BID.DHA, cls: "Grade 4", section: "A", day: "Tuesday", period: 1, subject: "Science", teacher: "Nadia Rehman", room: "D-Lab" },
];

/* --------------------------------------------------------------- Attendance */
export type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";
export type StudentAttendance = {
  id: string; branchId: string; student: string; cls: string; section: string;
  date: string; status: AttendanceStatus; remark: string;
};

export const STUDENT_ATTENDANCE: StudentAttendance[] = [
  { id: "ATT-001", branchId: BID.MAIN, student: "Hamza Khan", cls: "Grade 10", section: "A", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-002", branchId: BID.MAIN, student: "Sara Ahmed", cls: "Grade 9", section: "B", date: "2026-02-09", status: "Late", remark: "Bus delay" },
  { id: "ATT-003", branchId: BID.MAIN, student: "Bilal Raza", cls: "Grade 8", section: "A", date: "2026-02-09", status: "Absent", remark: "Guardian informed" },
  { id: "ATT-004", branchId: BID.MAIN, student: "Ayesha Malik", cls: "Grade 10", section: "A", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-005", branchId: BID.MAIN, student: "Usman Tariq", cls: "Grade 7", section: "C", date: "2026-02-09", status: "Leave", remark: "Medical leave" },
  { id: "ATT-006", branchId: BID.GUL, student: "Zainab Fatima", cls: "Grade 9", section: "A", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-007", branchId: BID.GUL, student: "Ali Hassan", cls: "Grade 6", section: "B", date: "2026-02-09", status: "Absent", remark: "" },
  { id: "ATT-008", branchId: BID.GUL, student: "Fatima Noor", cls: "Grade 10", section: "B", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-009", branchId: BID.NORTH, student: "Omar Farooq", cls: "Grade 8", section: "B", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-010", branchId: BID.NORTH, student: "Hina Sheikh", cls: "Grade 5", section: "A", date: "2026-02-09", status: "Late", remark: "" },
  { id: "ATT-011", branchId: BID.DHA, student: "Daniyal Abbas", cls: "Grade 4", section: "A", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-012", branchId: BID.DHA, student: "Maryam Javed", cls: "Grade 3", section: "B", date: "2026-02-09", status: "Present", remark: "" },
  { id: "ATT-013", branchId: BID.DHA, student: "Ahmed Raza", cls: "Grade 2", section: "A", date: "2026-02-09", status: "Absent", remark: "Fever" },
  { id: "ATT-014", branchId: BID.MAIN, student: "Laiba Anwar", cls: "Grade 1", section: "C", date: "2026-02-09", status: "Present", remark: "" },
];

export type StaffAttendance = {
  id: string; branchId: string; employee: string; designation: string; department: string;
  date: string; status: AttendanceStatus; inTime: string; outTime: string;
};

export const STAFF_ATTENDANCE: StaffAttendance[] = [
  { id: "SAT-001", branchId: BID.MAIN, employee: "Amara Reyes", designation: "Principal", department: "Administration", date: "2026-02-09", status: "Present", inTime: "07:45", outTime: "15:30" },
  { id: "SAT-002", branchId: BID.MAIN, employee: "Bilal Raza", designation: "Teacher", department: "Academics", date: "2026-02-09", status: "Present", inTime: "07:55", outTime: "14:55" },
  { id: "SAT-003", branchId: BID.MAIN, employee: "Maria Fernandes", designation: "Accountant", department: "Finance", date: "2026-02-09", status: "Late", inTime: "08:35", outTime: "16:10" },
  { id: "SAT-004", branchId: BID.MAIN, employee: "Kiran Shah", designation: "Lab Assistant", department: "Science Lab", date: "2026-02-09", status: "Leave", inTime: "—", outTime: "—" },
  { id: "SAT-005", branchId: BID.GUL, employee: "Hassan Mahmood", designation: "Principal", department: "Administration", date: "2026-02-09", status: "Present", inTime: "07:50", outTime: "15:20" },
  { id: "SAT-006", branchId: BID.GUL, employee: "Sana Iqbal", designation: "Teacher", department: "Academics", date: "2026-02-09", status: "Present", inTime: "07:58", outTime: "14:50" },
  { id: "SAT-007", branchId: BID.NORTH, employee: "Fatima Siddiqui", designation: "Principal", department: "Administration", date: "2026-02-09", status: "Present", inTime: "07:48", outTime: "15:15" },
  { id: "SAT-008", branchId: BID.NORTH, employee: "Liam Bennett", designation: "Teacher", department: "Academics", date: "2026-02-09", status: "Absent", inTime: "—", outTime: "—" },
  { id: "SAT-009", branchId: BID.DHA, employee: "Omar Khalid", designation: "Principal", department: "Administration", date: "2026-02-09", status: "Present", inTime: "07:52", outTime: "15:25" },
  { id: "SAT-010", branchId: BID.DHA, employee: "Farhan Sheikh", designation: "IT Support", department: "Technology", date: "2026-02-09", status: "Present", inTime: "08:00", outTime: "16:00" },
];

/* --------------------------------------------------------- Exams & Results */
export type ExamRow = {
  id: string; branchId: string; name: string; type: "Monthly" | "Mid-Term" | "Final" | "Quiz";
  session: string; startDate: string; endDate: string; classes: number;
  status: "Scheduled" | "Marks Entry" | "Verification" | "Published" | "Draft";
};

export const EXAMS: ExamRow[] = [
  { id: "EXM-01", branchId: BID.MAIN, name: "Mid-Term 2026", type: "Mid-Term", session: "2025-2026", startDate: "2026-02-16", endDate: "2026-02-25", classes: 12, status: "Scheduled" },
  { id: "EXM-02", branchId: BID.MAIN, name: "Monthly Test — February", type: "Monthly", session: "2025-2026", startDate: "2026-02-03", endDate: "2026-02-05", classes: 12, status: "Marks Entry" },
  { id: "EXM-03", branchId: BID.MAIN, name: "Final Term 2025", type: "Final", session: "2025-2026", startDate: "2025-12-08", endDate: "2025-12-18", classes: 12, status: "Published" },
  { id: "EXM-04", branchId: BID.GUL, name: "Mid-Term 2026", type: "Mid-Term", session: "2025-2026", startDate: "2026-02-16", endDate: "2026-02-25", classes: 10, status: "Scheduled" },
  { id: "EXM-05", branchId: BID.GUL, name: "Monthly Test — February", type: "Monthly", session: "2025-2026", startDate: "2026-02-04", endDate: "2026-02-06", classes: 10, status: "Verification" },
  { id: "EXM-06", branchId: BID.NORTH, name: "Mid-Term 2026", type: "Mid-Term", session: "2025-2026", startDate: "2026-02-17", endDate: "2026-02-26", classes: 8, status: "Draft" },
  { id: "EXM-07", branchId: BID.NORTH, name: "Final Term 2025", type: "Final", session: "2025-2026", startDate: "2025-12-09", endDate: "2025-12-19", classes: 8, status: "Published" },
  { id: "EXM-08", branchId: BID.DHA, name: "Mid-Term 2026", type: "Mid-Term", session: "2025-2026", startDate: "2026-02-16", endDate: "2026-02-25", classes: 9, status: "Scheduled" },
  { id: "EXM-09", branchId: BID.DHA, name: "Unit Quiz — Science", type: "Quiz", session: "2025-2026", startDate: "2026-02-10", endDate: "2026-02-10", classes: 4, status: "Marks Entry" },
  { id: "EXM-10", branchId: BID.DHA, name: "Final Term 2025", type: "Final", session: "2025-2026", startDate: "2025-12-10", endDate: "2025-12-20", classes: 9, status: "Published" },
];

export type ExamScheduleRow = {
  id: string; branchId: string; exam: string; cls: string; subject: string;
  date: string; startTime: string; endTime: string; room: string; invigilator: string;
};

export const EXAM_SCHEDULE: ExamScheduleRow[] = [
  { id: "ES-001", branchId: BID.MAIN, exam: "Mid-Term 2026", cls: "Grade 10", subject: "Mathematics", date: "2026-02-16", startTime: "09:00", endTime: "11:00", room: "Hall A", invigilator: "Bilal Raza" },
  { id: "ES-002", branchId: BID.MAIN, exam: "Mid-Term 2026", cls: "Grade 10", subject: "English", date: "2026-02-18", startTime: "09:00", endTime: "11:00", room: "Hall A", invigilator: "Ayesha Malik" },
  { id: "ES-003", branchId: BID.MAIN, exam: "Mid-Term 2026", cls: "Grade 10", subject: "Physics", date: "2026-02-20", startTime: "09:00", endTime: "11:00", room: "Lab-1", invigilator: "Kiran Shah" },
  { id: "ES-004", branchId: BID.MAIN, exam: "Mid-Term 2026", cls: "Grade 9", subject: "Mathematics", date: "2026-02-17", startTime: "09:00", endTime: "11:00", room: "Hall B", invigilator: "Nadia Rehman" },
  { id: "ES-005", branchId: BID.GUL, exam: "Mid-Term 2026", cls: "Grade 8", subject: "Science", date: "2026-02-17", startTime: "09:00", endTime: "11:00", room: "G-Hall", invigilator: "Hina Aslam" },
  { id: "ES-006", branchId: BID.GUL, exam: "Mid-Term 2026", cls: "Grade 8", subject: "Mathematics", date: "2026-02-19", startTime: "09:00", endTime: "11:00", room: "G-Hall", invigilator: "Sana Iqbal" },
  { id: "ES-007", branchId: BID.NORTH, exam: "Mid-Term 2026", cls: "Grade 6", subject: "English", date: "2026-02-18", startTime: "09:00", endTime: "11:00", room: "N-Hall", invigilator: "Priya Nair" },
  { id: "ES-008", branchId: BID.DHA, exam: "Mid-Term 2026", cls: "Grade 5", subject: "Mathematics", date: "2026-02-16", startTime: "09:00", endTime: "11:00", room: "D-Hall", invigilator: "Farhan Sheikh" },
  { id: "ES-009", branchId: BID.DHA, exam: "Unit Quiz — Science", cls: "Grade 5", subject: "Science", date: "2026-02-10", startTime: "11:30", endTime: "12:30", room: "D-101", invigilator: "Maria Fernandes" },
];

export type ResultRow = {
  id: string; branchId: string; student: string; cls: string; section: string; exam: string;
  obtained: number; total: number; percentage: number; grade: string; position: number;
};

export const RESULTS: ResultRow[] = [
  { id: "RES-001", branchId: BID.MAIN, student: "Hamza Khan", cls: "Grade 10", section: "A", exam: "Final Term 2025", obtained: 842, total: 950, percentage: 88.6, grade: "A", position: 2 },
  { id: "RES-002", branchId: BID.MAIN, student: "Ayesha Malik", cls: "Grade 10", section: "A", exam: "Final Term 2025", obtained: 874, total: 950, percentage: 92.0, grade: "A+", position: 1 },
  { id: "RES-003", branchId: BID.MAIN, student: "Sara Ahmed", cls: "Grade 9", section: "B", exam: "Final Term 2025", obtained: 689, total: 850, percentage: 81.1, grade: "B+", position: 5 },
  { id: "RES-004", branchId: BID.MAIN, student: "Bilal Raza", cls: "Grade 8", section: "A", exam: "Final Term 2025", obtained: 611, total: 800, percentage: 76.4, grade: "B", position: 9 },
  { id: "RES-005", branchId: BID.GUL, student: "Fatima Noor", cls: "Grade 10", section: "B", exam: "Final Term 2025", obtained: 720, total: 850, percentage: 84.7, grade: "A", position: 3 },
  { id: "RES-006", branchId: BID.GUL, student: "Zainab Fatima", cls: "Grade 9", section: "A", exam: "Final Term 2025", obtained: 702, total: 850, percentage: 82.6, grade: "A", position: 4 },
  { id: "RES-007", branchId: BID.NORTH, student: "Omar Farooq", cls: "Grade 8", section: "B", exam: "Final Term 2025", obtained: 594, total: 800, percentage: 74.3, grade: "B", position: 11 },
  { id: "RES-008", branchId: BID.NORTH, student: "Hina Sheikh", cls: "Grade 5", section: "A", exam: "Final Term 2025", obtained: 531, total: 650, percentage: 81.7, grade: "B+", position: 6 },
  { id: "RES-009", branchId: BID.DHA, student: "Daniyal Abbas", cls: "Grade 4", section: "A", exam: "Final Term 2025", obtained: 498, total: 600, percentage: 83.0, grade: "A", position: 4 },
  { id: "RES-010", branchId: BID.DHA, student: "Maryam Javed", cls: "Grade 3", section: "B", exam: "Final Term 2025", obtained: 505, total: 600, percentage: 84.2, grade: "A", position: 3 },
];

export type HomeworkRow = {
  id: string; branchId: string; cls: string; section: string; subject: string; title: string;
  teacher: string; assigned: string; due: string; submitted: number; total: number;
  status: "Open" | "Due Soon" | "Closed" | "Grading";
};

export const HOMEWORK: HomeworkRow[] = [
  { id: "HW-001", branchId: BID.MAIN, cls: "Grade 10", section: "A", subject: "Mathematics", title: "Quadratic Equations — Worksheet 4", teacher: "Bilal Raza", assigned: "2026-02-06", due: "2026-02-10", submitted: 18, total: 32, status: "Open" },
  { id: "HW-002", branchId: BID.MAIN, cls: "Grade 10", section: "A", subject: "English", title: "Essay: My Role Model", teacher: "Ayesha Malik", assigned: "2026-02-05", due: "2026-02-09", submitted: 30, total: 32, status: "Grading" },
  { id: "HW-003", branchId: BID.MAIN, cls: "Grade 9", section: "B", subject: "Physics", title: "Newton's Laws — Numericals", teacher: "Kiran Shah", assigned: "2026-02-04", due: "2026-02-08", submitted: 28, total: 30, status: "Closed" },
  { id: "HW-004", branchId: BID.GUL, cls: "Grade 8", section: "A", subject: "Science", title: "Photosynthesis — Diagram & Notes", teacher: "Hina Aslam", assigned: "2026-02-06", due: "2026-02-11", submitted: 12, total: 28, status: "Open" },
  { id: "HW-005", branchId: BID.GUL, cls: "Grade 7", section: "A", subject: "English", title: "Reading Comprehension Ch. 5", teacher: "Daniel Okafor", assigned: "2026-02-05", due: "2026-02-09", submitted: 26, total: 30, status: "Due Soon" },
  { id: "HW-006", branchId: BID.NORTH, cls: "Grade 6", section: "A", subject: "Mathematics", title: "Fractions Practice Set", teacher: "Priya Nair", assigned: "2026-02-06", due: "2026-02-10", submitted: 15, total: 26, status: "Open" },
  { id: "HW-007", branchId: BID.DHA, cls: "Grade 5", section: "A", subject: "English", title: "Creative Writing — A Rainy Day", teacher: "Maria Fernandes", assigned: "2026-02-07", due: "2026-02-11", submitted: 9, total: 24, status: "Open" },
  { id: "HW-008", branchId: BID.DHA, cls: "Grade 4", section: "A", subject: "Science", title: "Plants & Their Parts", teacher: "Nadia Rehman", assigned: "2026-02-04", due: "2026-02-08", submitted: 22, total: 24, status: "Grading" },
];

/* ------------------------------------------------------------------ Library */
export type BookRow = {
  id: string; branchId: string; title: string; author: string; category: string;
  isbn: string; copies: number; available: number; status: "Available" | "Low Stock" | "Out of Stock";
};

export const BOOKS: BookRow[] = [
  { id: "BK-001", branchId: BID.MAIN, title: "Oxford Mathematics 10", author: "D. Rayner", category: "Mathematics", isbn: "978-019-1", copies: 40, available: 12, status: "Available" },
  { id: "BK-002", branchId: BID.MAIN, title: "Physics for Grade 10", author: "R. Khan", category: "Science", isbn: "978-019-2", copies: 35, available: 4, status: "Low Stock" },
  { id: "BK-003", branchId: BID.MAIN, title: "English Literature Reader", author: "J. Austen (ed.)", category: "English", isbn: "978-019-3", copies: 50, available: 0, status: "Out of Stock" },
  { id: "BK-004", branchId: BID.MAIN, title: "Islamic Studies — Grade 9", author: "M. Iqbal", category: "Islamiat", isbn: "978-019-4", copies: 30, available: 18, status: "Available" },
  { id: "BK-005", branchId: BID.GUL, title: "General Science 8", author: "S. Ali", category: "Science", isbn: "978-019-5", copies: 28, available: 9, status: "Available" },
  { id: "BK-006", branchId: BID.GUL, title: "Urdu Grammar", author: "A. Hussain", category: "Urdu", isbn: "978-019-6", copies: 32, available: 5, status: "Low Stock" },
  { id: "BK-007", branchId: BID.NORTH, title: "Mathematics 6", author: "P. Nair", category: "Mathematics", isbn: "978-019-7", copies: 26, available: 14, status: "Available" },
  { id: "BK-008", branchId: BID.DHA, title: "Story Book Collection", author: "Various", category: "Library", isbn: "978-019-8", copies: 60, available: 41, status: "Available" },
  { id: "BK-009", branchId: BID.DHA, title: "Computer Basics", author: "F. Sheikh", category: "Computers", isbn: "978-019-9", copies: 20, available: 3, status: "Low Stock" },
];

export type BookIssueRow = {
  id: string; branchId: string; book: string; member: string; cls: string; issueDate: string;
  dueDate: string; returnDate: string; fine: number; status: "Issued" | "Returned" | "Overdue" | "Lost";
};

export const BOOK_ISSUES: BookIssueRow[] = [
  { id: "BI-001", branchId: BID.MAIN, book: "Oxford Mathematics 10", member: "Hamza Khan", cls: "Grade 10-A", issueDate: "2026-01-28", dueDate: "2026-02-11", returnDate: "—", fine: 0, status: "Issued" },
  { id: "BI-002", branchId: BID.MAIN, book: "Physics for Grade 10", member: "Ayesha Malik", cls: "Grade 10-A", issueDate: "2026-01-20", dueDate: "2026-02-03", returnDate: "—", fine: 120, status: "Overdue" },
  { id: "BI-003", branchId: BID.MAIN, book: "English Literature Reader", member: "Sara Ahmed", cls: "Grade 9-B", issueDate: "2026-01-15", dueDate: "2026-01-29", returnDate: "2026-01-27", fine: 0, status: "Returned" },
  { id: "BI-004", branchId: BID.GUL, book: "General Science 8", member: "Zainab Fatima", cls: "Grade 9-A", issueDate: "2026-02-01", dueDate: "2026-02-15", returnDate: "—", fine: 0, status: "Issued" },
  { id: "BI-005", branchId: BID.GUL, book: "Urdu Grammar", member: "Ali Hassan", cls: "Grade 6-B", issueDate: "2026-01-05", dueDate: "2026-01-19", returnDate: "—", fine: 300, status: "Lost" },
  { id: "BI-006", branchId: BID.NORTH, book: "Mathematics 6", member: "Omar Farooq", cls: "Grade 8-B", issueDate: "2026-02-02", dueDate: "2026-02-16", returnDate: "—", fine: 0, status: "Issued" },
  { id: "BI-007", branchId: BID.DHA, book: "Story Book Collection", member: "Daniyal Abbas", cls: "Grade 4-A", issueDate: "2026-01-25", dueDate: "2026-02-08", returnDate: "—", fine: 60, status: "Overdue" },
  { id: "BI-008", branchId: BID.DHA, book: "Computer Basics", member: "Maryam Javed", cls: "Grade 3-B", issueDate: "2026-01-30", dueDate: "2026-02-13", returnDate: "—", fine: 0, status: "Issued" },
];

/* ---------------------------------------------------------------- Transport */
export type VehicleRow = {
  id: string; branchId: string; number: string; type: string; capacity: number;
  driver: string; route: string; fitness: string; status: "Active" | "Maintenance" | "Inactive";
};

export const VEHICLES: VehicleRow[] = [
  { id: "VH-001", branchId: BID.MAIN, number: "LEB-1234", type: "Bus", capacity: 42, driver: "Akram Ali", route: "Route A — Model Town", fitness: "2026-06-30", status: "Active" },
  { id: "VH-002", branchId: BID.MAIN, number: "LEB-5678", type: "Hiace", capacity: 16, driver: "Rashid Mehmood", route: "Route B — Johar Town", fitness: "2026-04-15", status: "Active" },
  { id: "VH-003", branchId: BID.MAIN, number: "LEB-9012", type: "Bus", capacity: 42, driver: "Naveed Alam", route: "Route C — DHA", fitness: "2026-03-01", status: "Maintenance" },
  { id: "VH-004", branchId: BID.GUL, number: "KHI-2233", type: "Bus", capacity: 40, driver: "Sohail Raza", route: "Route G1 — Gulshan Block 13", fitness: "2026-05-20", status: "Active" },
  { id: "VH-005", branchId: BID.GUL, number: "KHI-4455", type: "Hiace", capacity: 14, driver: "Imtiaz Baig", route: "Route G2 — FB Area", fitness: "2026-07-10", status: "Active" },
  { id: "VH-006", branchId: BID.NORTH, number: "KHI-7788", type: "Bus", capacity: 38, driver: "Zubair Khan", route: "Route N1 — North Nazimabad", fitness: "2026-02-28", status: "Active" },
  { id: "VH-007", branchId: BID.DHA, number: "LEB-3344", type: "Bus", capacity: 44, driver: "Faisal Nadeem", route: "Route D1 — Phase 5", fitness: "2026-08-05", status: "Active" },
  { id: "VH-008", branchId: BID.DHA, number: "LEB-6677", type: "Coaster", capacity: 24, driver: "Waqar Younis", route: "Route D2 — Phase 8", fitness: "2026-09-12", status: "Inactive" },
];

export type RouteRow = {
  id: string; branchId: string; name: string; stops: number; distance: string; students: number; monthlyFee: number;
};

export const TRANSPORT_ROUTES: RouteRow[] = [
  { id: "RT-001", branchId: BID.MAIN, name: "Route A — Model Town", stops: 8, distance: "14 km", students: 38, monthlyFee: 4500 },
  { id: "RT-002", branchId: BID.MAIN, name: "Route B — Johar Town", stops: 6, distance: "11 km", students: 15, monthlyFee: 4000 },
  { id: "RT-003", branchId: BID.MAIN, name: "Route C — DHA", stops: 9, distance: "18 km", students: 40, monthlyFee: 5500 },
  { id: "RT-004", branchId: BID.GUL, name: "Route G1 — Gulshan Block 13", stops: 7, distance: "12 km", students: 36, monthlyFee: 4200 },
  { id: "RT-005", branchId: BID.GUL, name: "Route G2 — FB Area", stops: 5, distance: "9 km", students: 13, monthlyFee: 3500 },
  { id: "RT-006", branchId: BID.NORTH, name: "Route N1 — North Nazimabad", stops: 8, distance: "10 km", students: 34, monthlyFee: 3800 },
  { id: "RT-007", branchId: BID.DHA, name: "Route D1 — Phase 5", stops: 10, distance: "20 km", students: 41, monthlyFee: 6000 },
  { id: "RT-008", branchId: BID.DHA, name: "Route D2 — Phase 8", stops: 6, distance: "15 km", students: 22, monthlyFee: 5200 },
];

/* ------------------------------------------------------------------- Hostel */
export type HostelRoomRow = {
  id: string; branchId: string; hostel: string; room: string; type: string; beds: number;
  occupied: number; warden: string; monthlyFee: number; status: "Occupied" | "Available" | "Blocked";
};

export const HOSTEL_ROOMS: HostelRoomRow[] = [
  { id: "HR-001", branchId: BID.MAIN, hostel: "Boys Hostel A", room: "A-101", type: "Triple", beds: 3, occupied: 3, warden: "Mr. Saleem", monthlyFee: 12000, status: "Occupied" },
  { id: "HR-002", branchId: BID.MAIN, hostel: "Boys Hostel A", room: "A-102", type: "Double", beds: 2, occupied: 1, warden: "Mr. Saleem", monthlyFee: 15000, status: "Available" },
  { id: "HR-003", branchId: BID.MAIN, hostel: "Girls Hostel B", room: "B-201", type: "Double", beds: 2, occupied: 2, warden: "Ms. Rehana", monthlyFee: 16000, status: "Occupied" },
  { id: "HR-004", branchId: BID.GUL, hostel: "Boys Hostel", room: "G-101", type: "Quad", beds: 4, occupied: 3, warden: "Mr. Tauqeer", monthlyFee: 10000, status: "Occupied" },
  { id: "HR-005", branchId: BID.GUL, hostel: "Girls Hostel", room: "GG-105", type: "Triple", beds: 3, occupied: 2, warden: "Ms. Sadia", monthlyFee: 11000, status: "Occupied" },
  { id: "HR-006", branchId: BID.NORTH, hostel: "Boys Hostel", room: "N-101", type: "Double", beds: 2, occupied: 0, warden: "Mr. Yousuf", monthlyFee: 9000, status: "Available" },
  { id: "HR-007", branchId: BID.DHA, hostel: "Boys Hostel", room: "D-101", type: "Triple", beds: 3, occupied: 3, warden: "Mr. Asif", monthlyFee: 18000, status: "Occupied" },
  { id: "HR-008", branchId: BID.DHA, hostel: "Girls Hostel", room: "DG-202", type: "Double", beds: 2, occupied: 2, warden: "Ms. Nazia", monthlyFee: 20000, status: "Occupied" },
];

/* ------------------------------------------------------------------- Health */
export type HealthRow = {
  id: string; branchId: string; student: string; cls: string; bloodGroup: string;
  condition: string; allergy: string; lastVisit: string; status: "Fit" | "Observation" | "Under Treatment";
};

export const HEALTH_RECORDS: HealthRow[] = [
  { id: "HC-001", branchId: BID.MAIN, student: "Hamza Khan", cls: "Grade 10-A", bloodGroup: "O+", condition: "Asthma (mild)", allergy: "Dust", lastVisit: "2026-01-22", status: "Observation" },
  { id: "HC-002", branchId: BID.MAIN, student: "Sara Ahmed", cls: "Grade 9-B", bloodGroup: "A+", condition: "None", allergy: "None", lastVisit: "2025-11-14", status: "Fit" },
  { id: "HC-003", branchId: BID.MAIN, student: "Bilal Raza", cls: "Grade 8-A", bloodGroup: "B+", condition: "Fracture recovery", allergy: "None", lastVisit: "2026-02-03", status: "Under Treatment" },
  { id: "HC-004", branchId: BID.GUL, student: "Zainab Fatima", cls: "Grade 9-A", bloodGroup: "AB+", condition: "None", allergy: "Peanuts", lastVisit: "2025-12-20", status: "Fit" },
  { id: "HC-005", branchId: BID.GUL, student: "Ali Hassan", cls: "Grade 6-B", bloodGroup: "O-", condition: "Low haemoglobin", allergy: "None", lastVisit: "2026-01-18", status: "Observation" },
  { id: "HC-006", branchId: BID.NORTH, student: "Omar Farooq", cls: "Grade 8-B", bloodGroup: "A-", condition: "None", allergy: "Pollen", lastVisit: "2025-10-05", status: "Fit" },
  { id: "HC-007", branchId: BID.DHA, student: "Daniyal Abbas", cls: "Grade 4-A", bloodGroup: "B-", condition: "None", allergy: "None", lastVisit: "2026-01-30", status: "Fit" },
  { id: "HC-008", branchId: BID.DHA, student: "Maryam Javed", cls: "Grade 3-B", bloodGroup: "O+", condition: "Seasonal flu", allergy: "None", lastVisit: "2026-02-05", status: "Under Treatment" },
];

/* --------------------------------------------------------------- Discipline */
export type DisciplineRow = {
  id: string; branchId: string; student: string; cls: string; date: string; type: string;
  severity: "Low" | "Medium" | "High"; reportedBy: string; action: string; status: "Open" | "Resolved" | "Follow-up";
};

export const DISCIPLINE_CASES: DisciplineRow[] = [
  { id: "DC-001", branchId: BID.MAIN, student: "Hamza Khan", cls: "Grade 10-A", date: "2026-02-04", type: "Late arrival (repeated)", severity: "Low", reportedBy: "Bilal Raza", action: "Verbal warning", status: "Resolved" },
  { id: "DC-002", branchId: BID.MAIN, student: "Ali Hassan", cls: "Grade 6-B", date: "2026-01-28", type: "Uniform violation", severity: "Low", reportedBy: "Sana Iqbal", action: "Guardian informed", status: "Resolved" },
  { id: "DC-003", branchId: BID.MAIN, student: "Usman Tariq", cls: "Grade 7-C", date: "2026-02-06", type: "Classroom disruption", severity: "Medium", reportedBy: "Nadia Rehman", action: "Parent meeting scheduled", status: "Follow-up" },
  { id: "DC-004", branchId: BID.GUL, student: "Ali Hassan", cls: "Grade 6-B", date: "2026-01-20", type: "Damage to property", severity: "High", reportedBy: "Hina Aslam", action: "Fine + guardian meeting", status: "Open" },
  { id: "DC-005", branchId: BID.GUL, student: "Zainab Fatima", cls: "Grade 9-A", date: "2026-02-02", type: "Mobile phone use", severity: "Medium", reportedBy: "Sana Iqbal", action: "Phone confiscated, warning", status: "Resolved" },
  { id: "DC-006", branchId: BID.NORTH, student: "Omar Farooq", cls: "Grade 8-B", date: "2026-01-15", type: "Homework not submitted", severity: "Low", reportedBy: "Priya Nair", action: "Extra assignment", status: "Resolved" },
  { id: "DC-007", branchId: BID.DHA, student: "Daniyal Abbas", cls: "Grade 4-A", date: "2026-02-07", type: "Playground incident", severity: "Medium", reportedBy: "Nadia Rehman", action: "Counselling session", status: "Follow-up" },
  { id: "DC-008", branchId: BID.DHA, student: "Maryam Javed", cls: "Grade 3-B", date: "2026-01-25", type: "Late arrival", severity: "Low", reportedBy: "Farhan Sheikh", action: "Verbal warning", status: "Resolved" },
];

/* --------------------------------------------------- Inventory & Assets */
export type InventoryItemRow = {
  id: string; branchId: string; item: string; category: string; qty: number; unit: string;
  reorder: number; supplier: string; value: number; status: "In Stock" | "Low Stock" | "Out of Stock";
};

export const INVENTORY_ITEMS: InventoryItemRow[] = [
  { id: "INV-001", branchId: BID.MAIN, item: "A4 Paper Reams", category: "Stationery", qty: 48, unit: "ream", reorder: 20, supplier: "City Stationers", value: 57600, status: "In Stock" },
  { id: "INV-002", branchId: BID.MAIN, item: "Whiteboard Markers", category: "Stationery", qty: 12, unit: "box", reorder: 15, supplier: "City Stationers", value: 18000, status: "Low Stock" },
  { id: "INV-003", branchId: BID.MAIN, item: "Chalk Boxes", category: "Classroom", qty: 0, unit: "box", reorder: 10, supplier: "SchoolMart", value: 0, status: "Out of Stock" },
  { id: "INV-004", branchId: BID.MAIN, item: "Science Lab Chemicals", category: "Lab", qty: 30, unit: "set", reorder: 8, supplier: "LabTech", value: 145000, status: "In Stock" },
  { id: "INV-005", branchId: BID.GUL, item: "A4 Paper Reams", category: "Stationery", qty: 26, unit: "ream", reorder: 20, supplier: "Karachi Supplies", value: 31200, status: "In Stock" },
  { id: "INV-006", branchId: BID.GUL, item: "Sports Balls", category: "Sports", qty: 6, unit: "pc", reorder: 10, supplier: "PlayWell", value: 24000, status: "Low Stock" },
  { id: "INV-007", branchId: BID.NORTH, item: "Cleaning Supplies", category: "Maintenance", qty: 40, unit: "pack", reorder: 15, supplier: "HygienePro", value: 20000, status: "In Stock" },
  { id: "INV-008", branchId: BID.DHA, item: "Laptops", category: "IT Equipment", qty: 14, unit: "pc", reorder: 5, supplier: "TechHouse", value: 1260000, status: "In Stock" },
  { id: "INV-009", branchId: BID.DHA, item: "Printer Toners", category: "IT Equipment", qty: 3, unit: "pc", reorder: 6, supplier: "TechHouse", value: 45000, status: "Low Stock" },
];

export type AssetRow = {
  id: string; branchId: string; name: string; category: string; tag: string; purchaseDate: string;
  cost: number; location: string; assignee: string; warranty: string; status: "In Use" | "In Store" | "Repair" | "Disposed";
};

export const ASSETS: AssetRow[] = [
  { id: "AS-001", branchId: BID.MAIN, name: "School Bus 42-seater", category: "Vehicle", tag: "AST-1001", purchaseDate: "2022-06-15", cost: 6800000, location: "Transport Yard", assignee: "Akram Ali", warranty: "2027-06-14", status: "In Use" },
  { id: "AS-002", branchId: BID.MAIN, name: "Projector Epson EB-X", category: "IT", tag: "AST-1002", purchaseDate: "2023-02-10", cost: 185000, location: "Grade 10-A", assignee: "Bilal Raza", warranty: "2026-02-09", status: "In Use" },
  { id: "AS-003", branchId: BID.MAIN, name: "Science Lab Microscope", category: "Lab", tag: "AST-1003", purchaseDate: "2021-09-01", cost: 95000, location: "Lab-1", assignee: "Kiran Shah", warranty: "Expired", status: "Repair" },
  { id: "AS-004", branchId: BID.GUL, name: "Desktop Computer Lab (x20)", category: "IT", tag: "AST-2001", purchaseDate: "2023-08-20", cost: 2400000, location: "Computer Lab", assignee: "Daniel Okafor", warranty: "2028-08-19", status: "In Use" },
  { id: "AS-005", branchId: BID.GUL, name: "Library Bookshelf Set", category: "Furniture", tag: "AST-2002", purchaseDate: "2020-03-05", cost: 320000, location: "Library", assignee: "Librarian", warranty: "Expired", status: "In Use" },
  { id: "AS-006", branchId: BID.NORTH, name: "Generator 25 KVA", category: "Utility", tag: "AST-3001", purchaseDate: "2022-11-11", cost: 1250000, location: "Utility Room", assignee: "Facilities", warranty: "2026-11-10", status: "In Use" },
  { id: "AS-007", branchId: BID.DHA, name: "Indoor Sports Equipment", category: "Sports", tag: "AST-4001", purchaseDate: "2024-01-18", cost: 540000, location: "Sports Hall", assignee: "Sports Dept", warranty: "2027-01-17", status: "In Use" },
  { id: "AS-008", branchId: BID.DHA, name: "Old Printers (x5)", category: "IT", tag: "AST-4002", purchaseDate: "2018-05-02", cost: 150000, location: "Store", assignee: "Admin", warranty: "Expired", status: "Disposed" },
];

/* ------------------------------------------- Front Office / Admissions ---- */
export type VisitorRow = {
  id: string; branchId: string; visitor: string; purpose: string; host: string; phone: string;
  date: string; inTime: string; outTime: string; badge: string; status: "In" | "Out";
};

export const VISITORS: VisitorRow[] = [
  { id: "VS-001", branchId: BID.MAIN, visitor: "Imran Khan", purpose: "Parent meeting", host: "Bilal Raza", phone: "0300-1234567", date: "2026-02-09", inTime: "09:10", outTime: "09:55", badge: "V-104", status: "Out" },
  { id: "VS-002", branchId: BID.MAIN, visitor: "Stationery Vendor", purpose: "Delivery", host: "Maria Fernandes", phone: "0321-2233445", date: "2026-02-09", inTime: "10:20", outTime: "—", badge: "V-105", status: "In" },
  { id: "VS-003", branchId: BID.MAIN, visitor: "Board Inspector", purpose: "Inspection", host: "Amara Reyes", phone: "0300-0001122", date: "2026-02-08", inTime: "11:00", outTime: "13:30", badge: "V-103", status: "Out" },
  { id: "VS-004", branchId: BID.GUL, visitor: "Naveed Ahmed", purpose: "Fee enquiry", host: "Front Desk", phone: "0301-2345678", date: "2026-02-09", inTime: "08:45", outTime: "09:20", badge: "V-201", status: "Out" },
  { id: "VS-005", branchId: BID.GUL, visitor: "Campus Electrician", purpose: "Maintenance", host: "Facilities", phone: "0333-4455667", date: "2026-02-09", inTime: "12:00", outTime: "—", badge: "V-202", status: "In" },
  { id: "VS-006", branchId: BID.NORTH, visitor: "Tariq Raza", purpose: "Admission enquiry", host: "Reception", phone: "0302-3456789", date: "2026-02-09", inTime: "10:05", outTime: "10:40", badge: "V-301", status: "Out" },
  { id: "VS-007", branchId: BID.DHA, visitor: "Adnan Malik", purpose: "PTM", host: "Principal Office", phone: "0303-4567890", date: "2026-02-09", inTime: "14:10", outTime: "—", badge: "V-401", status: "In" },
  { id: "VS-008", branchId: BID.DHA, visitor: "New Uniform Supplier", purpose: "Vendor meeting", host: "Admin", phone: "0304-5566778", date: "2026-02-08", inTime: "11:30", outTime: "12:15", badge: "V-402", status: "Out" },
];

export type EnquiryStage = "Enquiry" | "Follow-up" | "Application" | "Test" | "Approved" | "Admitted" | "Rejected";
export type EnquiryRow = {
  id: string; branchId: string; applicant: string; guardian: string; phone: string; cls: string;
  source: string; stage: EnquiryStage; followUp: string; counselor: string;
};

export const ADMISSION_ENQUIRIES: EnquiryRow[] = [
  { id: "ENQ-001", branchId: BID.MAIN, applicant: "Hira Malik", guardian: "Junaid Malik", phone: "0300-1112233", cls: "Grade 1", source: "Walk-in", stage: "Test", followUp: "2026-02-12", counselor: "Front Desk" },
  { id: "ENQ-002", branchId: BID.MAIN, applicant: "Zohaib Hassan", guardian: "Rizwan Hassan", phone: "0300-2223344", cls: "Grade 6", source: "Website", stage: "Application", followUp: "2026-02-11", counselor: "Reception" },
  { id: "ENQ-003", branchId: BID.MAIN, applicant: "Areeba Shah", guardian: "Nadeem Shah", phone: "0300-3334455", cls: "Nursery", source: "Reference", stage: "Approved", followUp: "2026-02-10", counselor: "Admin" },
  { id: "ENQ-004", branchId: BID.GUL, applicant: "Saad Iqbal", guardian: "Asif Iqbal", phone: "0301-4445566", cls: "Grade 3", source: "Walk-in", stage: "Enquiry", followUp: "2026-02-13", counselor: "Front Desk" },
  { id: "ENQ-005", branchId: BID.GUL, applicant: "Mahnoor Ali", guardian: "Faisal Ali", phone: "0301-5556677", cls: "Grade 8", source: "Website", stage: "Follow-up", followUp: "2026-02-14", counselor: "Reception" },
  { id: "ENQ-006", branchId: BID.NORTH, applicant: "Bilal Nasir", guardian: "Nasir Ahmed", phone: "0302-6667788", cls: "Grade 2", source: "Social Media", stage: "Admitted", followUp: "—", counselor: "Admin" },
  { id: "ENQ-007", branchId: BID.NORTH, applicant: "Kashif Jameel", guardian: "Jameel Akhtar", phone: "0302-7778899", cls: "Grade 5", source: "Walk-in", stage: "Rejected", followUp: "—", counselor: "Front Desk" },
  { id: "ENQ-008", branchId: BID.DHA, applicant: "Emaan Yousaf", guardian: "Yousaf Raza", phone: "0303-8889900", cls: "KG", source: "Reference", stage: "Test", followUp: "2026-02-12", counselor: "Reception" },
  { id: "ENQ-009", branchId: BID.DHA, applicant: "Hassan Raza", guardian: "Kamran Raza", phone: "0303-9990011", cls: "Grade 4", source: "Website", stage: "Application", followUp: "2026-02-15", counselor: "Admin" },
];

/* ------------------------------------------------------- Events & Calendar */
export type EventRow = {
  id: string; branchId: string; title: string; type: string; startDate: string; endDate: string;
  venue: string; audience: string; status: "Upcoming" | "Ongoing" | "Completed";
};

export const EVENTS: EventRow[] = [
  { id: "EV-001", branchId: BID.MAIN, title: "Parent–Teacher Meeting", type: "Meeting", startDate: "2026-02-08", endDate: "2026-02-08", venue: "Main Auditorium", audience: "Parents & Teachers", status: "Completed" },
  { id: "EV-002", branchId: BID.MAIN, title: "Mid-Term Examinations", type: "Exams", startDate: "2026-02-16", endDate: "2026-02-25", venue: "Exam Halls", audience: "Grade 1–10", status: "Upcoming" },
  { id: "EV-003", branchId: BID.MAIN, title: "Annual Sports Day", type: "Sports", startDate: "2026-02-20", endDate: "2026-02-20", venue: "Main Ground", audience: "All", status: "Upcoming" },
  { id: "EV-004", branchId: BID.GUL, title: "Science Exhibition", type: "Activity", startDate: "2026-02-14", endDate: "2026-02-14", venue: "Science Block", audience: "Grade 6–10", status: "Upcoming" },
  { id: "EV-005", branchId: BID.GUL, title: "PTM — Term 2", type: "Meeting", startDate: "2026-02-22", endDate: "2026-02-22", venue: "Classrooms", audience: "Parents", status: "Upcoming" },
  { id: "EV-006", branchId: BID.NORTH, title: "Quran Competition", type: "Activity", startDate: "2026-02-18", endDate: "2026-02-18", venue: "Hall", audience: "All", status: "Upcoming" },
  { id: "EV-007", branchId: BID.DHA, title: "Inter-House Cricket", type: "Sports", startDate: "2026-02-12", endDate: "2026-02-13", venue: "Sports Ground", audience: "Grade 4–10", status: "Upcoming" },
  { id: "EV-008", branchId: BID.DHA, title: "Art & Craft Festival", type: "Activity", startDate: "2026-02-05", endDate: "2026-02-05", venue: "Art Room", audience: "Grade 1–5", status: "Completed" },
];

/* ------------------------------------------------------------ Communication */
export type NoticeRow = {
  id: string; branchId: string; title: string; audience: string; channel: string; type: string;
  date: string; reach: number; status: "Draft" | "Scheduled" | "Sent" | "Failed";
};

export const NOTICES: NoticeRow[] = [
  { id: "NT-001", branchId: BID.MAIN, title: "Fee Submission Deadline — February", audience: "All Parents", channel: "SMS + App", type: "Circular", date: "2026-02-05", reach: 1500, status: "Sent" },
  { id: "NT-002", branchId: BID.MAIN, title: "Mid-Term Date Sheet Published", audience: "Students & Parents", channel: "App", type: "Notice", date: "2026-02-07", reach: 1500, status: "Sent" },
  { id: "NT-003", branchId: BID.MAIN, title: "Sports Day Volunteers Needed", audience: "Employees", channel: "Email", type: "Announcement", date: "2026-02-09", reach: 126, status: "Scheduled" },
  { id: "NT-004", branchId: BID.GUL, title: "Science Exhibition Entry Open", audience: "Grade 6–10", channel: "App", type: "Notice", date: "2026-02-06", reach: 620, status: "Sent" },
  { id: "NT-005", branchId: BID.GUL, title: "Holiday — Kashmir Day", audience: "All", channel: "SMS + App", type: "Circular", date: "2026-02-04", reach: 1200, status: "Sent" },
  { id: "NT-006", branchId: BID.NORTH, title: "PTM Schedule — Term 2", audience: "Parents", channel: "App", type: "Notice", date: "2026-02-08", reach: 950, status: "Sent" },
  { id: "NT-007", branchId: BID.DHA, title: "Transport Route Change", audience: "Transport Parents", channel: "WhatsApp", type: "Alert", date: "2026-02-09", reach: 359, status: "Failed" },
  { id: "NT-008", branchId: BID.DHA, title: "Inter-House Cricket Trials", audience: "Grade 4–10", channel: "App", type: "Announcement", date: "2026-02-07", reach: 540, status: "Sent" },
];

/* -------------------------------------------------------------- Certificates */
export type CertificateRow = {
  id: string; branchId: string; student: string; cls: string; type: string; requested: string;
  issued: string; verify: string; status: "Requested" | "Generated" | "Issued" | "Rejected";
};

export const CERTIFICATES: CertificateRow[] = [
  { id: "CRT-001", branchId: BID.MAIN, student: "Hamza Khan", cls: "Grade 10-A", type: "Bonafide", requested: "2026-02-02", issued: "2026-02-03", verify: "BN-9F2A", status: "Issued" },
  { id: "CRT-002", branchId: BID.MAIN, student: "Sara Ahmed", cls: "Grade 9-B", type: "Character Certificate", requested: "2026-02-04", issued: "—", verify: "—", status: "Generated" },
  { id: "CRT-003", branchId: BID.MAIN, student: "Ali Hassan", cls: "Grade 6-B", type: "Transfer Certificate", requested: "2026-02-06", issued: "—", verify: "—", status: "Requested" },
  { id: "CRT-004", branchId: BID.GUL, student: "Zainab Fatima", cls: "Grade 9-A", type: "Bonafide", requested: "2026-01-30", issued: "2026-01-31", verify: "BN-7C1D", status: "Issued" },
  { id: "CRT-005", branchId: BID.GUL, student: "Ali Hassan", cls: "Grade 6-B", type: "Leaving Certificate", requested: "2026-02-05", issued: "—", verify: "—", status: "Requested" },
  { id: "CRT-006", branchId: BID.NORTH, student: "Omar Farooq", cls: "Grade 8-B", type: "Character Certificate", requested: "2026-02-03", issued: "2026-02-04", verify: "CH-3B8E", status: "Issued" },
  { id: "CRT-007", branchId: BID.DHA, student: "Daniyal Abbas", cls: "Grade 4-A", type: "Student ID Card", requested: "2026-02-01", issued: "2026-02-02", verify: "ID-5A0C", status: "Issued" },
  { id: "CRT-008", branchId: BID.DHA, student: "Maryam Javed", cls: "Grade 3-B", type: "Transfer Certificate", requested: "2026-02-07", issued: "—", verify: "—", status: "Rejected" },
];

/* ------------------------------------------------------------------ Payroll */
export type PayrollRow = {
  id: string; branchId: string; employee: string; designation: string; department: string; month: string;
  basic: number; allowances: number; deductions: number; net: number; status: "Draft" | "Approved" | "Paid";
};

export const PAYROLL: PayrollRow[] = [
  { id: "PR-001", branchId: BID.MAIN, employee: "Amara Reyes", designation: "Principal", department: "Administration", month: "2026-01", basic: 180000, allowances: 60000, deductions: 22000, net: 218000, status: "Paid" },
  { id: "PR-002", branchId: BID.MAIN, employee: "Bilal Raza", designation: "Teacher", department: "Academics", month: "2026-01", basic: 75000, allowances: 20000, deductions: 9500, net: 85500, status: "Paid" },
  { id: "PR-003", branchId: BID.MAIN, employee: "Maria Fernandes", designation: "Accountant", department: "Finance", month: "2026-01", basic: 90000, allowances: 25000, deductions: 11500, net: 103500, status: "Approved" },
  { id: "PR-004", branchId: BID.MAIN, employee: "Kiran Shah", designation: "Lab Assistant", department: "Science Lab", month: "2026-01", basic: 45000, allowances: 12000, deductions: 5700, net: 51300, status: "Draft" },
  { id: "PR-005", branchId: BID.GUL, employee: "Hassan Mahmood", designation: "Principal", department: "Administration", month: "2026-01", basic: 170000, allowances: 55000, deductions: 21000, net: 204000, status: "Paid" },
  { id: "PR-006", branchId: BID.GUL, employee: "Sana Iqbal", designation: "Teacher", department: "Academics", month: "2026-01", basic: 70000, allowances: 18000, deductions: 8800, net: 79200, status: "Approved" },
  { id: "PR-007", branchId: BID.NORTH, employee: "Fatima Siddiqui", designation: "Principal", department: "Administration", month: "2026-01", basic: 160000, allowances: 50000, deductions: 20000, net: 190000, status: "Paid" },
  { id: "PR-008", branchId: BID.DHA, employee: "Omar Khalid", designation: "Principal", department: "Administration", month: "2026-01", basic: 190000, allowances: 65000, deductions: 24000, net: 231000, status: "Paid" },
  { id: "PR-009", branchId: BID.DHA, employee: "Farhan Sheikh", designation: "IT Support", department: "Technology", month: "2026-01", basic: 80000, allowances: 22000, deductions: 10200, net: 91800, status: "Draft" },
];

/* -------------------------------------------------------------------- Leave */
export type LeaveRow = {
  id: string; branchId: string; person: string; role: string; type: string; from: string; to: string;
  days: number; reason: string; status: "Pending" | "Approved" | "Rejected";
};

export const LEAVE_REQUESTS: LeaveRow[] = [
  { id: "LV-001", branchId: BID.MAIN, person: "Sara Ahmed", role: "Student (Grade 9-B)", type: "Medical", from: "2026-02-09", to: "2026-02-11", days: 3, reason: "Typhoid — doctor advised rest", status: "Approved" },
  { id: "LV-002", branchId: BID.MAIN, person: "Kiran Shah", role: "Lab Assistant", type: "Casual", from: "2026-02-09", to: "2026-02-09", days: 1, reason: "Personal errand", status: "Approved" },
  { id: "LV-003", branchId: BID.MAIN, person: "Usman Tariq", role: "Student (Grade 7-C)", type: "Medical", from: "2026-02-09", to: "2026-02-10", days: 2, reason: "Fever", status: "Pending" },
  { id: "LV-004", branchId: BID.GUL, person: "Sana Iqbal", role: "Teacher", type: "Annual", from: "2026-02-16", to: "2026-02-20", days: 5, reason: "Family vacation", status: "Pending" },
  { id: "LV-005", branchId: BID.GUL, person: "Ali Hassan", role: "Student (Grade 6-B)", type: "Casual", from: "2026-02-06", to: "2026-02-06", days: 1, reason: "Family function", status: "Approved" },
  { id: "LV-006", branchId: BID.NORTH, person: "Liam Bennett", role: "Teacher", type: "Sick", from: "2026-02-09", to: "2026-02-09", days: 1, reason: "Flu", status: "Approved" },
  { id: "LV-007", branchId: BID.DHA, person: "Ahmed Raza", role: "Student (Grade 2-A)", type: "Medical", from: "2026-02-09", to: "2026-02-12", days: 4, reason: "Viral infection", status: "Pending" },
  { id: "LV-008", branchId: BID.DHA, person: "Farhan Sheikh", role: "IT Support", type: "Casual", from: "2026-02-14", to: "2026-02-14", days: 1, reason: "Personal", status: "Rejected" },
];

/* -------------------------------------------------------------- Recruitment */
export type JobRow = {
  id: string; branchId: string; title: string; department: string; type: string;
  positions: number; applicants: number; posted: string; closing: string; status: "Open" | "Closed" | "On Hold";
};

export const JOB_OPENINGS: JobRow[] = [
  { id: "JOB-01", branchId: BID.MAIN, title: "Senior Mathematics Teacher", department: "Academics", type: "Full-time", positions: 2, applicants: 18, posted: "2026-01-20", closing: "2026-02-20", status: "Open" },
  { id: "JOB-02", branchId: BID.MAIN, title: "Lab Assistant", department: "Science Lab", type: "Full-time", positions: 1, applicants: 9, posted: "2026-01-25", closing: "2026-02-18", status: "Open" },
  { id: "JOB-03", branchId: BID.MAIN, title: "Front Desk Receptionist", department: "Front Office", type: "Contract", positions: 1, applicants: 24, posted: "2025-12-15", closing: "2026-01-15", status: "Closed" },
  { id: "JOB-04", branchId: BID.GUL, title: "English Teacher", department: "Academics", type: "Full-time", positions: 1, applicants: 12, posted: "2026-01-28", closing: "2026-02-25", status: "Open" },
  { id: "JOB-05", branchId: BID.GUL, title: "IT Support Officer", department: "Technology", type: "Full-time", positions: 1, applicants: 7, posted: "2026-02-01", closing: "2026-02-28", status: "Open" },
  { id: "JOB-06", branchId: BID.NORTH, title: "Primary Teacher", department: "Academics", type: "Full-time", positions: 3, applicants: 21, posted: "2026-01-18", closing: "2026-02-15", status: "On Hold" },
  { id: "JOB-07", branchId: BID.DHA, title: "Sports Coach", department: "Sports", type: "Part-time", positions: 1, applicants: 6, posted: "2026-02-03", closing: "2026-03-03", status: "Open" },
  { id: "JOB-08", branchId: BID.DHA, title: "Librarian", department: "Library", type: "Full-time", positions: 1, applicants: 11, posted: "2026-01-22", closing: "2026-02-22", status: "Open" },
];

export type CandidateRow = {
  id: string; branchId: string; name: string; role: string; stage: "Applied" | "Shortlisted" | "Interview" | "Selected" | "Rejected" | "Joined";
  interviewDate: string; rating: number; status: "Active" | "On Hold" | "Closed";
};

export const CANDIDATES: CandidateRow[] = [
  { id: "CAN-01", branchId: BID.MAIN, name: "Nida Kamal", role: "Senior Mathematics Teacher", stage: "Interview", interviewDate: "2026-02-12", rating: 4.5, status: "Active" },
  { id: "CAN-02", branchId: BID.MAIN, name: "Asad Mehmood", role: "Senior Mathematics Teacher", stage: "Shortlisted", interviewDate: "2026-02-14", rating: 4.0, status: "Active" },
  { id: "CAN-03", branchId: BID.MAIN, name: "Rabia Noor", role: "Lab Assistant", stage: "Selected", interviewDate: "2026-02-06", rating: 4.8, status: "Active" },
  { id: "CAN-04", branchId: BID.MAIN, name: "Shoaib Akram", role: "Front Desk Receptionist", stage: "Rejected", interviewDate: "2026-01-10", rating: 2.5, status: "Closed" },
  { id: "CAN-05", branchId: BID.GUL, name: "Sadia Anwar", role: "English Teacher", stage: "Interview", interviewDate: "2026-02-13", rating: 4.2, status: "Active" },
  { id: "CAN-06", branchId: BID.GUL, name: "Hamid Raza", role: "IT Support Officer", stage: "Applied", interviewDate: "—", rating: 0, status: "Active" },
  { id: "CAN-07", branchId: BID.NORTH, name: "Komal Javed", role: "Primary Teacher", stage: "Joined", interviewDate: "2026-01-28", rating: 4.6, status: "Closed" },
  { id: "CAN-08", branchId: BID.DHA, name: "Usman Ghani", role: "Sports Coach", stage: "Shortlisted", interviewDate: "2026-02-18", rating: 4.1, status: "Active" },
  { id: "CAN-09", branchId: BID.DHA, name: "Ayesha Sadiq", role: "Librarian", stage: "Selected", interviewDate: "2026-02-08", rating: 4.7, status: "Active" },
];

/* ----------------------------------------------------------------- Audit Log */
export type AuditRow = {
  id: string; branchId: string; user: string; action: string; module: string; record: string;
  at: string; before: string; after: string;
};

export const AUDIT_LOG: AuditRow[] = [
  { id: "AUD-001", branchId: BID.MAIN, user: "Maria Fernandes", action: "Payment Reversed", module: "Fees", record: "RCP-1006", at: "2026-02-09 10:42", before: "Paid Rs 8,000", after: "Reversed — cheque bounced" },
  { id: "AUD-002", branchId: BID.MAIN, user: "Bilal Raza", action: "Marks Updated", module: "Exams", record: "Grade 10-A / Mathematics", at: "2026-02-08 14:20", before: "Marks: 78", after: "Marks: 82 (correction)" },
  { id: "AUD-003", branchId: BID.MAIN, user: "Amara Reyes", action: "Payroll Approved", module: "Payroll", record: "Payroll 2026-01", at: "2026-02-07 09:05", before: "Draft", after: "Approved" },
  { id: "AUD-004", branchId: BID.MAIN, user: "Hassan Sheikh", action: "Student Edited", module: "Students", record: "STD-1003", at: "2026-02-06 11:15", before: "Contact: 0302-3456789", after: "Contact: 0302-3456790" },
  { id: "AUD-005", branchId: BID.GUL, user: "Hassan Mahmood", action: "Permission Changed", module: "Users", record: "USR-06", at: "2026-02-05 16:40", before: "Branch Admin (Gulshan)", after: "Branch Admin (Gulshan + North)" },
  { id: "AUD-006", branchId: BID.GUL, user: "Sana Iqbal", action: "Result Published", module: "Results", record: "Monthly Test — Feb", at: "2026-02-04 13:10", before: "Marks Entry", after: "Published" },
  { id: "AUD-007", branchId: BID.NORTH, user: "Fatima Siddiqui", action: "Fee Structure Updated", module: "Fees", record: "Grade 6 — Annual Charges", at: "2026-02-03 10:00", before: "Rs 12,000", after: "Rs 13,500" },
  { id: "AUD-008", branchId: BID.DHA, user: "Omar Khalid", action: "Expense Created", module: "Accounting", record: "VCH-3001", at: "2026-02-02 15:30", before: "—", after: "Transport fuel Rs 38,000" },
  { id: "AUD-009", branchId: BID.DHA, user: "Farhan Sheikh", action: "Login", module: "Security", record: "Session", at: "2026-02-09 08:00", before: "—", after: "Signed in from 10.0.0.24" },
];

/* ------------------------------------------------------------------- Tasks */
export type TaskRow = {
  id: string; branchId: string; title: string; owner: string; priority: "High" | "Medium" | "Low";
  status: "Not Started" | "Working on it" | "Stuck" | "Done"; due: string; related: string;
};

export const TASKS: TaskRow[] = [
  { id: "TSK-01", branchId: BID.MAIN, title: "Prepare Mid-Term date sheet", owner: "Academic Coordinator", priority: "High", status: "Working on it", due: "2026-02-12", related: "Exams" },
  { id: "TSK-02", branchId: BID.MAIN, title: "Verify February fee defaulters list", owner: "Maria Fernandes", priority: "Medium", status: "Not Started", due: "2026-02-14", related: "Fees" },
  { id: "TSK-03", branchId: BID.MAIN, title: "Approve January payroll", owner: "Amara Reyes", priority: "High", status: "Done", due: "2026-02-07", related: "Payroll" },
  { id: "TSK-04", branchId: BID.GUL, title: "Order Science lab consumables", owner: "Hina Aslam", priority: "Medium", status: "Working on it", due: "2026-02-16", related: "Inventory" },
  { id: "TSK-05", branchId: BID.GUL, title: "Follow up 4 admission enquiries", owner: "Reception", priority: "High", status: "Not Started", due: "2026-02-11", related: "Admissions" },
  { id: "TSK-06", branchId: BID.NORTH, title: "Schedule PTM room allocation", owner: "Fatima Siddiqui", priority: "Low", status: "Stuck", due: "2026-02-13", related: "Events" },
  { id: "TSK-07", branchId: BID.DHA, title: "Renew bus fitness certificates", owner: "Transport Manager", priority: "High", status: "Working on it", due: "2026-02-20", related: "Transport" },
  { id: "TSK-08", branchId: BID.DHA, title: "Publish Inter-House Cricket draw", owner: "Sports Coach", priority: "Medium", status: "Not Started", due: "2026-02-10", related: "Events" },
];

/* --------------------------------------------------------------- Complaints */
export type TicketRow = {
  id: string; branchId: string; title: string; category: string; priority: "High" | "Medium" | "Low";
  raisedBy: string; assignedTo: string; status: "Open" | "In Progress" | "Resolved" | "Closed"; due: string;
};

export const TICKETS: TicketRow[] = [
  { id: "TKT-01", branchId: BID.MAIN, title: "Classroom AC not working", category: "Maintenance", priority: "High", raisedBy: "Bilal Raza", assignedTo: "Facilities", status: "In Progress", due: "2026-02-11" },
  { id: "TKT-02", branchId: BID.MAIN, title: "Fee receipt not received by parent", category: "Finance", priority: "Medium", raisedBy: "Front Desk", assignedTo: "Maria Fernandes", status: "Resolved", due: "2026-02-09" },
  { id: "TKT-03", branchId: BID.MAIN, title: "Bus route B delayed repeatedly", category: "Transport", priority: "High", raisedBy: "Parent", assignedTo: "Transport Manager", status: "Open", due: "2026-02-12" },
  { id: "TKT-04", branchId: BID.GUL, title: "Library books missing from shelf", category: "Library", priority: "Low", raisedBy: "Librarian", assignedTo: "Library Staff", status: "Closed", due: "2026-02-05" },
  { id: "TKT-05", branchId: BID.GUL, title: "Water cooler leaking", category: "Maintenance", priority: "Medium", raisedBy: "Hina Aslam", assignedTo: "Facilities", status: "In Progress", due: "2026-02-13" },
  { id: "TKT-06", branchId: BID.NORTH, title: "Update school website fee page", category: "IT", priority: "Low", raisedBy: "Admin", assignedTo: "IT Support", status: "Open", due: "2026-02-18" },
  { id: "TKT-07", branchId: BID.DHA, title: "Exam hall seating plan request", category: "Academics", priority: "Medium", raisedBy: "Coordinator", assignedTo: "Admin", status: "In Progress", due: "2026-02-14" },
  { id: "TKT-08", branchId: BID.DHA, title: "Parent complaint: homework load", category: "Academics", priority: "High", raisedBy: "Parent", assignedTo: "Vice Principal", status: "Open", due: "2026-02-10" },
];

/* ---------------------------------------------- Consolidated branch report */
export type BranchPerformanceRow = {
  branchId: string; students: number; attendance: number; feeCollection: number; outstanding: number;
  admissions: number; employees: number; expenses: number; income: number; examAverage: number;
};

export const BRANCH_PERFORMANCE: BranchPerformanceRow[] = BRANCH_DASHBOARD_STATS.map((s, i) => ({
  branchId: s.branchId,
  students: s.students,
  attendance: s.attendance,
  feeCollection: s.feeCollection,
  outstanding: s.outstandingFees,
  admissions: s.admissions,
  employees: s.employees,
  expenses: s.expenses,
  income: s.income,
  examAverage: [83, 81, 79, 86][i] ?? 80,
}));

