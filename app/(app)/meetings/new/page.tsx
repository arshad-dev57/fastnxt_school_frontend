"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Info, Link2,
  ListChecks, MapPin, Radio, Sparkles, Users, Video, X, GraduationCap,
  Briefcase, Search, UserCheck, CheckSquare, Square, Filter
} from "lucide-react";
import { Avatar, Btn, Card, cn, Field, Input, Select, Textarea, PageHeader } from "@/components/ui";
import { SuccessIcon } from "@/components/icons";
import { useBranch } from "@/lib/branch-context";
import { useAuth } from "@/lib/auth/auth-context";
import {
  meetingsApi,
  classesApi,
  studentsApi,
  employeesApi,
  type ClassItem,
  type StudentItem,
  type EmployeeItem,
} from "@/lib/auth/api-client";
import { useMeetings } from "@/lib/meetings-store";
import {
  MEETING_DURATIONS, MEETING_MODES, MEETING_PLATFORMS, MEETING_TYPES,
  addMinutesToClock, formatClock, formatMeetingDate,
  type MeetingMode, type MeetingPlatform,
} from "@/lib/meetings-data";

/* ── Step definitions ────────────────────────────────────────────────────── */

const STEPS = [
  { key: "details", label: "Details", Icon: ListChecks },
  { key: "when", label: "Date & Time", Icon: CalendarDays },
  { key: "type", label: "Type", Icon: Sparkles },
  { key: "where", label: "Where", Icon: MapPin },
  { key: "people", label: "Participants Flow", Icon: Users },
  { key: "review", label: "Review", Icon: Check },
];

const STEP_HELP: Record<string, string> = {
  details: "Name the meeting and describe what will be covered.",
  when: "Pick the date, start time and how long the meeting should run.",
  type: "Choose the category so it is easy to find later.",
  where: "Decide whether you meet online, in person, or both.",
  people: "Choose participants from Students (all or class/grade wise) and Staff/Teachers.",
  review: "Check everything before the meeting is scheduled.",
};

const SLOTS = (() => {
  const out: string[] = [];
  for (let m = 7 * 60; m <= 21 * 60; m += 30)
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
})();

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Draft = {
  title: string;
  agenda: string;
  notes: string;
  date: string;
  start: string;
  duration: number;
  type: string;
  mode: MeetingMode;
  platform: MeetingPlatform;
  link: string;
  room: string;
  building: string;
  locationNote: string;
  organizer: string;
  status: string;
  sendReminder: boolean;
  notifyGuardians: boolean;
  // Participants selection state
  allStudents: boolean;
  selectedClasses: string[]; // class names / IDs
  selectedStudentIds: string[]; // student IDs
  allStaff: boolean;
  selectedDepartments: string[]; // dept names
  selectedEmployeeIds: string[]; // employee IDs
  customParticipantsText: string; // fallback text inputs
};

const emptyDraft: Draft = {
  title: "",
  agenda: "",
  notes: "",
  date: todayISO(),
  start: "09:00",
  duration: 45,
  type: "Staff Briefing",
  mode: "online",
  platform: "Zoom",
  link: "",
  room: "",
  building: "",
  locationNote: "",
  organizer: "",
  status: "Scheduled",
  sendReminder: true,
  notifyGuardians: false,
  allStudents: false,
  selectedClasses: [],
  selectedStudentIds: [],
  allStaff: false,
  selectedDepartments: [],
  selectedEmployeeIds: [],
  customParticipantsText: "",
};

