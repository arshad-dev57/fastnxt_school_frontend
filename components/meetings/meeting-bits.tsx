"use client";

import { useState } from "react";
import {
  Building2, CalendarDays, Check, Clock, Copy, ExternalLink, MapPin, Radio, Users, Video,
} from "lucide-react";
import { Avatar, Btn, cn, type IconType } from "@/components/ui";
import { SuccessIcon } from "@/components/icons";
import {
  MODE_LABEL, STATUS_TONE, formatMeetingDate, formatMeetingTime, meetingVenueLabel, relativeDateLabel,
  type Meeting, type MeetingMode, type MeetingParticipant, type MeetingStatus,
} from "@/lib/meetings-data";

/* ============================================================================
   Small, reusable pieces shared by every Meetings surface (list, details,
   wizard review, dashboards). Purely presentational.
   ========================================================================== */

const STATUS_STYLE: Record<MeetingStatus, { bg: string; fg: string; dot: string }> = {
  Live: { bg: "var(--theme-danger-soft)", fg: "var(--theme-danger-text)", dot: "var(--theme-danger)" },
  Today: { bg: "var(--theme-warning-soft)", fg: "var(--theme-warning-text)", dot: "var(--theme-warning)" },
  Upcoming: { bg: "var(--theme-info-soft)", fg: "var(--theme-primary-hover)", dot: "var(--theme-info)" },
  Completed: { bg: "var(--theme-success-soft)", fg: "var(--theme-success-text)", dot: "var(--theme-success)" },
  Cancelled: { bg: "var(--theme-subtle)", fg: "var(--theme-text-muted)", dot: "var(--theme-text-faint)" },
};

export function MeetingStatusPill({ status, className = "" }: { status: MeetingStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap",
      status === "Live" && "ic-open", className)} style={{ background: s.bg, color: s.fg }}>
      <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

const MODE_ICON: Record<MeetingMode, IconType> = { online: Video, physical: MapPin, hybrid: Radio };

export function ModeChip({ mode, platform, className = "" }: { mode: MeetingMode; platform?: string; className?: string }) {
  const Icon = MODE_ICON[mode];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-[var(--theme-subtle)] px-2 py-1 text-[12px] font-medium text-[var(--theme-text-muted)]", className)}>
      <Icon className="h-3.5 w-3.5" />
      {MODE_LABEL[mode]}{platform && mode !== "physical" ? ` · ${platform}` : ""}
    </span>
  );
}

export function DateChip({ date, className = "" }: { date: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-muted)]", className)}>
      <CalendarDays className="h-3.5 w-3.5" />
      {relativeDateLabel(date)}
    </span>
  );
}

