"use client";

import { useState } from "react";
import {
  Building2, CalendarDays, Check, Clock, Copy, ExternalLink, MapPin, Navigation, Users, Video, XCircle,
} from "lucide-react";
import { Avatar, Btn, ConfirmDialog, Modal } from "@/components/ui";
import {
  MEETING_META, formatMeetingDate, formatMeetingTime, meetingVenueLabel, relativeDateLabel,
  type Meeting, type MeetingScope, type MeetingStatus,
} from "@/lib/meetings-data";
import { CopyLinkButton, MeetingStatusPill, ModeChip, ParticipantStack } from "@/components/meetings/meeting-bits";

/* ============================================================================
   Meeting details — a modal used everywhere a meeting row is opened.
   Sections: header (status / mode), agenda, when + where (online link and/or
   physical room with copy + directions), organiser and the full participant
   list. "Join Meeting" opens the video link; "View Location" opens the
   location drawer for in-person meetings.
   ========================================================================== */

const statusFor = (m: Meeting): MeetingStatus => {
  if (m.cancelled) return "Cancelled";
  const rel = relativeDateLabel(m.date);
  if (rel === "Today") return "Today";
  if (rel.includes("ago")) return "Completed";
  return "Upcoming";
};

export function MeetingDetailsModal({ meeting, open, onClose, scope, onCancelMeeting }: {
  meeting: Meeting | null;
  open: boolean;
  onClose: () => void;
  scope: MeetingScope;
  onCancelMeeting?: (id: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [locationFor, setLocationFor] = useState<Meeting | null>(null);

  if (!meeting) return null;
  const cancelled = meeting.cancelled === true;
  const canJoin = meeting.mode !== "physical" && Boolean(meeting.link) && !cancelled;
  const showLocation = meeting.mode !== "online";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        width="max-w-2xl"
        title={meeting.title}
        subtitle={`${meeting.type} · ${MEETING_META.institution}`}
        footer={
          <>
            {scope === "admin" && onCancelMeeting && !cancelled && (
              <Btn variant="ghost" Icon={XCircle} className="mr-auto text-[var(--theme-danger)]" onClick={() => setConfirmCancel(true)}>
                Cancel meeting
              </Btn>
            )}
            {canJoin && (
              <>
                <CopyLinkButton link={meeting.link ?? ""} size="md" />
                <a href={meeting.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--theme-primary-hover)]">
                  <Video className="h-[18px] w-[18px]" /> Join Meeting <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              </>
            )}
            {meeting.mode === "physical" && !cancelled && (
              <Btn variant="primary" Icon={MapPin} onClick={() => setLocationFor(meeting)}>View Location</Btn>
            )}
            {!canJoin && meeting.mode !== "physical" && <Btn variant="secondary" onClick={onClose}>Close</Btn>}
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <MeetingStatusPill status={statusFor(meeting)} />
            <ModeChip mode={meeting.mode} platform={meeting.platform} />
            <span className="rounded-md bg-[var(--theme-subtle)] px-2 py-1 text-[12px] font-medium text-[var(--theme-text-muted)]">{meeting.id}</span>
          </div>

          <section>
            <h4 className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">Agenda</h4>
            <p className="rounded-lg bg-[var(--theme-subtle)] p-3 text-[14px] leading-relaxed text-[var(--theme-text)]">{meeting.agenda}</p>
          </section>

          <section className="grid gap-2 text-[14px] sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
              {formatMeetingDate(meeting.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
              {formatMeetingTime(meeting)} · {MEETING_META.timeZone}
            </p>
            <p className="flex items-center gap-2 sm:col-span-2">
              <Navigation className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
              {meetingVenueLabel(meeting)}
            </p>
          </section>

          {cancelled && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[13px] text-[var(--theme-danger-text)]">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              This meeting was cancelled. Invitees have been notified and it no longer appears in upcoming schedules.
            </p>
          )}
          {/* online block */}
          {meeting.mode !== "physical" && meeting.link && (
            <section className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-info-soft)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--theme-primary-hover)]">
                  <Video className="h-4 w-4" /> Online · {meeting.platform}
                </p>
                <CopyLinkButton link={meeting.link} label="Copy" />
              </div>
              <p className="mt-1.5 break-all text-[13px] text-[var(--theme-text-muted)]">{meeting.link}</p>
            </section>
          )}

          {/* physical block */}
          {showLocation && (
            <section className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-warning-soft)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--theme-warning-text)]">
                  <Building2 className="h-4 w-4" /> In-person
                </p>
                <Btn size="sm" variant="secondary" Icon={MapPin} onClick={() => setLocationFor(meeting)}>Directions</Btn>
              </div>
              <p className="mt-1.5 text-[14px] font-medium text-[var(--theme-text)]">{meeting.room ?? "On campus"}</p>
              {meeting.building && <p className="text-[13px] text-[var(--theme-text-muted)]">{meeting.building}</p>}
              {meeting.locationNote && <p className="mt-1 text-[12px] text-[var(--theme-text-faint)]">{meeting.locationNote}</p>}
            </section>
          )}

          {/* organiser */}
          <section className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--theme-border)] p-3">
            <Avatar name={meeting.organizer.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{meeting.organizer.name}</p>
              <p className="truncate text-[12px] text-[var(--theme-text-muted)]">Organiser · {meeting.organizer.role}</p>
            </div>
            <span className="rounded-full bg-[var(--theme-subtle)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--theme-text-muted)]">
              {meeting.audience === "teachers" ? "Teacher meeting" : "Student meeting"}
            </span>
          </section>

          {/* participants */}
          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
                Participants · {meeting.participants.length}
              </h4>
              <ParticipantStack participants={meeting.participants} max={8} />
            </div>
            <ul className="max-h-52 divide-y divide-[var(--theme-border)] overflow-y-auto rounded-lg border border-[var(--theme-border)]">
              {meeting.participants.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={p.name} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{p.name}</span>
                    <span className="block truncate text-[12px] text-[var(--theme-text-muted)]">{p.sub}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--theme-success-text)]">
                    <Check className="h-3.5 w-3.5" /> Invited
                  </span>
                </li>
              ))}
            </ul>
            {meeting.notifyGuardians && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--theme-text-muted)]">
                <Users className="h-3.5 w-3.5" /> Guardians of these students are also notified.
              </p>
            )}
          </section>

          {meeting.notes && (
            <section>
              <h4 className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">Notes</h4>
              <p className="rounded-lg border border-[var(--theme-border)] p-3 text-[13px] text-[var(--theme-text-muted)]">{meeting.notes}</p>
            </section>
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--theme-text-faint)]">
            <span>Created {formatMeetingDate(meeting.createdAt)}</span>
            <span>· {MEETING_META.session} session</span>
            <span>· {MEETING_META.campus}</span>
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this meeting?"
        message={`“${meeting.title}” will be marked as cancelled and every invitee will be notified. This is a demo action and can be undone from the meeting list.`}
        confirmLabel="Cancel meeting"
        onConfirm={() => { onCancelMeeting?.(meeting.id); setConfirmCancel(false); onClose(); }}
      />

      <LocationDialog meeting={locationFor} open={Boolean(locationFor)} onClose={() => setLocationFor(null)} />
    </>
  );
}
/* --------------------------------------------------------------------------- */

