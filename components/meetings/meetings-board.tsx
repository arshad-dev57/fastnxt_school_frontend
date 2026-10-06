"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock, CalendarX, CheckCircle2, Filter, LayoutGrid, List, Search, Users, Video, X,
} from "lucide-react";
import { Btn, cn, StatCard } from "@/components/ui";
import { EmptyArt } from "@/components/meetings/empty-art";
import { MeetingDetailsModal } from "@/components/meetings/meeting-details";
import { JoinMeetingButton, MeetingStatusPill, ModeChip, ParticipantStack } from "@/components/meetings/meeting-bits";
import { useMeetings } from "@/lib/meetings-store";
import {
  MODE_LABEL, formatMeetingDate, formatMeetingTime, meetingVenueLabel, relativeDateLabel,
  type Meeting, type MeetingMode, type MeetingScope, type MeetingStatus,
} from "@/lib/meetings-data";

const TABS = ["All", "Upcoming", "Today", "Completed", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

const statusMatch = (s: MeetingStatus, t: Tab) =>
  t === "All" ? true : t === "Today" ? s === "Today" || s === "Live" : s === t;

export function MeetingsBoard({ scope, canCreate = false, onCreateHref, onShowLocation, openMeetingId }: {
  scope: MeetingScope;
  canCreate?: boolean;
  onCreateHref?: string;
  /** Optional external location handler (rarely used; the board has its own). */
  onShowLocation?: (m: Meeting) => void;
  /** Deep link target — the board opens this meeting's details immediately. */
  openMeetingId?: string | null;
}) {
  const { meetingsFor, statusOf, countsFor, cancelMeeting, restoreMeeting } = useMeetings();
  const [tab, setTab] = useState<Tab>("All");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState<MeetingMode | "">("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => meetingsFor(scope), [meetingsFor, scope]);
  const counts = countsFor(scope);

  /* Deep links: ?meeting=MTG-1001 (header bell) and the notifications panel. */
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("meeting");
    if (fromUrl) setOpenId(fromUrl);
  }, []);

  useEffect(() => {
    if (openMeetingId) setOpenId(openMeetingId);
  }, [openMeetingId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((m) => {
      if (!statusMatch(statusOf(m), tab)) return false;
      if (type && m.type !== type) return false;
      if (mode && m.mode !== mode) return false;
      if (!q) return true;
      return m.title.toLowerCase().includes(q)
        || m.agenda.toLowerCase().includes(q)
        || m.type.toLowerCase().includes(q)
        || m.organizer.name.toLowerCase().includes(q);
    });
  }, [rows, tab, type, mode, query, statusOf]);

  const ordered = useMemo(() => {
    const reversed = tab === "Completed" || tab === "Cancelled";
    return reversed ? [...filtered].reverse() : filtered;
  }, [filtered, tab]);

  const types = useMemo(() => [...new Set(rows.map((m) => m.type))].sort(), [rows]);
  const live = rows.find((m) => statusOf(m) === "Live");
  const open = openId ? rows.find((m) => m.id === openId) ?? null : null;

  const tabCount = (t: Tab) => rows.filter((m) => statusMatch(statusOf(m), t)).length;
  const activeFilters = (type ? 1 : 0) + (mode ? 1 : 0);
  const noneAtAll = rows.length === 0;

  return (
    <div className="space-y-4">
      {!noneAtAll && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Upcoming" value={counts.Upcoming} Icon={CalendarClock} tone="blue"
            sub={counts.Today ? `${counts.Today} today` : "Nothing today"} />
          <StatCard label="Live now" value={counts.Live} Icon={Video} tone={counts.Live ? "green" : "gray"}
            sub={live ? live.title : "No meeting in progress"} />
          <StatCard label="Completed" value={counts.Completed} Icon={CheckCircle2} tone="green" sub="Held this term" />
          <StatCard label="Cancelled" value={counts.Cancelled} Icon={CalendarX} tone={counts.Cancelled ? "red" : "gray"} sub="Rescheduled or dropped" />
        </div>
      )}

      {live && tab === "All" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-danger)] text-white">
            <Video className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[var(--theme-danger-text)]">Live now · {live.title}</p>
            <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{formatMeetingTime(live)} · {meetingVenueLabel(live)}</p>
          </div>
          <JoinMeetingButton meeting={live} onShowLocation={onShowLocation} />
        </div>
      )}
      {/* tabs + toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--theme-border)]">
        <div className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={cn("relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t px-3 pb-3 pt-2 text-[15px] transition-colors hover:bg-[var(--theme-hover)]",
                tab === t ? "font-medium text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]")}>
              {t}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                tab === t ? "bg-[var(--theme-primary)] text-white" : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]")}>
                {tabCount(t)}
              </span>
              {tab === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[var(--theme-primary)]" />}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 pb-2">
          <div className="group flex h-9 min-w-[150px] items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 transition-colors focus-within:border-[var(--theme-primary)]">
            <Search className="h-[18px] w-[18px] shrink-0 text-[var(--theme-text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search meetings…"
              className="min-w-0 w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--theme-text-faint)]" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[var(--theme-text-faint)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Btn size="sm" variant={activeFilters ? "subtle" : "secondary"} Icon={Filter} onClick={() => setFiltersOpen((o) => !o)}>
            <span className="hidden sm:inline">Filters{activeFilters ? ` (${activeFilters})` : ""}</span>
          </Btn>
          <div className="hidden overflow-hidden rounded border border-[var(--theme-border-strong)] sm:flex">
            <button type="button" onClick={() => setView("cards")} aria-label="Card view"
              className={cn("flex h-9 w-9 items-center justify-center transition-colors", view === "cards" ? "bg-[var(--theme-primary)] text-white" : "hover:bg-[var(--theme-hover)]")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView("table")} aria-label="Table view"
              className={cn("flex h-9 w-9 items-center justify-center transition-colors", view === "table" ? "bg-[var(--theme-primary)] text-white" : "hover:bg-[var(--theme-hover)]")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-subtle)] p-3">
          <Pick label="Type" value={type} options={types} onChange={setType} />
          <Pick label="Mode" value={mode} options={Object.values(MODE_LABEL)}
            onChange={(v) => setMode((Object.keys(MODE_LABEL) as MeetingMode[]).find((k) => MODE_LABEL[k] === v) ?? "")} />
          {activeFilters > 0 && (
            <button type="button" onClick={() => { setType(""); setMode(""); }}
              className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Reset filters</button>
          )}
        </div>
      )}

      {noneAtAll ? (
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <EmptyArt
            art="meetings"
            title={scope === "student" ? "No meetings yet" : "No meetings scheduled"}
            message={scope === "student"
              ? "When a teacher invites your class to a session or review, it will appear here with the join link."
              : "Create your first meeting to coordinate with staff or students — invitations appear instantly in their notifications."}
            action={canCreate && onCreateHref
              ? <a href={onCreateHref}
                  className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--theme-primary-hover)]">
                  <Users className="h-[18px] w-[18px]" /> Schedule a meeting
                </a>
              : undefined}
          />
        </div>
      ) : ordered.length === 0 ? (
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <EmptyArt art="meetings" size={160} title="Nothing matches these filters"
            message="Try another tab, clear the search, or reset the filters to see every meeting."
            action={<Btn variant="secondary" Icon={X} onClick={() => { setQuery(""); setType(""); setMode(""); setTab("All"); }}>Clear filters</Btn>} />
        </div>
      ) : view === "table" ? (
        <MeetingTable rows={ordered} statusOf={statusOf} onOpen={setOpenId} onShowLocation={onShowLocation} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {ordered.map((m) => (
            <MeetingCard key={m.id} meeting={m} status={statusOf(m)} onOpen={() => setOpenId(m.id)} onShowLocation={onShowLocation} />
          ))}
        </div>
      )}

      <MeetingDetailsModal
        meeting={open}
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        scope={scope}
        onCancelMeeting={(id) => { if (open?.cancelled) restoreMeeting(id); else cancelMeeting(id); }}
      />
    </div>
  );
}

function Pick({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-[var(--theme-text-muted)]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2 text-[13px] outline-none focus:border-[var(--theme-primary)]">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function MeetingCard({ meeting, status, onOpen, onShowLocation }: {
  meeting: Meeting;
  status?: MeetingStatus;
  onOpen: () => void;
  onShowLocation?: (m: Meeting) => void;
}) {
  const cancelled = meeting.cancelled === true;
  return (
    <article className={cn("flex flex-col gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-shadow hover:shadow-md",
      cancelled && "opacity-80")}>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg",
          cancelled ? "bg-[var(--theme-subtle)] text-[var(--theme-text-faint)]" : "bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]")}>
          <span className="text-[16px] font-bold leading-none">{meeting.date.slice(8, 10)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">{formatMeetingDate(meeting.date, { month: "short" })}</span>
        </span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="block w-full text-left">
            <h3 className={cn("truncate text-[15px] font-semibold hover:underline", cancelled && "line-through decoration-[var(--theme-text-faint)]")}>
              {meeting.title}
            </h3>
          </button>
          <p className="mt-0.5 truncate text-[12px] text-[var(--theme-text-muted)]">{meeting.type} · {meeting.organizer.name}</p>
        </div>
        <MeetingStatusPill status={status ?? (cancelled ? "Cancelled" : "Upcoming")} />
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--theme-text-muted)]">{meeting.agenda}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[var(--theme-text-muted)]">
        <span className="inline-flex items-center gap-1.5"><ClockIcon /> {formatMeetingTime(meeting)}</span>
        <span>{relativeDateLabel(meeting.date)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-3">
        <ModeChip mode={meeting.mode} platform={meeting.platform} />
        <ParticipantStack participants={meeting.participants} max={4} size={26} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <JoinMeetingButton meeting={meeting} onShowLocation={onShowLocation} size="sm" />
        <Btn size="sm" variant="secondary" onClick={onOpen}>Details</Btn>
        <span className="ml-auto text-[12px] text-[var(--theme-text-faint)]">{meeting.participants.length} invited</span>
      </div>
    </article>
  );
}
export function MeetingTable({ rows, statusOf, onOpen, onShowLocation }: {
  rows: Meeting[];
  statusOf: (m: Meeting) => MeetingStatus;
  onOpen: (id: string) => void;
  onShowLocation?: (m: Meeting) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
      <div className="hidden items-center gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-subtle)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)] lg:flex">
        <span className="min-w-0 flex-[2]">Meeting</span>
        <span className="w-40 shrink-0">When</span>
        <span className="w-36 shrink-0">Where</span>
        <span className="w-24 shrink-0">People</span>
        <span className="w-28 shrink-0">Status</span>
        <span className="w-36 shrink-0 text-right">Actions</span>
      </div>
      <div className="divide-y divide-[var(--theme-border)]">
        {rows.map((m) => (
          <div key={m.id} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[var(--theme-hover)] lg:flex-row lg:items-center">
            <div className="min-w-0 flex-[2]">
              <button type="button" onClick={() => onOpen(m.id)} className="block max-w-full text-left">
                <span className={cn("block truncate text-[14px] font-medium hover:underline", m.cancelled && "line-through decoration-[var(--theme-text-faint)]")}>
                  {m.title}
                </span>
              </button>
              <span className="block truncate text-[12px] text-[var(--theme-text-muted)]">{m.type} · {m.organizer.name}</span>
            </div>
            <div className="shrink-0 text-[13px] lg:w-40">
              <p>{formatMeetingDate(m.date)}</p>
              <p className="text-[12px] text-[var(--theme-text-muted)]">{formatMeetingTime(m)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)] lg:w-36">
              <PinIcon /><span className="truncate">{meetingVenueLabel(m)}</span>
            </div>
            <div className="shrink-0 lg:w-24">
              <ParticipantStack participants={m.participants} max={3} size={24} />
            </div>
            <div className="shrink-0 lg:w-28"><MeetingStatusPill status={statusOf(m)} /></div>
            <div className="flex w-full shrink-0 items-center gap-2 lg:w-36 lg:justify-end">
              <JoinMeetingButton meeting={m} onShowLocation={onShowLocation} size="sm" />
              <Btn size="sm" variant="ghost" onClick={() => onOpen(m.id)}>View</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}