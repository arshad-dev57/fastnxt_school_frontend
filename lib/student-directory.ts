import type { StudentItem } from "@/lib/auth/api-client";

export const ADMISSION_TRACKS = ["Law", "IT", "Nursing"] as const;

/** Law, IT, or Nursing for a student. Older "general" admissions count as Law. */
export function studentTrack(student: Pick<StudentItem, "course" | "admissionExtras">): "" | "law" | "it" | "nursing" {
  const raw = String(student.admissionExtras?.category || "").toLowerCase();
  if (raw === "law" || raw === "general") return "law";
  if (raw === "it" || raw === "nursing") return raw;
  const course = String(student.course || "").toLowerCase();
  if (course.includes("llb") || course.includes("law")) return "law";
  if (course.includes("nursing") || course.includes("b category")) return "nursing";
  return "";
}

export function studentTrackLabel(student: Pick<StudentItem, "course" | "admissionExtras">): string {
  const track = studentTrack(student);
  if (track === "law") return "Law";
  if (track === "it") return "IT";
  if (track === "nursing") return "Nursing";
  return "";
}

export function studentProgram(student: Pick<StudentItem, "course" | "admissionExtras">): string {
  const extras = student.admissionExtras;
  return extras?.lawProgram || extras?.nursingProgram || student.course || "";
}

export function studentSearchText(student: StudentItem): string {
  const extras = student.admissionExtras;
  return [
    student.name,
    student.studentId,
    student.admissionNo,
    student.guardian,
    student.father,
    student.mother,
    student.phone,
    student.email,
    student.cls,
    student.section,
    student.course,
    studentTrackLabel(student),
    extras?.lawProgram,
    extras?.lawDuration,
    extras?.nursingProgram,
    extras?.nursingDuration,
    extras?.latRollNo,
    extras?.cnic,
    ...(extras?.programs || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesStudentSearch(student: StudentItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return studentSearchText(student).includes(needle);
}

export function courseNamesFrom(students: { course?: string | null }[]): string[] {
  return Array.from(new Set(students.map((s) => s.course).filter((name): name is string => Boolean(name)))).sort();
}