export default function ScheduleMeetingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams ? searchParams.get("id") : null;
  const { currentBranchId } = useBranch();
  const { user } = useAuth();
  const { refreshMeetings } = useMeetings();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [created, setCreated] = useState<{ id: string; title: string; isEdit?: boolean } | null>(null);

  // Auto-default organizer to logged in user or Admin
  useEffect(() => {
    if (!draft.organizer) {
      const defaultOrg = user?.name ? `${user.name}` : "Admin";
      setDraft((prev) => (prev.organizer ? prev : { ...prev, organizer: defaultOrg }));
    }
  }, [user]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [studentsList, setStudentsList] = useState<StudentItem[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [participantTab, setParticipantTab] = useState<"students" | "staff">("students");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
  useEffect(() => {
    let isMounted = true;
    async function loadParticipantData() {
      try {
        setDataLoading(true);
        const [clsRes, stdRes, empRes] = await Promise.all([
          classesApi.list({ branchId: branchScope }).catch(() => ({ classes: [] })),
          studentsApi.list({ branchId: branchScope }).catch(() => ({ students: [] })),
          employeesApi.list({ branchId: branchScope }).catch(() => ({ employees: [] })),
        ]);
        if (isMounted) {
          setClassesList(clsRes.classes || []);
          setStudentsList(stdRes.students || []);
          setEmployeesList(empRes.employees || []);
        }
      } catch (err) {
        console.error("Failed to load participant selection options", err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }
    loadParticipantData();
    return () => {
      isMounted = false;
    };
  }, [branchScope]);

  // Load meeting if editing
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    async function loadMeeting() {
      try {
        setLoadingEdit(true);
        const res = await meetingsApi.get(editId!);
        if (res.meeting && isMounted) {
          const m = res.meeting;
          setDraft((prev) => ({
            ...prev,
            title: m.title || "",
            agenda: m.description || "",
            date: m.date || todayISO(),
            start: m.time || "09:00",
            venue: m.venue || "",
            organizer: m.organizer || "Admin",
            status: m.status || "Scheduled",
            customParticipantsText: Array.isArray(m.participants) ? m.participants.join(", ") : "",
          }));
        }
      } catch (err) {
        setError("Failed to load meeting details for editing.");
      } finally {
        if (isMounted) setLoadingEdit(false);
      }
    }
    loadMeeting();
    return () => {
      isMounted = false;
    };
  }, [editId]);

  const end = addMinutesToClock(draft.start, draft.duration);

  // Compile final array of participant badges / label strings for submission
  const computedParticipantsList = useMemo(() => {
    const list: string[] = [];

    if (draft.allStudents) {
      list.push("All Students");
    } else if (draft.selectedClasses.length > 0) {
      draft.selectedClasses.forEach((clsName) => list.push(`Class: ${clsName}`));
    }

    if (draft.selectedStudentIds.length > 0) {
      draft.selectedStudentIds.forEach((id) => {
        const std = studentsList.find((s) => s.id === id);
        if (std) list.push(`Student: ${std.name} (${std.cls || ""}-${std.section || ""})`);
      });
    }

    if (draft.allStaff) {
      list.push("All Staff & Teachers");
    } else if (draft.selectedDepartments.length > 0) {
      draft.selectedDepartments.forEach((dept) => list.push(`Dept: ${dept}`));
    }

    if (draft.selectedEmployeeIds.length > 0) {
      draft.selectedEmployeeIds.forEach((id) => {
        const emp = employeesList.find((e) => e.id === id);
        if (emp) list.push(`Staff: ${emp.name} (${emp.designation || emp.department || "Staff"})`);
      });
    }

    if (draft.customParticipantsText.trim()) {
      draft.customParticipantsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((p) => {
          if (!list.includes(p)) list.push(p);
        });
    }

    return list;
  }, [
    draft.allStudents,
    draft.selectedClasses,
    draft.selectedStudentIds,
    draft.allStaff,
    draft.selectedDepartments,
    draft.selectedEmployeeIds,
    draft.customParticipantsText,
    studentsList,
    employeesList,
  ]);

  const organizerOptions = useMemo(() => {
    const set = new Set<string>();
    if (user?.name) set.add(user.name);
    set.add("Admin");
    set.add("Principal");
    set.add("Vice Principal");
    set.add("Academic Coordinator");
    set.add("Head of Department (HOD)");
    employeesList.forEach((e) => {
      if (e.name) set.add(e.name);
    });
    return Array.from(set);
  }, [user, employeesList]);

  const validate = (index: number): string | null => {
    if (index === 0) {
      if (!draft.title.trim()) return "Give the meeting a clear title.";
      if (!draft.agenda.trim()) return "Add a short agenda so invitees know what to expect.";
    }
    if (index === 1 && !draft.date) return "Pick a date for the meeting.";
    if (index === 2 && !draft.type) return "Choose a meeting type.";
    if (index === 3) {
      if (draft.mode !== "physical" && !draft.link.trim()) return "Add a join link for online attendees.";
      if (draft.mode !== "online" && !draft.room.trim()) return "Add the room or hall for in-person attendees.";
    }
    if (index === 4) {
      if (computedParticipantsList.length === 0) {
        return "Select at least one participant group (All Students, Class-wise, Staff, or individual).";
      }
    }
    return null;
  };

  const goNext = () => {
    const problem = validate(step);
    if (problem) { setError(problem); return; }
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => { setError(null); setStep((s) => Math.max(0, s - 1)); };

  const handleSubmit = async () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const problem = validate(i);
      if (problem) { setError(problem); setStep(i); return; }
    }
    setSubmitting(true);
    setError(null);
    try {
      const venueStr = draft.mode === "online"
        ? `${draft.platform} · ${draft.link}`
        : draft.room + (draft.building ? `, ${draft.building}` : "");

      const payload = {
        title: draft.title.trim(),
        date: draft.date,
        time: draft.start,
        venue: venueStr,
        organizer: draft.organizer.trim() || "Admin",
        status: draft.status || "Scheduled",
        description: draft.agenda.trim() + (draft.notes ? `\n\nNotes: ${draft.notes.trim()}` : ""),
        participants: computedParticipantsList,
        branchId: branchScope,
      };

      let res;
      if (editId) {
        res = await meetingsApi.update(editId, payload);
      } else {
        res = await meetingsApi.create(payload);
      }

      if (refreshMeetings) {
        await refreshMeetings();
      }

      setCreated({ id: res.meeting.id, title: res.meeting.title, isEdit: !!editId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[14px] text-[var(--theme-text-muted)]">Loading meeting details...</p>
      </div>
    );
  }

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (created) {
    return (
      <div className="px-4 pb-24 pt-4 sm:px-6">
        <Card className="mx-auto max-w-2xl text-center">
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]">
              <SuccessIcon size={36} />
            </span>
            <h2 className="text-[22px] font-semibold">
              {created.isEdit ? "Meeting Updated Successfully!" : "Meeting Scheduled Successfully!"}
            </h2>
            <p className="max-w-md text-[14px] text-[var(--theme-text-muted)]">
              "{created.title}" has been saved and participants will be notified.
            </p>
            <p className="rounded-md bg-[var(--theme-subtle)] px-3 py-1 font-mono text-[13px]">
              Meeting ID · {created.id}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/meetings"
                className="inline-flex h-10 items-center gap-2 rounded bg-[var(--theme-primary)] px-4 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
              >
                <CalendarDays className="h-[18px] w-[18px]" /> View All Meetings
              </Link>
              <Btn
                variant="secondary"
                Icon={ArrowLeft}
                onClick={() => {
                  setCreated(null);
                  setDraft(emptyDraft);
                  setStep(0);
                  if (editId) router.push("/meetings/new");
                }}
              >
                Schedule Another
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const canAdvance = validate(step) === null;

  return (
    <>
      <PageHeader
        title={editId ? "Edit Meeting" : "Schedule Meeting"}
        subtitle={editId ? "Update meeting details and participant selection." : "Set up a new meeting — step by step."}
        actions={
          <Link
            href="/meetings"
            className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 text-[14px] hover:bg-[var(--theme-hover)]"
          >
            <ArrowLeft className="h-[16px] w-[16px]" /> Back to Meetings
          </Link>
        }
      />

      <div className="px-4 pb-28 pt-2 sm:px-6">
        {/* Step progress bar */}
        <div className="mx-auto max-w-4xl">
          <ol className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((s, i) => {
              const state = i < step ? "done" : i === step ? "current" : "todo";
              return (
                <li key={s.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => { if (i < step) { setError(null); setStep(i); } }}
                    disabled={i > step}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                      state === "current" && "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white",
                      state === "done" && "border-[var(--theme-success)] bg-[var(--theme-success-soft)] text-[var(--theme-success-text)] hover:brightness-95 cursor-pointer",
                      state === "todo" && "border-[var(--theme-border)] text-[var(--theme-text-faint)] cursor-not-allowed"
                    )}
                  >
                    {state === "done" ? <Check className="h-3.5 w-3.5" /> : <s.Icon className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{i + 1}. {s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--theme-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--theme-primary)] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step card */}
        <div className="mx-auto mt-4 max-w-4xl">
          <Card pad={false}>
            <div className="border-b border-[var(--theme-border)] px-5 py-4">
              <h2 className="text-[18px] font-semibold">{STEPS[step].label}</h2>
              <p className="mt-0.5 text-[13px] text-[var(--theme-text-muted)]">{STEP_HELP[STEPS[step].key]}</p>
            </div>

            <div className="space-y-5 p-5">
              {/* Step 1: Details */}
              {STEPS[step].key === "details" && (
                <>
                  <Field label="Meeting Title *">
                    <Input
                      value={draft.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g. Weekly Academic Briefing"
                    />
                  </Field>
                  <Field label="Organizer / Chairperson" hint="Who is arranging or chairing this meeting?">
                    <Select
                      options={organizerOptions}
                      value={draft.organizer || user?.name || "Admin"}
                      onChange={(e) => set("organizer", e.target.value)}
                    />
                  </Field>
                  <Field label="Agenda *" hint="What will be covered? Invitees see this.">
                    <Textarea
                      value={draft.agenda}
                      onChange={(e) => set("agenda", e.target.value)}
                      placeholder="List the points to be discussed…"
                      rows={4}
                    />
                  </Field>
                  <Field label="Internal Notes (optional)" hint="Only visible to the organiser.">
                    <Textarea
                      value={draft.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="Preparation notes, action items, reminders…"
                      rows={3}
                    />
                  </Field>
                </>
              )}
              {STEPS[step].key === "when" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date *">
                      <Input
                        type="date"
                        value={draft.date}
                        onChange={(e) => set("date", e.target.value)}
                      />
                    </Field>
                    <Field label="Start Time">
                      <div className="relative">
                        <select
                          value={draft.start}
                          onChange={(e) => set("start", e.target.value)}
                          className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]"
                        >
                          {SLOTS.map((s) => <option key={s} value={s}>{formatClock(s)}</option>)}
                        </select>
                        <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                      </div>
                    </Field>
                  </div>
                  <Field label="Duration">
                    <div className="flex flex-wrap gap-2">
                      {MEETING_DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => set("duration", d)}
                          className={cn(
                            "h-9 rounded border px-4 text-[13px] font-medium transition-colors",
                            draft.duration === d
                              ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                              : "border-[var(--theme-border-strong)] hover:bg-[var(--theme-hover)]"
                          )}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="flex items-center gap-2 rounded-lg bg-[var(--theme-info-soft)] px-4 py-3 text-[13px] text-[var(--theme-text)]">
                    <Clock className="h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
                    <span>
                      <span className="font-medium">{draft.date ? formatMeetingDate(draft.date) : "—"}</span>
                      {" · "}{formatClock(draft.start)} – {formatClock(end)} · PKT (UTC+05:00)
                    </span>
                  </div>
                </>
              )}

              {/* Step 3: Type */}
              {STEPS[step].key === "type" && (
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {MEETING_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("type", t)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-all",
                        draft.type === t
                          ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)] font-semibold text-[var(--theme-primary-hover)] shadow-sm"
                          : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
                      )}
                    >
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        draft.type === t ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white" : "border-[var(--theme-border-strong)]"
                      )}>
                        {draft.type === t && <Check className="h-3 w-3" />}
                      </span>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Where */}
              {STEPS[step].key === "where" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {MEETING_MODES.map((m) => {
                      const Icon = m.key === "online" ? Video : m.key === "physical" ? MapPin : Radio;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => set("mode", m.key)}
                          className={cn(
                            "flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all",
                            draft.mode === m.key
                              ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)] shadow-sm"
                              : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
                          )}
                        >
                          <span className="flex items-center gap-2 text-[15px] font-semibold">
                            <Icon className="h-4 w-4" /> {m.label}
                          </span>
                          <span className="text-[12px] text-[var(--theme-text-muted)]">{m.blurb}</span>
                        </button>
                      );
                    })}
                  </div>

                  {draft.mode !== "physical" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Platform">
                        <div className="relative">
                          <select
                            value={draft.platform}
                            onChange={(e) => set("platform", e.target.value as MeetingPlatform)}
                            className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]"
                          >
                            {MEETING_PLATFORMS.filter((p) => p !== "In-person").map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <Link2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                        </div>
                      </Field>
                      <Field label="Join Link *" hint="Invitees can copy it from meeting details.">
                        <Input
                          value={draft.link}
                          onChange={(e) => set("link", e.target.value)}
                          placeholder="https://zoom.us/j/..."
                        />
                      </Field>
                    </div>
                  )}

                  {draft.mode !== "online" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Room / Hall *">
                        <Input
                          value={draft.room}
                          onChange={(e) => set("room", e.target.value)}
                          placeholder="e.g. Auditorium Hall, Conference Room"
                        />
                      </Field>
                      <Field label="Building (optional)">
                        <Input
                          value={draft.building}
                          onChange={(e) => set("building", e.target.value)}
                          placeholder="e.g. Main Block, Admin Block"
                        />
                      </Field>
                      <Field label="Directions / Location Note (optional)" className="sm:col-span-2">
                        <Input
                          value={draft.locationNote}
                          onChange={(e) => set("locationNote", e.target.value)}
                          placeholder="e.g. Enter from the main gate and register at the front desk."
                        />
                      </Field>
                    </div>
                  )}
                </>
              )}

              {/* Step 5: Rich Participants Flow */}
              {STEPS[step].key === "people" && (
                <ParticipantsFlowPicker
                  draft={draft}
                  setDraft={setDraft}
                  classesList={classesList}
                  studentsList={studentsList}
                  employeesList={employeesList}
                  dataLoading={dataLoading}
                  participantTab={participantTab}
                  setParticipantTab={setParticipantTab}
                  computedParticipantsList={computedParticipantsList}
                />
              )}

              {/* Step 6: Review */}
              {STEPS[step].key === "review" && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--theme-border)] p-4">
                    <div>
                      <h3 className="text-[18px] font-semibold">{draft.title || "Untitled Meeting"}</h3>
                      <p className="mt-0.5 text-[14px] text-[var(--theme-text-muted)]">
                        {draft.type} · Organizer: {draft.organizer || "Admin"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--theme-info)] bg-[var(--theme-info-soft)] px-3 py-1 text-[13px] font-medium text-[var(--theme-primary)]">
                      {draft.status || "Scheduled"}
                    </span>
                  </div>

                  {/* Agenda */}
                  <div className="rounded-xl bg-[var(--theme-subtle)] p-4">
                    <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Agenda</p>
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--theme-text-muted)]">
                      {draft.agenda || "No agenda added yet."}
                    </p>
                  </div>

                  {/* Date & time */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] p-3">
                      <CalendarDays className="h-5 w-5 shrink-0 text-[var(--theme-primary)]" />
                      <div>
                        <p className="text-[12px] text-[var(--theme-text-faint)]">Date &amp; Time</p>
                        <p className="text-[14px] font-medium">
                          {draft.date ? formatMeetingDate(draft.date) : "—"}
                        </p>
                        <p className="text-[13px] text-[var(--theme-text-muted)]">
                          {formatClock(draft.start)} – {formatClock(end)} · {draft.duration} min
                        </p>
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] p-3">
                      {draft.mode === "online" ? (
                        <Video className="h-5 w-5 shrink-0 text-[var(--theme-primary)]" />
                      ) : draft.mode === "physical" ? (
                        <MapPin className="h-5 w-5 shrink-0 text-[var(--theme-primary)]" />
                      ) : (
                        <Radio className="h-5 w-5 shrink-0 text-[var(--theme-primary)]" />
                      )}
                      <div>
                        <p className="text-[12px] text-[var(--theme-text-faint)]">Location / Platform</p>
                        {draft.mode !== "physical" && (
                          <p className="text-[14px] font-medium">{draft.platform}</p>
                        )}
                        {draft.mode !== "online" && (
                          <p className="text-[14px] font-medium">{draft.room || "—"}{draft.building ? `, ${draft.building}` : ""}</p>
                        )}
                        {draft.mode !== "physical" && draft.link && (
                          <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{draft.link}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Participants breakdown */}
                  <div className="rounded-xl border border-[var(--theme-border)] p-4">
                    <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
                      <Users className="h-4 w-4" />
                      {computedParticipantsList.length} participant item{computedParticipantsList.length !== 1 ? "s" : ""} selected
                    </p>
                    {computedParticipantsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {computedParticipantsList.map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-subtle)] px-3 py-1 text-[13px] font-medium">
                            <Avatar name={p} size={20} />
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-[var(--theme-text-muted)]">No participants selected — go back to select attendees.</p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid gap-2 text-[13px] sm:grid-cols-2">
                    <p className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 py-2">
                      {draft.sendReminder ? <Check className="h-4 w-4 text-[var(--theme-success)]" /> : <Info className="h-4 w-4 text-[var(--theme-text-faint)]" />}
                      Reminder {draft.sendReminder ? "enabled" : "disabled"}
                    </p>
                    <p className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 py-2">
                      {draft.notifyGuardians ? <Check className="h-4 w-4 text-[var(--theme-success)]" /> : <Info className="h-4 w-4 text-[var(--theme-text-faint)]" />}
                      Guardians {draft.notifyGuardians ? "notified" : "not notified"}
                    </p>
                  </div>

                  {/* Notes */}
                  {draft.notes && (
                    <div className="rounded-xl border border-[var(--theme-border)] p-3 text-[13px] text-[var(--theme-text-muted)]">
                      <span className="font-semibold text-[var(--theme-text)]">Internal note · </span>
                      {draft.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] px-5 py-4">
              <Btn variant="ghost" Icon={ArrowLeft} onClick={goBack} disabled={step === 0}>
                Back
              </Btn>
              {step < STEPS.length - 1 ? (
                <Btn variant="primary" IconRight={ArrowRight} onClick={goNext} disabled={!canAdvance}>
                  Continue
                </Btn>
              ) : (
                <Btn
                  variant="primary"
                  Icon={Check}
                  onClick={handleSubmit}
                  disabled={submitting}
                  loading={submitting}
                  loadingLabel={editId ? "Updating…" : "Scheduling…"}
                >
                  {editId ? "Update Meeting" : "Schedule Meeting"}
                </Btn>
              )}
            </div>
          </Card>

          {/* Error message */}
          {error && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--theme-danger-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--theme-danger-text)]">
              <Info className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Rich Participant Selection Flow Component ────────────────────────────── */

function ParticipantsFlowPicker({
  draft,
  setDraft,
  classesList,
  studentsList,
  employeesList,
  dataLoading,
  participantTab,
  setParticipantTab,
  computedParticipantsList,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  classesList: ClassItem[];
  studentsList: StudentItem[];
  employeesList: EmployeeItem[];
  dataLoading: boolean;
  participantTab: "students" | "staff";
  setParticipantTab: (tab: "students" | "staff") => void;
  computedParticipantsList: string[];
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffDeptFilter, setStaffDeptFilter] = useState("");
  const availableDepts = useMemo(() => {
    const set = new Set<string>();
    employeesList.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    if (set.size === 0) {
      ["Academics", "Administration", "Accounts", "IT Support", "Sports & Co-Curricular"].forEach((d) => set.add(d));
    }
    return Array.from(set);
  }, [employeesList]);
  const availableClasses = useMemo(() => {
    if (classesList.length > 0) {
      return classesList.map((c) => c.name);
    }
    return ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9-A", "Grade 10-A"];
  }, [classesList]);
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      if (studentClassFilter && s.cls !== studentClassFilter && !`${s.cls}-${s.section}`.includes(studentClassFilter)) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.studentId && s.studentId.toLowerCase().includes(q));
      }
      return true;
    });
  }, [studentsList, studentClassFilter, studentSearch]);
  const filteredStaff = useMemo(() => {
    return employeesList.filter((e) => {
      if (staffDeptFilter && e.department !== staffDeptFilter) return false;
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase();
        return e.name.toLowerCase().includes(q) || (e.designation && e.designation.toLowerCase().includes(q));
      }
      return true;
    });
  }, [employeesList, staffDeptFilter, staffSearch]);

  const toggleClassSelection = (clsName: string) => {
    setDraft((prev) => {
      const exists = prev.selectedClasses.includes(clsName);
      return {
        ...prev,
        selectedClasses: exists
          ? prev.selectedClasses.filter((c) => c !== clsName)
          : [...prev.selectedClasses, clsName],
      };
    });
  };

  const toggleStudentSelection = (id: string) => {
    setDraft((prev) => {
      const exists = prev.selectedStudentIds.includes(id);
      return {
        ...prev,
        selectedStudentIds: exists
          ? prev.selectedStudentIds.filter((sId) => sId !== id)
          : [...prev.selectedStudentIds, id],
      };
    });
  };

  const toggleDeptSelection = (deptName: string) => {
    setDraft((prev) => {
      const exists = prev.selectedDepartments.includes(deptName);
      return {
        ...prev,
        selectedDepartments: exists
          ? prev.selectedDepartments.filter((d) => d !== deptName)
          : [...prev.selectedDepartments, deptName],
      };
    });
  };

  const toggleEmployeeSelection = (id: string) => {
    setDraft((prev) => {
      const exists = prev.selectedEmployeeIds.includes(id);
      return {
        ...prev,
        selectedEmployeeIds: exists
          ? prev.selectedEmployeeIds.filter((eId) => eId !== id)
          : [...prev.selectedEmployeeIds, id],
      };
    });
  };

  return (
    <div className="space-y-5">
      {/* Category Tabs: Students Section vs Staff & Teachers Section */}
      <div className="flex rounded-xl border border-[var(--theme-border)] bg-[var(--theme-subtle)] p-1">
        <button
          type="button"
          onClick={() => setParticipantTab("students")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-semibold transition-all",
            participantTab === "students"
              ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-sm"
              : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Students Section
          {(draft.allStudents || draft.selectedClasses.length > 0 || draft.selectedStudentIds.length > 0) && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-primary)] text-[11px] text-white">
              {draft.allStudents
                ? "All"
                : draft.selectedClasses.length + draft.selectedStudentIds.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setParticipantTab("staff")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-semibold transition-all",
            participantTab === "staff"
              ? "bg-[var(--theme-surface)] text-[var(--theme-primary)] shadow-sm"
              : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
          )}
        >
          <Briefcase className="h-4 w-4" />
          Staff & Teachers Section
          {(draft.allStaff || draft.selectedDepartments.length > 0 || draft.selectedEmployeeIds.length > 0) && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-primary)] text-[11px] text-white">
              {draft.allStaff
                ? "All"
                : draft.selectedDepartments.length + draft.selectedEmployeeIds.length}
            </span>
          )}
        </button>
      </div>

      {dataLoading && (
        <div className="py-2 text-center text-[13px] text-[var(--theme-text-muted)]">
          Loading student and staff data...
        </div>
      )}

      {/* Tab Content 1: STUDENTS SECTION */}
      {participantTab === "students" && (
        <div className="space-y-4 rounded-xl border border-[var(--theme-border)] p-4">
          {/* Option A: Select All Students */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3.5">
            <div>
              <p className="text-[14px] font-semibold text-[var(--theme-text)]">Select All Students</p>
              <p className="text-[12px] text-[var(--theme-text-muted)]">
                Invite all enrolled students across all grades and classes in this campus.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={draft.allStudents}
                onChange={(e) => setDraft((p) => ({ ...p, allStudents: e.target.checked }))}
                className="h-5 w-5 rounded accent-[var(--theme-primary)]"
              />
            </label>
          </div>

          {!draft.allStudents && (
            <>
              {/* Option B: By Classes & Grades */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold">Select By Class / Grade Wise</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = draft.selectedClasses.length === availableClasses.length;
                      setDraft((p) => ({ ...p, selectedClasses: allSelected ? [] : [...availableClasses] }));
                    }}
                    className="text-[12px] font-medium text-[var(--theme-primary)] hover:underline"
                  >
                    {draft.selectedClasses.length === availableClasses.length ? "Deselect All Classes" : "Select All Classes"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {availableClasses.map((clsName) => {
                    const isSelected = draft.selectedClasses.includes(clsName);
                    return (
                      <button
                        key={clsName}
                        type="button"
                        onClick={() => toggleClassSelection(clsName)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-all",
                          isSelected
                            ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)] text-[var(--theme-primary-hover)]"
                            : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            isSelected
                              ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                              : "border-[var(--theme-border-strong)]"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="truncate">{clsName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option C: Individual Student Selection */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <h4 className="mb-2 text-[14px] font-semibold">Select Specific Individual Students</h4>
                <div className="mb-3 flex flex-wrap gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 py-1.5">
                    <Search className="h-4 w-4 text-[var(--theme-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search student name or roll..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full bg-transparent text-[13px] outline-none"
                    />
                  </div>
                  <select
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    className="h-9 rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px]"
                  >
                    <option value="">All Classes</option>
                    {availableClasses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--theme-border)] p-2">
                  {filteredStudents.length === 0 ? (
                    <p className="p-4 text-center text-[13px] text-[var(--theme-text-muted)]">
                      No matching students found.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {filteredStudents.map((std) => {
                        const isSelected = draft.selectedStudentIds.includes(std.id);
                        return (
                          <button
                            key={std.id}
                            type="button"
                            onClick={() => toggleStudentSelection(std.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg p-2 text-left text-[13px] hover:bg-[var(--theme-hover)]",
                              isSelected && "bg-[var(--theme-info-soft)]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                isSelected
                                  ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                                  : "border-[var(--theme-border-strong)]"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <Avatar name={std.name} size={24} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{std.name}</p>
                              <p className="truncate text-[11px] text-[var(--theme-text-muted)]">
                                {std.cls ? `${std.cls}-${std.section || "A"}` : std.studentId || "Student"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab Content 2: STAFF & TEACHERS SECTION */}
      {participantTab === "staff" && (
        <div className="space-y-4 rounded-xl border border-[var(--theme-border)] p-4">
          {/* Option A: Select All Staff */}
          <div className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3.5">
            <div>
              <p className="text-[14px] font-semibold text-[var(--theme-text)]">Select All Staff & Teachers</p>
              <p className="text-[12px] text-[var(--theme-text-muted)]">
                Invite all teachers, administrative staff, and management employees.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={draft.allStaff}
                onChange={(e) => setDraft((p) => ({ ...p, allStaff: e.target.checked }))}
                className="h-5 w-5 rounded accent-[var(--theme-primary)]"
              />
            </label>
          </div>

          {!draft.allStaff && (
            <>
              {/* Option B: By Department & Role */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold">Select By Department / Role Wise</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = draft.selectedDepartments.length === availableDepts.length;
                      setDraft((p) => ({ ...p, selectedDepartments: allSelected ? [] : [...availableDepts] }));
                    }}
                    className="text-[12px] font-medium text-[var(--theme-primary)] hover:underline"
                  >
                    {draft.selectedDepartments.length === availableDepts.length ? "Deselect All Departments" : "Select All Departments"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableDepts.map((deptName) => {
                    const isSelected = draft.selectedDepartments.includes(deptName);
                    return (
                      <button
                        key={deptName}
                        type="button"
                        onClick={() => toggleDeptSelection(deptName)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-all",
                          isSelected
                            ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)] text-[var(--theme-primary-hover)]"
                            : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            isSelected
                              ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                              : "border-[var(--theme-border-strong)]"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="truncate">{deptName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option C: Individual Staff Selection */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <h4 className="mb-2 text-[14px] font-semibold">Select Specific Individual Staff & Teachers</h4>
                <div className="mb-3 flex flex-wrap gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 py-1.5">
                    <Search className="h-4 w-4 text-[var(--theme-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search staff name or role..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full bg-transparent text-[13px] outline-none"
                    />
                  </div>
                  <select
                    value={staffDeptFilter}
                    onChange={(e) => setStaffDeptFilter(e.target.value)}
                    className="h-9 rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px]"
                  >
                    <option value="">All Departments</option>
                    {availableDepts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--theme-border)] p-2">
                  {filteredStaff.length === 0 ? (
                    <p className="p-4 text-center text-[13px] text-[var(--theme-text-muted)]">
                      No matching staff members found.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {filteredStaff.map((emp) => {
                        const isSelected = draft.selectedEmployeeIds.includes(emp.id);
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => toggleEmployeeSelection(emp.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg p-2 text-left text-[13px] hover:bg-[var(--theme-hover)]",
                              isSelected && "bg-[var(--theme-info-soft)]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                isSelected
                                  ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                                  : "border-[var(--theme-border-strong)]"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <Avatar name={emp.name} size={24} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{emp.name}</p>
                              <p className="truncate text-[11px] text-[var(--theme-text-muted)]">
                                {emp.designation || emp.department || "Staff Member"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <Field label="Additional / Custom Invitees (Optional)" hint="Add specific names or emails separated by commas if not listed above.">
        <Input
          value={draft.customParticipantsText}
          onChange={(e) => setDraft((p) => ({ ...p, customParticipantsText: e.target.value }))}
          placeholder="e.g. Guest Speaker Dr. Ali, External Auditor, Parent Representative"
        />
      </Field>

      {/* Selected Participants Live Summary */}
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-subtle)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[var(--theme-text)]">
            Selected Targets ({computedParticipantsList.length})
          </span>
          {computedParticipantsList.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDraft((p) => ({
                  ...p,
                  allStudents: false,
                  selectedClasses: [],
                  selectedStudentIds: [],
                  allStaff: false,
                  selectedDepartments: [],
                  selectedEmployeeIds: [],
                  customParticipantsText: "",
                }))
              }
              className="text-[12px] font-medium text-[var(--theme-danger-text)] hover:underline"
            >
              Clear All Selections
            </button>
          )}
        </div>

        {computedParticipantsList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {computedParticipantsList.map((p, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-surface)] px-3 py-1 text-[12px] font-medium border border-[var(--theme-border-strong)]"
              >
                <Avatar name={p} size={18} />
                {p}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--theme-text-muted)]">
            No participants selected yet. Use the tabs above to select students (all or class-wise) and staff members.
          </p>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium">
          <input
            type="checkbox"
            checked={draft.sendReminder}
            onChange={(e) => setDraft((p) => ({ ...p, sendReminder: e.target.checked }))}
            className="h-4 w-4 accent-[var(--theme-primary)]"
          />
          Send automated reminder before meeting
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium">
          <input
            type="checkbox"
            checked={draft.notifyGuardians}
            onChange={(e) => setDraft((p) => ({ ...p, notifyGuardians: e.target.checked }))}
            className="h-4 w-4 accent-[var(--theme-primary)]"
          />
          Notify parents & guardians for student meetings
        </label>
      </div>
    </div>
  );
}
