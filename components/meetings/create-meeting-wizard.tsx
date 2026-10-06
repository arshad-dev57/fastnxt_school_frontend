"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Info, Link2, ListChecks,
  MapPin, Radio, Sparkles, Users, Video,
} from "lucide-react";
import { Avatar, Btn, Card, cn, Field, Input, Textarea, type IconType } from "@/components/ui";
import { SuccessIcon } from "@/components/icons";
import { EmptyArt } from "@/components/meetings/empty-art";
import { ParticipantPicker } from "@/components/meetings/participant-picker";
import { MeetingStatusPill, ModeChip, VenueBlock } from "@/components/meetings/meeting-bits";
import { useMeetings, type MeetingDraft } from "@/lib/meetings-store";
import {
  MEETING_DURATIONS, MEETING_MODES, MEETING_PLATFORMS, MEETING_TYPES, MEETING_PERSONA,
  addMinutesToClock, formatClock, formatMeetingDate, meetingLinkFor, teacherParticipants,
  ownStudentParticipants, type MeetingMode, type MeetingPlatform, type MeetingScope,
} from "@/lib/meetings-data";

/* ============================================================================
   Create-meeting wizard — 6 steps: Details → Date & time → Type → Where →
   Participants → Review. Used by both flows:
     • scope "admin"   → invites Teachers
     • scope "teacher" → invites the teacher's own Students
   Frontend-only: on submit the meeting is added to the in-memory store and a
   notification is created for the invited side.
   ========================================================================== */

const STEPS: { key: string; label: string; Icon: IconType }[] = [
  { key: "details", label: "Details", Icon: ListChecks },
  { key: "when", label: "Date & time", Icon: CalendarDays },
  { key: "type", label: "Type", Icon: Sparkles },
  { key: "where", label: "Where", Icon: MapPin },
  { key: "people", label: "Participants", Icon: Users },
  { key: "review", label: "Review", Icon: Check },
];

const TYPES: Record<MeetingScope, string[]> = {
  admin: MEETING_TYPES,
  teacher: MEETING_TYPES,
  student: MEETING_TYPES,
};

