/* ============================================================================
   BisonsEduCore360 — MEETINGS MODULE DATA (frontend-only)

   Two meeting flows live here:
     • Admin   → Teachers   (staff briefing, department / academic meetings)
     • Teacher → Students   (class session, exam review, parent-teacher)

   Everything is plain, serialisable data so swapping the in-memory store for a
   real API later is a drop-in change (see lib/meetings-store.tsx). There is no
   backend, WebSocket or push notification anywhere in this module.
   ========================================================================== */

import { CLASS_NAMES, EMPLOYEE_ROWS, SCHOOL, SECTIONS, STUDENT_ROWS } from "@/lib/mock-data";

/* ------------------------------------------------------------------- types */

/** Which panel a meeting belongs to — drives per-panel visibility. */
export type MeetingScope = "admin" | "teacher" | "student";
/** Who is invited — Admin meetings go to Teachers, Teacher meetings to Students. */
export type MeetingAudience = "teachers" | "students";
export type MeetingMode = "online" | "physical" | "hybrid";
export type MeetingPlatform = "Zoom" | "Google Meet" | "Microsoft Teams" | "In-person" | "Other";
export type MeetingStatus = "Live" | "Upcoming" | "Today" | "Completed" | "Cancelled";
export type ParticipantKind = "teacher" | "student";

export type MeetingParticipant = {
  id: string;
  name: string;
  kind: ParticipantKind;
  /** Class-section for students, designation/department for teachers. */
  sub: string;
  cls?: string;
  section?: string;
  email?: string;
};

export type MeetingOrganizer = {
  id: string;
  name: string;
  role: string;
};

export type Meeting = {
  id: string;
  title: string;
  agenda: string;
  type: string;
  scope: MeetingScope;
  audience: MeetingAudience;
  organizer: MeetingOrganizer;
  /** ISO calendar date, e.g. "2026-02-08". */
  date: string;
  /** 24h clock, e.g. "09:30". */
  start: string;
  end: string;
  mode: MeetingMode;
  platform: MeetingPlatform;
  /** Video-conference link for online / hybrid meetings. */
  link?: string;
  /** Room / hall for physical / hybrid meetings. */
  room?: string;
  building?: string;
  /** Free-text directions, e.g. "Science Block, 2nd floor". */
  locationNote?: string;
  participants: MeetingParticipant[];
  /** Notify guardians in addition to the listed students. */
  notifyGuardians?: boolean;
  sendReminder?: boolean;
  notes?: string;
  /** Set when a meeting is cancelled (kept so the row still renders). */
  cancelled?: boolean;
  createdAt: string;
};

export type MeetingNotificationKind = "invite" | "reminder" | "update" | "cancelled" | "summary";

export type MeetingNotification = {
  id: string;
  meetingId: string;
  scope: MeetingScope;
  kind: MeetingNotificationKind;
  title: string;
  message: string;
  /** Relative label, e.g. "10 minutes ago". */
  time: string;
  read: boolean;
};

/* --------------------------------------------------------------- constants */

export const MEETING_TYPES = [
  "Staff Briefing",
  "Department Meeting",
  "Academic Review",
  "Parent–Teacher Meeting",
  "Class Session",
  "Exam Review",
  "Training / Workshop",
  "Emergency",
  "Other",
];

export const TEACHER_MEETING_TYPES = [
  "Class Session",
  "Doubt Clearing Session",
  "Exam Review",
  "Parent–Teacher Meeting",
  "Orientation",
  "Other",
];

export const MEETING_PLATFORMS: MeetingPlatform[] = ["Zoom", "Google Meet", "Microsoft Teams", "In-person", "Other"];

export const MEETING_MODES: { key: MeetingMode; label: string; blurb: string }[] = [
  { key: "online", label: "Online", blurb: "Video call — share a join link" },
  { key: "physical", label: "In-person", blurb: "Meet at a room or hall" },
  { key: "hybrid", label: "Hybrid", blurb: "Both a join link and a room" },
];

export const MEETING_DURATIONS = [15, 30, 45, 60, 90, 120];

/** Fallback join links keyed by platform so the demo always has something to copy. */
const SAMPLE_LINKS: Record<string, string> = {
  Zoom: "https://zoom.us/j/98765432101?pwd=bisons",
  "Google Meet": "https://meet.google.com/bnq-xyza-mkt",
  "Microsoft Teams": "https://teams.microsoft.com/l/meetup-join/19:bisons-educore",
  "In-person": "",
  Other: "https://meet.bisonseducore360.edu/room",
};

