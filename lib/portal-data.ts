

import {
  BLOOD_GROUPS, CLASS_NAMES, GENDERS, SESSIONS, STUDENT_ROWS, SUBJECT_ROWS,
  SCHOOL, type StudentRow,
} from "@/lib/mock-data";
import {
  BID, BOOK_ISSUES, CERTIFICATES, EVENTS, EXAMS, EXAM_SCHEDULE, HOMEWORK,
  NOTICES, RESULTS, STUDENT_ATTENDANCE, TIMETABLE_SLOTS, TASKS, type AttendanceStatus,
  type CertificateRow, type EventRow, type ExamRow, type ExamScheduleRow, type HomeworkRow,
  type NoticeRow, type ResultRow, type StudentAttendance, type TimetableSlot,
} from "@/lib/school-mock-data";
import type { AccessModule } from "@/lib/branch-access";

export type PortalStudentProfile = {
  first: string; last: string; gender: string; dob: string; blood: string; photo: string;
  studentId: string; admissionNo: string; admissionDate: string; session: string;
  cls: string; section: string;
  father: string; mother: string; guardian: string; phone: string; email: string; address: string;
  prevSchool: string; medical: string; notes: string;
};
export type PortalTeacherProfile = {
  name: string; gender: string; dob: string; cnic: string; phone: string; email: string;
  address: string; photo: string; employeeId: string; designation: string; department: string;
  joining: string; type: string; status: string;
};
export const PORTAL_STUDENT: PortalStudentProfile = {
  first: "Hamza",
  last: "Khan",
  gender: "Male",
  dob: "2009-03-18",
  blood: "B+",
  photo: "hamza-khan.png",
  studentId: "STD-1001",
  admissionNo: "ADM-2021-0042",
  admissionDate: "2021-04-12",
  session: "2025-2026",
  cls: "Grade 10",
  section: "A",
  father: "Imran Khan",
  mother: "Shazia Khan",
  guardian: "Imran Khan",
  phone: "0300-1234567",
  email: "imran.khan@mail.com",
  address: "12-B Model Town, Lahore",
  prevSchool: "City Model School, Model Town",
  medical: "Mild dust allergy — carries inhaler.",
  notes: "Participates in the Mathematics olympiad.",
};

export const PORTAL_TEACHER: PortalTeacherProfile = {
  name: "Bilal Raza",
  gender: "Male",
  dob: "1988-07-24",
  cnic: "35202-1847265-7",
  phone: "0325-6667778",
  email: "bilal.raza@bisons.edu",
  address: "House 24, Street 7, Johar Town, Lahore",
  photo: "bilal-raza.png",
  employeeId: "EMP-006",
  designation: "Teacher",
  department: "Academics",
  joining: "2020-01-15",
  type: "Permanent",
  status: "Active",
};

export const STUDENT_FULL_NAME = `${PORTAL_STUDENT.first} ${PORTAL_STUDENT.last}`;
export const STUDENT_CAMPUS_ID = BID.MAIN;
export const TEACHER_CAMPUS_ID = BID.MAIN;
const norm = (name: string) => name.trim().toLowerCase();

export const studentDirectoryRow: StudentRow | undefined =
  STUDENT_ROWS.find((r) => r.id === PORTAL_STUDENT.studentId);

const inStudentClass = (cls: string, section?: string) =>
  cls === PORTAL_STUDENT.cls && (section === undefined || section === PORTAL_STUDENT.section);

export const studentAttendance: StudentAttendance[] =
  STUDENT_ATTENDANCE.filter((r) => norm(r.student) === norm(STUDENT_FULL_NAME));

export const studentTimetable: TimetableSlot[] =
  TIMETABLE_SLOTS.filter((s) => inStudentClass(s.cls, s.section));

export const studentHomework: HomeworkRow[] =
  HOMEWORK.filter((r) => inStudentClass(r.cls, r.section));

const studentExamNames = new Set(
  EXAM_SCHEDULE.filter((s) => inStudentClass(s.cls)).map((s) => s.exam),
);
export const studentExams: ExamRow[] =
  EXAMS.filter((e) => e.branchId === STUDENT_CAMPUS_ID && studentExamNames.has(e.name));

export const studentExamSchedule: ExamScheduleRow[] =
  EXAM_SCHEDULE.filter((s) => inStudentClass(s.cls));

export const studentResults: ResultRow[] =
  RESULTS.filter((r) => norm(r.student) === norm(STUDENT_FULL_NAME));