const SLOTS = (() => {
  const out: string[] = [];
  for (let m = 7 * 60; m <= 18 * 60; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
})();

export type WizardDraft = {
  title: string;
  agenda: string;
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
  participantIds: string[];
  sendReminder: boolean;
  notifyGuardians: boolean;
  notes: string;
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyDraft = (scope: MeetingScope): WizardDraft => ({
  title: "",
  agenda: "",
  date: todayISO(),
  start: "09:00",
  duration: 45,
  type: scope === "admin" ? "Staff Briefing" : "Class Session",
  mode: "online",
  platform: scope === "admin" ? "Zoom" : "Google Meet",
  link: meetingLinkFor(scope === "admin" ? "Zoom" : "Google Meet"),
  room: "",
  building: "",
  locationNote: "",
  participantIds: [],
  sendReminder: true,
  notifyGuardians: false,
  notes: "",
});

export default function CreateMeetingWizard({ scope, baseHref }: { scope: MeetingScope; baseHref: string }) {
  const { createMeeting } = useMeetings();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(() => emptyDraft(scope));
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);

  const set = <K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const people = scope === "admin" ? teacherParticipants : ownStudentParticipants;
  const kindLabel = scope === "admin" ? "Teachers" : "Students";
  const audience: "teachers" | "students" = scope === "admin" ? "teachers" : "students";
  const end = addMinutesToClock(draft.start, draft.duration);

  const selected = useMemo(
    () => people.filter((p) => draft.participantIds.includes(p.id)),
    [people, draft.participantIds],
  );

  const validate = (index: number): string | null => {
    if (index === 0) {
      if (!draft.title.trim()) return "Give the meeting a clear title.";
      if (!draft.agenda.trim()) return "Add a short agenda so invitees know what to expect.";
    }
    if (index === 1 && !draft.date) return "Pick a date for the meeting.";
    if (index === 2 && !draft.type) return "Choose a meeting type.";
    if (index === 3) {
      if (draft.mode !== "physical" && !draft.link.trim()) return "Add a join link for the online attendees.";
      if (draft.mode !== "online" && !draft.room.trim()) return "Add the room or hall for the in-person attendees.";
    }
    if (index === 4 && draft.participantIds.length === 0) return `Select at least one ${kindLabel.toLowerCase().replace(/s$/, "")}.`;
    return null;
  };

  const goNext = () => {
    const problem = validate(step);
    if (problem) { setError(problem); return; }
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => { setError(null); setStep((s) => Math.max(0, s - 1)); };

  const submit = () => {
    for (let i = 0; i < STEPS.length; i++) {
      const problem = validate(i);
      if (problem) { setError(problem); setStep(i); return; }
    }
    const payload: MeetingDraft = {
      title: draft.title.trim(),
      agenda: draft.agenda.trim(),
      type: draft.type,
      scope,
      audience,
      date: draft.date,
      start: draft.start,
      end,
      mode: draft.mode,
      platform: draft.platform,
      link: draft.mode === "physical" ? undefined : draft.link.trim(),
      room: draft.mode === "online" ? undefined : draft.room.trim() || undefined,
      building: draft.mode === "online" ? undefined : draft.building.trim() || undefined,
      locationNote: draft.mode === "online" ? undefined : draft.locationNote.trim() || undefined,
      participants: selected,
      notifyGuardians: draft.notifyGuardians,
      sendReminder: draft.sendReminder,
      notes: draft.notes.trim() || undefined,
      organizer: MEETING_PERSONA[scope],
    };
    const meeting = createMeeting(payload, scope);
    setCreated({ id: meeting.id, title: meeting.title });
  };
  /* ------------------------------------------------------------- success -- */
  if (created) {
    return (
      <div className="px-4 pb-24 pt-4 sm:px-6">
        <Card className="mx-auto max-w-2xl text-center">
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]">
              <SuccessIcon size={30} />
            </span>
            <h2 className="text-[20px] font-semibold">Meeting scheduled</h2>
            <p className="max-w-md text-[14px] text-[var(--theme-text-muted)]">
              “{created.title}” was created and every selected {kindLabel.toLowerCase()} received an invitation in their notifications.
            </p>
            <p className="rounded-md bg-[var(--theme-subtle)] px-3 py-1 text-[13px] font-medium">Meeting ID · {created.id}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Link href={baseHref}
                className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--theme-primary-hover)]">
                <CalendarDays className="h-[18px] w-[18px]" /> View all meetings
              </Link>
              <Btn variant="secondary" Icon={ArrowLeft} onClick={() => { setCreated(null); setDraft(emptyDraft(scope)); setStep(0); }}>
                Schedule another
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* --------------------------------------------------------------- wizard -- */
  const canAdvance = validate(step) === null;

  return (
    <div className="px-4 pb-28 pt-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <ol className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={s.key} className="shrink-0">
                <button type="button" onClick={() => { if (i < step) { setError(null); setStep(i); } }} disabled={i > step}
                  className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    state === "current" && "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white",
                    state === "done" && "border-[var(--theme-success)] bg-[var(--theme-success-soft)] text-[var(--theme-success-text)] hover:brightness-95",
                    state === "todo" && "border-[var(--theme-border)] text-[var(--theme-text-faint)]")}>
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : <s.Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{i + 1}. {s.label}</span><span className="sm:hidden">{i + 1}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--theme-subtle)]">
          <div className="h-full rounded-full bg-[var(--theme-primary)] transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-4xl">
        <Card pad={false}>
          <div className="border-b border-[var(--theme-border)] px-4 py-3">
            <h2 className="text-[17px] font-semibold">{STEPS[step].label}</h2>
            <p className="text-[13px] text-[var(--theme-text-muted)]">{STEP_HELP[STEPS[step].key]}</p>
          </div>
          <div className="space-y-4 p-4">{renderStep()}</div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] px-4 py-3">
            <Btn variant="ghost" Icon={ArrowLeft} onClick={goBack} disabled={step === 0}>Back</Btn>
            {step < STEPS.length - 1
              ? <Btn variant="primary" IconRight={ArrowRight} onClick={goNext} disabled={!canAdvance}>Continue</Btn>
              : <Btn variant="primary" Icon={Check} onClick={submit}>Create meeting</Btn>}
          </div>
        </Card>
        {error && (
          <p className="mt-2 flex items-center gap-2 rounded-md bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] font-medium text-[var(--theme-danger-text)]">
            <Info className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
      </div>
    </div>
  );

  /* ---------------------------------------------------------- step bodies */
  function renderStep() {
    switch (STEPS[step].key) {
      case "details":
        return (
          <>
            <Field label="Meeting title">
              <Input value={draft.title} onChange={(e) => set("title", e.target.value)}
                placeholder={scope === "admin" ? "e.g. Weekly Academic Briefing" : "e.g. Grade 10 Mathematics — Revision Class"} />
            </Field>
            <Field label="Agenda" hint="What will be covered? Invitees see this on the invitation.">
              <Textarea value={draft.agenda} onChange={(e) => set("agenda", e.target.value)} placeholder="Add the points to be discussed…" />
            </Field>
            <Field label="Internal notes (optional)" hint="Only visible to the organiser.">
              <Textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Preparation notes…" />
            </Field>
          </>
        );
      case "when":
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <Input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Start time">
                <SelectSlot value={draft.start} onChange={(v) => set("start", v)} />
              </Field>
              <Field label="Duration" className="sm:col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {MEETING_DURATIONS.map((d) => (
                    <button key={d} type="button" onClick={() => set("duration", d)}
                      className={cn("h-9 rounded border px-3 text-[13px] transition-colors",
                        draft.duration === d ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                          : "border-[var(--theme-border-strong)] hover:bg-[var(--theme-hover)]")}>
                      {d} min
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[var(--theme-info-soft)] px-3 py-2.5 text-[13px] text-[var(--theme-text)]">
              <Clock className="h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
              {formatMeetingDate(draft.date)} · {formatClock(draft.start)} – {formatClock(end)} · PKT (UTC+05:00)
            </div>
          </>
        );
      case "type":
        return (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TYPES[scope].map((t) => (
              <button key={t} type="button" onClick={() => set("type", t)}
                className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[14px] transition-colors",
                  draft.type === t ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)] font-medium text-[var(--theme-primary-hover)]"
                    : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]")}>
                <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  draft.type === t ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white" : "border-[var(--theme-border-strong)]")}>
                  {draft.type === t && <Check className="h-3 w-3" />}
                </span>
                {t}
              </button>
            ))}
          </div>
        );
      case "where":
        return (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              {MEETING_MODES.map((m) => {
                const Icon = m.key === "online" ? Video : m.key === "physical" ? MapPin : Radio;
                return (
                  <button key={m.key} type="button" onClick={() => set("mode", m.key)}
                    className={cn("flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                      draft.mode === m.key ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)]" : "border-[var(--theme-border)] hover:bg-[var(--theme-hover)]")}>
                    <span className="flex items-center gap-2 text-[14px] font-medium"><Icon className="h-4 w-4" /> {m.label}</span>
                    <span className="text-[12px] text-[var(--theme-text-muted)]">{m.blurb}</span>
                  </button>
                );
              })}
            </div>
            {draft.mode !== "physical" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Platform">
                  <PlatformSelect value={draft.platform} onChange={(p) => { set("platform", p); set("link", meetingLinkFor(p)); }} />
                </Field>
                <Field label="Join link" hint="Invitees can copy it from the meeting details.">
                  <Input value={draft.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" />
                </Field>
              </div>
            )}
            {draft.mode !== "online" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Room / hall">
                  <Input value={draft.room} onChange={(e) => set("room", e.target.value)} placeholder="e.g. Auditorium Hall" />
                </Field>
                <Field label="Building (optional)">
                  <Input value={draft.building} onChange={(e) => set("building", e.target.value)} placeholder="e.g. Main Block" />
                </Field>
                <Field label="Directions (optional)" className="sm:col-span-2">
                  <Input value={draft.locationNote} onChange={(e) => set("locationNote", e.target.value)}
                    placeholder="e.g. Enter from the main gate and register at the front desk." />
                </Field>
              </div>
            )}
          </>
        );
      case "people":
        return (
          <>
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {selected.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-subtle)] py-0.5 pl-0.5 pr-2 text-[13px]">
                    <Avatar name={p.name} size={22} /> {p.name}
                    <button type="button" aria-label={`Remove ${p.name}`}
                      onClick={() => set("participantIds", draft.participantIds.filter((id) => id !== p.id))}
                      className="text-[var(--theme-text-faint)] hover:text-[var(--theme-danger)]">
                      <XIcon />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <ParticipantPicker people={people} selectedIds={draft.participantIds} onChange={(ids) => set("participantIds", ids)}
              kindLabel={kindLabel} withClassFilters={scope === "teacher"}
              emptyHint={scope === "admin" ? "Try a different name or department." : "Try a different name, class or section."} />
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[var(--theme-subtle)] px-3 py-2.5">
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={draft.sendReminder} onChange={(e) => set("sendReminder", e.target.checked)}
                  className="h-4 w-4 accent-[var(--theme-primary)]" />
                Send a reminder before the meeting
              </label>
              {scope === "teacher" && (
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={draft.notifyGuardians} onChange={(e) => set("notifyGuardians", e.target.checked)}
                    className="h-4 w-4 accent-[var(--theme-primary)]" />
                  Notify guardians too
                </label>
              )}
            </div>
          </>
        );
      default:
        return <ReviewPanel />;
    }
  }
  /* ------------------------------------------------------------ review step */
  function ReviewPanel() {
    const preview: MeetingPreview = {
      id: "preview",
      title: draft.title,
      agenda: draft.agenda,
      type: draft.type,
      scope,
      audience,
      organizer: MEETING_PERSONA[scope],
      date: draft.date,
      start: draft.start,
      end,
      mode: draft.mode,
      platform: draft.platform,
      link: draft.mode === "physical" ? undefined : draft.link,
      room: draft.mode === "online" ? undefined : draft.room,
      building: draft.mode === "online" ? undefined : draft.building,
      locationNote: draft.mode === "online" ? undefined : draft.locationNote,
      participants: selected,
      notifyGuardians: draft.notifyGuardians,
      sendReminder: draft.sendReminder,
      notes: draft.notes || undefined,
      createdAt: draft.date,
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold">{draft.title || "Untitled meeting"}</h3>
            <p className="mt-0.5 text-[14px] text-[var(--theme-text-muted)]">
              {draft.type} · organised by {MEETING_PERSONA[scope].name}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <MeetingStatusPill status="Upcoming" />
            <ModeChip mode={draft.mode} platform={draft.platform} />
          </div>
        </div>

        <p className="rounded-lg bg-[var(--theme-subtle)] p-3 text-[14px] leading-relaxed text-[var(--theme-text-muted)]">
          {draft.agenda || "No agenda added yet."}
        </p>

        <VenueBlock meeting={preview} />

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--theme-text)]">
            <Users className="h-4 w-4" /> {selected.length} {kindLabel.toLowerCase()} invited
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-subtle)] py-0.5 pl-0.5 pr-2.5 text-[13px]">
                <Avatar name={p.name} size={22} /> {p.name}
                <span className="text-[12px] text-[var(--theme-text-faint)]">· {p.sub}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-2 text-[13px] sm:grid-cols-2">
          <p className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] px-3 py-2">
            {draft.sendReminder ? <Check className="h-4 w-4 text-[var(--theme-success)]" /> : <Info className="h-4 w-4 text-[var(--theme-text-faint)]" />}
            Reminder {draft.sendReminder ? "enabled" : "disabled"}
          </p>
          <p className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] px-3 py-2">
            {draft.notifyGuardians ? <Check className="h-4 w-4 text-[var(--theme-success)]" /> : <Info className="h-4 w-4 text-[var(--theme-text-faint)]" />}
            Guardians {draft.notifyGuardians ? "notified" : "not notified"}
          </p>
        </div>

        {draft.notes && (
          <p className="rounded-lg border border-[var(--theme-border)] p-3 text-[13px] text-[var(--theme-text-muted)]">
            <span className="font-medium text-[var(--theme-text)]">Internal note · </span>{draft.notes}
          </p>
        )}

        {selected.length === 0 && (
          <EmptyArt art="meetings" size={150} title="No participants yet"
            message={`Go back and invite the ${kindLabel.toLowerCase()} who should attend.`} />
        )}
      </div>
    );
  }

  function XIcon() {
    return <span aria-hidden="true" className="text-[15px] leading-none">×</span>;
  }
}

const STEP_HELP: Record<string, string> = {
  details: "Name the meeting and describe what will be covered.",
  when: "Pick the date, start time and how long the meeting should run.",
  type: "Choose the category so it is easy to find later.",
  where: "Decide whether you meet online, in person, or both.",
  people: "Select the invitees — individually, by section, or everyone.",
  review: "Check everything before the invitations are sent.",
};

/** Structural preview of the draft (same shape as a stored Meeting). */
type MeetingPreview = Parameters<typeof VenueBlock>[0]["meeting"];

function SelectSlot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]">
        {SLOTS.map((s) => <option key={s} value={s}>{formatClock(s)}</option>)}
      </select>
      <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
    </div>
  );
}

function PlatformSelect({ value, onChange }: { value: MeetingPlatform; onChange: (v: MeetingPlatform) => void }) {
  const options = MEETING_PLATFORMS.filter((p) => p !== "In-person");
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value as MeetingPlatform)}
        className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]">
        {options.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <Link2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-muted)]" />
    </div>
  );
}