export const meetingLinkFor = (platform: MeetingPlatform): string => SAMPLE_LINKS[platform] ?? SAMPLE_LINKS.Other;

/* ------------------------------------------------------------- participants */

export const teacherParticipants: MeetingParticipant[] = EMPLOYEE_ROWS.filter(
  (e) => e.department === "Academics" || e.department === "Administration",
).map((e) => ({
  id: e.id,
  name: e.name,
  kind: "teacher" as const,
  sub: `${e.designation} · ${e.department}`,
  email: e.email,
}));

export const studentParticipants: MeetingParticipant[] = STUDENT_ROWS.map((s) => ({
  id: s.id,
  name: s.name,
  kind: "student" as const,
  sub: `${s.cls}-${s.section}`,
  cls: s.cls,
  section: s.section,
}));

/** The signed-in teacher's own sections (mirrors lib/portal-data.ts). */
export const TEACHER_OWN_SECTIONS = ["Grade 10-A", "Grade 9-A", "Grade 8-A"];

export const ownStudentParticipants: MeetingParticipant[] = studentParticipants.filter((p) =>
  TEACHER_OWN_SECTIONS.includes(`${p.cls}-${p.section}`),
);

export const PARTICIPANT_CLASSES = CLASS_NAMES;
export const PARTICIPANT_SECTIONS = SECTIONS;

const DIRECTORY: MeetingParticipant[] = [...teacherParticipants, ...studentParticipants];

export const findParticipant = (id: string): MeetingParticipant | undefined =>
  DIRECTORY.find((p) => p.id === id);

/** Resolve fresh participants from the directory (used by the picker + seeds). */
export const participantsByIds = (ids: readonly string[]): MeetingParticipant[] =>
  ids.map(findParticipant).filter((p): p is MeetingParticipant => Boolean(p));

export const participantLabel = (p: MeetingParticipant) => p.sub;

/* ------------------------------------------------------------------ helpers */

export const MEETING_PERSONA = {
  admin: { id: "EMP-001", name: "Amara Reyes", role: "Principal" },
  teacher: { id: "EMP-006", name: "Bilal Raza", role: "Teacher · Academics" },
  student: { id: "STD-1001", name: "Hamza Khan", role: "Grade 10-A · STD-1001" },
} satisfies Record<MeetingScope, MeetingOrganizer>;

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** A stable "today" for the static demo session (school session 2025-2026). */
export const MEETING_TODAY = "2026-02-08";
/** 09:20 — used to decide which meeting is currently "Live". */
export const MEETING_NOW_MINUTES = 9 * 60 + 20;

export const clockToMinutes = (clock: string): number => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

export const addMinutesToClock = (clock: string, minutes: number): string => {
  const total = clockToMinutes(clock) + minutes;
  return `${pad(Math.floor((total % 1440) / 60))}:${pad(total % 60)}`;
};

/** 24h → "9:30 AM". */
export const formatClock = (clock: string): string => {
  const [h, m] = clock.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
};

export const formatMeetingTime = (m: Pick<Meeting, "start" | "end">) =>
  `${formatClock(m.start)} – ${formatClock(m.end)}`;

/** "2026-02-08" → "Sun, 8 Feb 2026". */
export const formatMeetingDate = (iso: string, opts?: Intl.DateTimeFormatOptions): string => {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-GB", opts ?? {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
};

export const dateDiffInDays = (iso: string, today = MEETING_TODAY): number => {
  const [y1, m1, d1] = iso.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((a - b) / 86_400_000);
};