export const studentBookIssues = BOOK_ISSUES.filter((b) => norm(b.member) === norm(STUDENT_FULL_NAME));
export const studentBorrowedTitles = new Set(studentBookIssues.map((b) => b.book));

const isMySlot = (s: TimetableSlot) => norm(s.teacher) === norm(PORTAL_TEACHER.name);

export const teacherClassSections: { cls: string; section: string; label: string }[] = (() => {
  const seen = new Map<string, { cls: string; section: string; label: string }>();
  for (const s of TIMETABLE_SLOTS.filter(isMySlot)) {
    seen.set(`${s.cls}-${s.section}`, { cls: s.cls, section: s.section, label: `${s.cls}-${s.section}` });
  }
  return [...seen.values()];
})();

export const teacherClassSectionLabels = teacherClassSections.map((c) => c.label);
const ownsSection = (cls: string, section?: string) =>
  teacherClassSectionLabels.includes(section === undefined ? cls : `${cls}-${section}`);

export const teacherTimetable: TimetableSlot[] = TIMETABLE_SLOTS.filter(isMySlot);
export const teacherClasses = teacherClassSections.map((c) => {
  const members = STUDENT_ROWS.filter((r) => r.cls === c.cls && r.section === c.section);
  return { ...c, students: members.length, members };
});
export const teacherStudents: StudentRow[] =
  STUDENT_ROWS.filter((r) => ownsSection(r.cls, r.section));
export const teacherAttendanceRegister: StudentAttendance[] =
  STUDENT_ATTENDANCE.filter((r) => ownsSection(r.cls, r.section));
export const teacherHomework: HomeworkRow[] =
  HOMEWORK.filter((r) => norm(r.teacher) === norm(PORTAL_TEACHER.name));
export const teacherExams: ExamRow[] = EXAMS.filter((e) => e.branchId === TEACHER_CAMPUS_ID);
export const teacherExamDuties: ExamScheduleRow[] =
  EXAM_SCHEDULE.filter((s) => ownsSection(s.cls));

export const teacherResults: ResultRow[] = RESULTS.filter((r) => ownsSection(r.cls, r.section));

export const teacherNotices: NoticeRow[] = NOTICES;

export const teacherTasks = TASKS.filter((t) => t.related === "Exams" || t.related === "Academics");

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ["Present", "Absent", "Late", "Leave"];

export function attendanceRate(records: Pick<StudentAttendance, "status">[]): number {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === "Present" || r.status === "Late").length;
  return Math.round((present / records.length) * 100);
}

export function countBy<T, K extends string>(rows: T[], key: (row: T) => K): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const k = key(row);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

export const STUDENT_META = {
  campus: "Main Campus",
  campusCode: "MAIN",
  institute: SCHOOL.name,
  session: PORTAL_STUDENT.session,
  weeklySubjects: [...new Set(studentTimetable.map((s) => s.subject))],
  teachers: [...new Set(studentTimetable.map((s) => s.teacher))],
};

export const TEACHER_META = {
  campus: "Main Campus",
  campusCode: "MAIN",
  institute: SCHOOL.name,
  session: PORTAL_STUDENT.session,
  subjects: [...new Set(teacherTimetable.map((s) => s.subject))],
};

const STUDENT_AUDIENCE = /student|all|grade 1\s*[–-]\s*10/i;
export const studentNotices: NoticeRow[] =
  NOTICES.filter((n) => STUDENT_AUDIENCE.test(n.audience) && n.status !== "Draft");

export const studentEvents: EventRow[] = EVENTS.filter((e) => e.status !== "Completed");

export const studentCertificates: CertificateRow[] =
  CERTIFICATES.filter((c) => norm(c.student) === norm(STUDENT_FULL_NAME));

export const PORTAL_FORM_OPTIONS = {
  classes: CLASS_NAMES,
  sections: ["A", "B", "C", "D"],
  genders: GENDERS,
  bloodGroups: BLOOD_GROUPS,
  sessions: SESSIONS,
  subjects: SUBJECT_ROWS.map((s) => s.name),
};

export const STUDENT_VIEW_MODULES: readonly AccessModule[] = [
  "timetable", "attendance", "exams", "results", "homework", "fees",
  "library", "events", "communication", "meetings", "certificates", "leave",
];

export const TEACHER_VIEW_MODULES: readonly AccessModule[] = [
  "dashboard", "timetable", "attendance", "homework", "exams",
  "results", "communication", "meetings", "tasks", "leave", "payroll",
];