export function LocationDialog({ meeting, open, onClose }: { meeting: Meeting | null; open: boolean; onClose: () => void }) {
  if (!meeting) return null;
  const address = `${meeting.room ?? "Campus venue"}${meeting.building ? `, ${meeting.building}` : ""} — ${MEETING_META.campus}, ${MEETING_META.institution}`;
  return (
    <Modal open={open} onClose={onClose} width="max-w-md" title="Meeting location"
      subtitle={`${formatMeetingDate(meeting.date)} · ${formatMeetingTime(meeting)}`}>
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-info-soft)] p-4">
          <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/50" />
          <span className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/40" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary)] text-white">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{meeting.room ?? "On campus"}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">{meeting.building ?? MEETING_META.campus}</p>
            </div>
          </div>
        </div>

        <dl className="space-y-1.5 text-[13px]">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-[var(--theme-text-muted)]">Address</dt>
            <dd className="min-w-0">{address}</dd>
          </div>
          {meeting.locationNote && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-[var(--theme-text-muted)]">Directions</dt>
              <dd className="min-w-0">{meeting.locationNote}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-[var(--theme-text-muted)]">Arrive by</dt>
            <dd className="min-w-0">{formatMeetingTime({ start: meeting.start, end: meeting.start })} · 10 minutes early recommended</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-[var(--theme-text-muted)]">Organiser</dt>
            <dd className="min-w-0">{meeting.organizer.name} · {meeting.organizer.role}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <CopyLinkButton link={address} label="Copy address" size="md" />
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--theme-subtle)] px-2.5 py-1.5 text-[12px] text-[var(--theme-text-muted)]">
            <Copy className="h-3.5 w-3.5" /> Share these directions with guardians
          </span>
        </div>
      </div>
    </Modal>
  );
}