/** Relative label: Today · Tomorrow · In 3 days · 2 days ago. */
export const relativeDateLabel = (iso: string, today = MEETING_TODAY): string => {
  const diff = dateDiffInDays(iso, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
};

/** Cancelled meetings keep that state; everything else is derived from the date
    + time so the demo never looks stale. */
export function deriveMeetingStatus(
  m: Pick<Meeting, "date" | "start" | "end" | "cancelled">,
  today = MEETING_TODAY,
  nowMinutes = MEETING_NOW_MINUTES,
): MeetingStatus {
  if (m.cancelled) return "Cancelled";
  const diff = dateDiffInDays(m.date, today);
  if (diff < 0) return "Completed";
  if (diff > 0) return "Upcoming";
  if (nowMinutes < clockToMinutes(m.start)) return "Today";
  if (nowMinutes <= clockToMinutes(m.end)) return "Live";
  return "Completed";
}

export const STATUS_TONE: Record<MeetingStatus, string> = {
  Live: "var(--theme-danger)",
  Upcoming: "var(--theme-info)",
  Today: "var(--theme-warning)",
  Completed: "var(--theme-success)",
  Cancelled: "var(--theme-text-muted)",
};

export const MODE_LABEL: Record<MeetingMode, string> = {
  online: "Online",
  physical: "In-person",
  hybrid: "Hybrid",
};

/** Where the meeting happens, in one human-readable line. */
export const meetingVenueLabel = (m: Meeting): string => {
  if (m.mode === "online") return m.platform === "Other" ? "Online meeting" : `Online · ${m.platform}`;
  if (m.mode === "physical") return m.room ? `${m.room}${m.building ? `, ${m.building}` : ""}` : "On campus";
  return `${m.platform} + ${m.room ?? "On campus"}`;
};

export const meetingEndClock = (m: Meeting) => (m.end && m.end !== m.start ? m.end : addMinutesToClock(m.start, 60));

export const isCancelled = (m: Meeting): boolean => m.cancelled === true;

/* ------------------------------------------------------------ seed meetings */

export const seedMeetings: Meeting[] = [
  {
    id: "MTG-1001",
    title: "Weekly Academic Briefing",
    agenda:
      "Weekly review of syllabus coverage, upcoming assessments and the parent–teacher meeting plan. Heads of department present progress against the term calendar.",
    type: "Staff Briefing",
    scope: "admin",
    audience: "teachers",
    organizer: MEETING_PERSONA.admin,
    date: "2026-02-08",
    start: "09:00",
    end: "10:00",
    mode: "online",
    platform: "Zoom",
    link: meetingLinkFor("Zoom"),
    participants: participantsByIds(["EMP-003", "EMP-004", "EMP-005", "EMP-006", "EMP-009", "EMP-012"]),
    notifyGuardians: false,
    sendReminder: true,
    notes: "Bring the weekly coverage sheet for your sections.",
    createdAt: "2026-02-05",
  },
  {
    id: "MTG-1002",
    title: "Grade 9 Mathematics — Exam Review",
    agenda:
      "Walk through the mid-term paper, solve the five most-missed questions and share the revision checklist for the next assessment cycle.",
    type: "Exam Review",
    scope: "teacher",
    audience: "students",
    organizer: MEETING_PERSONA.teacher,
    date: "2026-02-08",
    start: "11:30",
    end: "12:15",
    mode: "online",
    platform: "Google Meet",
    link: meetingLinkFor("Google Meet"),
    participants: participantsByIds(["STD-1002", "STD-1006"]),
    notifyGuardians: false,
    sendReminder: true,
    notes: "Keep the mid-term answer sheet handy.",
    createdAt: "2026-02-06",
  },
  {
    id: "MTG-1003",
    title: "Parent–Teacher Meeting (Grade 10)",
    agenda:
      "Progress review with guardians: attendance, term results and the subject-wise improvement plan for the final term.",
    type: "Parent–Teacher Meeting",
    scope: "teacher",
    audience: "students",
    organizer: MEETING_PERSONA.teacher,
    date: "2026-02-09",
    start: "10:00",
    end: "12:00",
    mode: "physical",
    platform: "In-person",
    room: "Auditorium Hall",
    building: "Main Block",
    locationNote: "Enter from the main gate and register at the front desk.",
    participants: participantsByIds(["STD-1001", "STD-1004"]),
    notifyGuardians: true,
    sendReminder: true,
    notes: "Guardians are invited; report cards will be shared on the day.",
    createdAt: "2026-02-04",
  },
  {
    id: "MTG-1004",
    title: "Science Department Curriculum Sync",
    agenda: "Lab safety refresher, practical schedule for the term and inventory of consumables.",
    type: "Department Meeting",
    scope: "admin",
    audience: "teachers",
    organizer: MEETING_PERSONA.admin,
    date: "2026-02-10",
    start: "14:30",
    end: "15:30",
    mode: "hybrid",
    platform: "Microsoft Teams",
    link: meetingLinkFor("Microsoft Teams"),
    room: "Science Lab 2",
    building: "Science Block",
    participants: participantsByIds(["EMP-003", "EMP-004", "EMP-010"]),
    sendReminder: true,
    createdAt: "2026-02-04",
  },
  {
    id: "MTG-1005",
    title: "Grade 8 Science — Doubt Clearing",
    agenda: "Open floor for questions on the current chapter; short quiz at the end of the session.",
    type: "Doubt Clearing Session",
    scope: "teacher",
    audience: "students",
    organizer: MEETING_PERSONA.teacher,
    date: "2026-02-06",
    start: "13:00",
    end: "13:45",
    mode: "online",
    platform: "Zoom",
    link: meetingLinkFor("Zoom"),
    participants: participantsByIds(["STD-1003", "STD-1009"]),
    sendReminder: false,
    notes: "Recording shared with absentees.",
    createdAt: "2026-02-05",
  },
  {
    id: "MTG-1006",
    title: "Term Result Moderation",
    agenda: "Moderate Grade 10 and Grade 9 results before publishing to the parent portal.",
    type: "Academic Review",
    scope: "admin",
    audience: "teachers",
    organizer: MEETING_PERSONA.admin,
    date: "2026-02-04",
    start: "09:30",
    end: "11:00",
    mode: "physical",
    platform: "In-person",
    room: "Conference Room",
    building: "Admin Block",
    participants: participantsByIds(["EMP-002", "EMP-003", "EMP-005", "EMP-012"]),
    sendReminder: false,
    createdAt: "2026-02-01",
  },
  {
    id: "MTG-1007",
    title: "New Teacher Orientation",
    agenda: "Onboarding walkthrough: attendance workflow, homework module and the BisonsEduCore360 portals.",
    type: "Training / Workshop",
    scope: "admin",
    audience: "teachers",
    organizer: MEETING_PERSONA.admin,
    date: "2026-02-12",
    start: "11:00",
    end: "12:30",
    mode: "hybrid",
    platform: "Google Meet",
    link: meetingLinkFor("Google Meet"),
    room: "Computer Lab 1",
    building: "Main Block",
    participants: participantsByIds(["EMP-009", "EMP-012"]),
    sendReminder: true,
    createdAt: "2026-02-06",
  },
  {
    id: "MTG-1008",
    title: "Emergency Drill Coordination",
    agenda: "Fire drill walkthrough for all class teachers — assembly points and roll-call duties.",
    type: "Emergency",
    scope: "admin",
    audience: "teachers",
    organizer: MEETING_PERSONA.admin,
    date: "2026-02-05",
    start: "08:30",
    end: "09:00",
    mode: "online",
    platform: "Microsoft Teams",
    link: meetingLinkFor("Microsoft Teams"),
    participants: participantsByIds(["EMP-003", "EMP-004", "EMP-005", "EMP-006"]),
    sendReminder: false,
    cancelled: true,
    notes: "Rescheduled to next week after the board inspection.",
    createdAt: "2026-02-03",
  },
  {
    id: "MTG-1009",
    title: "Grade 10 Computer Studies — Lab Session",
    agenda: "Live lab session: build a simple marksheet in a spreadsheet and review the practical checklist.",
    type: "Class Session",
    scope: "teacher",
    audience: "students",
    organizer: MEETING_PERSONA.teacher,
    date: "2026-02-08",
    start: "09:00",
    end: "09:45",
    mode: "online",
    platform: "Google Meet",
    link: meetingLinkFor("Google Meet"),
    participants: participantsByIds(["STD-1001", "STD-1004"]),
    sendReminder: true,
    notes: "Open the spreadsheet shared in the homework module before joining.",
    createdAt: "2026-02-07",
  },
  {
    id: "MTG-1010",
    title: "Grade 10-A Weekly Check-in",
    agenda: "Short weekly catch-up on homework submissions, upcoming tests and any questions from the class.",
    type: "Class Session",
    scope: "teacher",
    audience: "students",
    organizer: MEETING_PERSONA.teacher,
    date: "2026-02-11",
    start: "09:15",
    end: "09:45",
    mode: "hybrid",
    platform: "Zoom",
    link: meetingLinkFor("Zoom"),
    room: "Room 204",
    building: "Main Block",
    participants: participantsByIds(["STD-1001", "STD-1004"]),
    notifyGuardians: false,
    sendReminder: true,
    createdAt: "2026-02-07",
  },
  {
    id: "MTG-1011",
    title: "Grade 10 Mathematics — Revision Class",
    agenda: "Revision of the algebra unit ahead of the class test; past-paper walkthrough.",
    type: "Exam Review",
    scope: "teacher",
    audience: "students",
    organizer: MEETING_PERSONA.teacher,
    date: "2026-02-03",
    start: "12:00",
    end: "12:45",
    mode: "online",
    platform: "Zoom",
    link: meetingLinkFor("Zoom"),
    participants: participantsByIds(["STD-1001", "STD-1004"]),
    sendReminder: false,
    notes: "Recording and revision notes shared with the class.",
    createdAt: "2026-02-01",
  },
];

export const seedMeetingNotifications: MeetingNotification[] = [
  {
    id: "MTN-1", meetingId: "MTG-1001", scope: "teacher", kind: "reminder",
    title: "Meeting starts in 40 minutes",
    message: "Weekly Academic Briefing · 9:00 AM · Zoom",
    time: "20 minutes ago", read: false,
  },
  {
    id: "MTN-2", meetingId: "MTG-1003", scope: "teacher", kind: "invite",
    title: "Parent–Teacher Meeting scheduled",
    message: "Amara Reyes invited you to the Grade 10 Parent–Teacher Meeting.",
    time: "2 hours ago", read: false,
  },
  {
    id: "MTN-3", meetingId: "MTG-1002", scope: "student", kind: "reminder",
    title: "Your class session is today",
    message: "Grade 9 Mathematics — Exam Review · 11:30 AM · Google Meet",
    time: "1 hour ago", read: false,
  },
  {
    id: "MTN-4", meetingId: "MTG-1003", scope: "student", kind: "invite",
    title: "Parent–Teacher Meeting invitation",
    message: "Bilal Raza scheduled a Parent–Teacher Meeting for Grade 10-A.",
    time: "3 hours ago", read: true,
  },
  {
    id: "MTN-5", meetingId: "MTG-1008", scope: "admin", kind: "cancelled",
    title: "Meeting cancelled",
    message: "Emergency Drill Coordination was cancelled — rescheduling next week.",
    time: "Yesterday", read: false,
  },
  {
    id: "MTN-6", meetingId: "MTG-1004", scope: "teacher", kind: "update",
    title: "Venue updated",
    message: "Science Department Curriculum Sync moved to Science Lab 2.",
    time: "Yesterday", read: true,
  },
  {
    id: "MTN-7", meetingId: "MTG-1006", scope: "admin", kind: "summary",
    title: "Meeting summary ready",
    message: "Term Result Moderation — 4 decisions recorded.",
    time: "2 days ago", read: true,
  },
];

export const MEETING_META = {
  institution: SCHOOL.name,
  session: SCHOOL.session,
  campus: "Main Campus",
  campusCode: "MAIN",
  timeZone: "PKT (UTC+05:00)",
};

export const MEETING_KIND_LABEL: Record<MeetingNotificationKind, string> = {
  invite: "Invitation",
  reminder: "Reminder",
  update: "Update",
  cancelled: "Cancelled",
  summary: "Summary",
};

/** Panel copy: title, blurb and the "organiser → audience" wording per scope. */
export const MEETING_SCOPE_META: Record<MeetingScope, {
  title: string;
  subtitle: string;
  audienceLabel: string;
  organiser: string;
  counterpartLabel: string;
}> = {
  admin: {
    title: "Meetings",
    subtitle: "Schedule and track meetings with your teaching staff",
    audienceLabel: "Teachers",
    organiser: "Admin",
    counterpartLabel: "Teaching staff",
  },
  teacher: {
    title: "My Meetings",
    subtitle: "Meet your students and coordinate with staff",
    audienceLabel: "Students",
    organiser: "Teacher",
    counterpartLabel: "Students",
  },
  student: {
    title: "My Meetings",
    subtitle: "Class sessions, reviews and school meetings you are invited to",
    audienceLabel: "Students",
    organiser: "Teacher",
    counterpartLabel: "Your classes",
  },
};