export function MeetingMetaRow({ meeting, dense = false }: { meeting: Meeting; dense?: boolean }) {
  const Icon = MODE_ICON[meeting.mode];
  return (
    <dl className={cn("grid gap-2", dense ? "text-[13px]" : "text-[14px] sm:grid-cols-2")}>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
        <span className="min-w-0 truncate">{formatMeetingDate(meeting.date)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
        <span className="min-w-0 truncate">
          {formatMeetingTime(meeting)} <span className="text-[var(--theme-text-faint)]">· {relativeDateLabel(meeting.date)}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
        <span className="min-w-0 truncate">{meetingVenueLabel(meeting)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 shrink-0 text-[var(--theme-text-faint)]" />
        <span className="min-w-0 truncate">
          {meeting.participants.length} {meeting.audience === "teachers" ? "teachers" : "students"}
          {meeting.notifyGuardians ? " + guardians" : ""}
        </span>
      </div>
    </dl>
  );
}

/* ------------------------------------------------------------ copy + join */

export function CopyLinkButton({ link, label = "Copy link", size = "sm" }: { link: string; label?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard blocked (insecure context) — still show feedback */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Btn size={size} variant="secondary" onClick={copy} Icon={copied ? undefined : Copy} className="shrink-0">
      {copied
        ? <span className="inline-flex items-center gap-1.5 text-[var(--theme-success-text)]"><SuccessIcon size={16} /> Copied</span>
        : label}
    </Btn>
  );
}

/** Primary call-to-action: opens the video link (online / hybrid) or reveals the
    room details (in-person). Frontend-only — no call is actually placed. */
export function JoinMeetingButton({ meeting, onShowLocation, size = "md", className = "" }: {
  meeting: Meeting; onShowLocation?: (m: Meeting) => void; size?: "sm" | "md" | "lg"; className?: string;
}) {
  if (meeting.cancelled) {
    return <Btn size={size} variant="secondary" disabled className={className} Icon={Video}>Cancelled</Btn>;
  }

  if (meeting.mode !== "physical" && meeting.link) {
    return (
      <a
        href={meeting.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors",
          size === "sm" ? "h-8 px-3 text-[13px]" : size === "lg" ? "h-10 px-4 text-[15px]" : "h-9 px-3.5 text-[14px]",
          "bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]",
          className,
        )}
      >
        <Video className="h-[18px] w-[18px]" /> Join Meeting <ExternalLink className="h-3.5 w-3.5 opacity-80" />
      </a>
    );
  }

  return (
    <Btn size={size} variant="primary" Icon={MapPin} className={className} onClick={() => onShowLocation?.(meeting)}>
      View Location
    </Btn>
  );
}

/* -------------------------------------------------------------- people bits */

export function ParticipantStack({ participants, max = 5, size = 28 }: {
  participants: MeetingParticipant[]; max?: number; size?: number;
}) {
  const shown = participants.slice(0, max);
  const rest = participants.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span key={p.id} className={cn("relative inline-flex", i > 0 && "-ml-2")} style={{ zIndex: shown.length - i }}>
          <Avatar name={p.name} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-2 inline-flex items-center justify-center rounded-full bg-[var(--theme-subtle)] font-semibold text-[var(--theme-text-muted)] ring-2 ring-[var(--theme-surface)]"
          style={{ width: size, height: size, fontSize: size <= 28 ? 10 : 11 }}>
          +{rest}
        </span>
      )}
    </div>
  );
}

/** Organiser line reused by the card, details drawer and wizard review step. */
export function OrganiserLine({ meeting, className = "" }: { meeting: Meeting; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]", className)}>
      <Avatar name={meeting.organizer.name} size={22} />
      <span className="min-w-0 truncate">
        <span className="font-medium text-[var(--theme-text)]">{meeting.organizer.name}</span>
        <span className="text-[var(--theme-text-faint)]"> · {meeting.organizer.role}</span>
      </span>
    </div>
  );
}

/** "What happens where" block for the details drawer and the review step. */
export function VenueBlock({ meeting, className = "" }: { meeting: Meeting; className?: string }) {
  const showLink = meeting.mode !== "physical" && Boolean(meeting.link);
  const showRoom = meeting.mode !== "online";
  return (
    <div className={cn("space-y-2.5", className)}>
      {showLink && (
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-info-soft)] p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-primary-hover)]">
            <Video className="h-3.5 w-3.5" /> Online
          </p>
          <p className="mt-1 break-all text-[13px] text-[var(--theme-text-muted)]">{meeting.link}</p>
        </div>
      )}
      {showRoom && (
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-warning-soft)] p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-warning-text)]">
            <Building2 className="h-3.5 w-3.5" /> In-person
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text)]">{meeting.room ?? "On campus"}</p>
          {meeting.building && <p className="text-[12px] text-[var(--theme-text-muted)]">{meeting.building}</p>}
          {meeting.locationNote && <p className="mt-1 text-[12px] text-[var(--theme-text-faint)]">{meeting.locationNote}</p>}
        </div>
      )}
      <p className="flex items-center gap-1.5 text-[12px] text-[var(--theme-text-faint)]">
        <Check className="h-3.5 w-3.5 text-[var(--theme-success)]" />
        {formatMeetingDate(meeting.date)} · {formatMeetingTime(meeting)} · PKT (UTC+05:00)
      </p>
    </div>
  );
}

export const meetingStatusColor = STATUS_TONE;

