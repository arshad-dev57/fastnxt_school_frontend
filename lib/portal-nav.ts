
import {
  Award, BookOpen, CalendarCheck, CalendarClock, CalendarDays, CalendarOff, GraduationCap, LayoutDashboard,
  ListChecks, Megaphone, NotebookPen, School, ScrollText, ShieldCheck, User, UserCog, Video, Wallet, type LucideIcon,
} from "lucide-react";
import type { AccessModule } from "@/lib/branch-access";
import { STUDENT_VIEW_MODULES, TEACHER_VIEW_MODULES } from "@/lib/portal-data";

export type PortalNavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  module: AccessModule;
  blurb: string;
};

export type PortalConfig = {
  portalName: string;
  base: string;
  BrandIcon: LucideIcon;
  userName: string;
  userSub: string;
  userHref: string;
  bottom: PortalNavItem[];
  items: PortalNavItem[];
};

/* --------------------------------------------------------------- student -- */
export const STUDENT_NAV: PortalNavItem[] = [
  { label: "My Dashboard", href: "/student", Icon: LayoutDashboard, module: "dashboard", blurb: "Attendance, results, fees and today's classes at a glance" },
  { label: "My Timetable", href: "/student/timetable", Icon: CalendarClock, module: "timetable", blurb: "Weekly period-wise class schedule" },
  { label: "My Attendance", href: "/student/attendance", Icon: CalendarCheck, module: "attendance", blurb: "Daily register with present, absent, late and leave" },
  { label: "Leave", href: "/student/leave", Icon: CalendarOff, module: "leave", blurb: "Apply for leave — class teacher and admin both review" },
  { label: "My Homework", href: "/student/homework", Icon: NotebookPen, module: "homework", blurb: "Assignments, due dates and submission progress" },
  { label: "Examinations", href: "/student/exams", Icon: GraduationCap, module: "exams", blurb: "Exam schedule and the class date sheet" },
  { label: "My Meetings", href: "/student/meetings", Icon: Video, module: "meetings", blurb: "Class sessions, doubt clearing and reviews you are invited to" },
  { label: "My Results", href: "/student/results", Icon: Award, module: "results", blurb: "Published marks, grades and class position" },
  { label: "Library", href: "/student/library", Icon: BookOpen, module: "library", blurb: "Borrowed books, due dates and fines" },
  { label: "Notices", href: "/student/notices", Icon: Megaphone, module: "communication", blurb: "Circulars and announcements for students" },
  { label: "Events", href: "/student/events", Icon: CalendarDays, module: "events", blurb: "Sports day, exhibitions and school calendar" },
  { label: "Rules", href: "/student/rules", Icon: ScrollText, module: "settings", blurb: "School rules and regulations for students" },
  { label: "Certificates", href: "/student/certificates", Icon: ShieldCheck, module: "certificates", blurb: "Bonafide, transfer and character certificates" },
  { label: "My Profile", href: "/student/profile", Icon: User, module: "settings", blurb: "Personal, academic and guardian details" },
];

/* --------------------------------------------------------------- teacher -- */
export const TEACHER_NAV: PortalNavItem[] = [
  { label: "Dashboard", href: "/teacher", Icon: LayoutDashboard, module: "dashboard", blurb: "Today's periods, attendance and grading queue" },
  { label: "My Classes", href: "/teacher/classes", Icon: School, module: "classes", blurb: "Sections you teach and their roster size" },
  { label: "My Students", href: "/teacher/students", Icon: User, module: "students", blurb: "Students in your own sections only" },
  { label: "Mark Attendance", href: "/teacher/attendance", Icon: CalendarCheck, module: "attendance", blurb: "Mark present, absent, late or leave per section" },
  { label: "Leave", href: "/teacher/leave", Icon: CalendarOff, module: "leave", blurb: "Apply your leave (admin) and review class student requests" },
  { label: "My Salary", href: "/teacher/salary", Icon: Wallet, module: "payroll", blurb: "Month-wise salary, payslips and paid status" },
  { label: "My Timetable", href: "/teacher/timetable", Icon: CalendarClock, module: "timetable", blurb: "Your weekly teaching schedule" },
  { label: "Homework", href: "/teacher/homework", Icon: NotebookPen, module: "homework", blurb: "Create assignments and track submissions" },
  { label: "Exams & Results", href: "/teacher/exams", Icon: GraduationCap, module: "exams", blurb: "Exam status, date sheet and marks entry" },
  { label: "My Meetings", href: "/teacher/meetings", Icon: Video, module: "meetings", blurb: "Meet your students — class sessions, reviews and PTMs" },
  { label: "Notices", href: "/teacher/notices", Icon: Megaphone, module: "communication", blurb: "Publish circulars to students and parents" },
  { label: "Rules", href: "/teacher/rules", Icon: ScrollText, module: "settings", blurb: "School rules and regulations for teachers" },
  { label: "My Tasks", href: "/teacher/tasks", Icon: ListChecks, module: "tasks", blurb: "Academic work items assigned to you" },
  { label: "My Profile", href: "/teacher/profile", Icon: UserCog, module: "settings", blurb: "Employment and contact details" },
];

/** Keeps a portal honest: drop any item whose module the role cannot view. */
export function visibleNav(items: PortalNavItem[], allowed: readonly AccessModule[]): PortalNavItem[] {
  // "dashboard" and "settings" are portal entry points rather than Admin modules,
  // so they stay available; everything else must be granted to the role.
  const always = new Set<AccessModule>(["dashboard", "settings"]);
  return items.filter((i) => always.has(i.module) || allowed.includes(i.module));
}

/** Pick the phone bottom-nav tabs by href so the selection survives re-ordering. */
const pickNav = (items: PortalNavItem[], hrefs: string[]) =>
  hrefs
    .map((h) => items.find((i) => i.href === h))
    .filter((i): i is PortalNavItem => Boolean(i));

export const STUDENT_PORTAL: PortalConfig = {
  portalName: "Student Portal",
  base: "/student",
  BrandIcon: User,
  userName: "Hamza Khan",
  userSub: "Grade 10-A · STD-1001",
  userHref: "/student/profile",
  bottom: pickNav(STUDENT_NAV, ["/student", "/student/timetable", "/student/attendance", "/student/homework", "/student/exams"]),
  items: STUDENT_NAV,
};

export const TEACHER_PORTAL: PortalConfig = {
  portalName: "Teacher Portal",
  base: "/teacher",
  BrandIcon: GraduationCap,
  userName: "Bilal Raza",
  userSub: "Teacher · Academics",
  userHref: "/teacher/profile",
  bottom: pickNav(TEACHER_NAV, ["/teacher", "/teacher/classes", "/teacher/students", "/teacher/attendance", "/teacher/exams"]),
  items: TEACHER_NAV,
};

export const studentNav = visibleNav(STUDENT_NAV, STUDENT_VIEW_MODULES);
export const teacherNav = visibleNav(TEACHER_NAV, TEACHER_VIEW_MODULES);
