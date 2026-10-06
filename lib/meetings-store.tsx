"use client";

/* ============================================================================
   Meetings store — a tiny, dependency-free client store.

   Everything the Meetings module needs lives behind this provider so the UI
   never touches the seed data directly. Swapping the in-memory arrays for a
   real API later means changing only this file: the component layer already
   consumes async-friendly setters (createMeeting / cancelMeeting / …).

   Persistence mirrors the rest of the app: localStorage, versioned key, and a
   `ready` flag consumers can use to avoid a hydration flash.
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  MEETING_PERSONA, MEETING_TODAY, deriveMeetingStatus, seedMeetingNotifications, seedMeetings,
  type Meeting, type MeetingNotification, type MeetingOrganizer, type MeetingScope, type MeetingStatus,
} from "@/lib/meetings-data";

const STORAGE_KEY = "bisonseducore360-meetings-v1";

type Persisted = { meetings: Meeting[]; notifications: MeetingNotification[] };

export type MeetingDraft = Omit<Meeting, "id" | "createdAt" | "organizer"> & { organizer?: MeetingOrganizer };

type MeetingsContextValue = {
  /** False until the persisted snapshot has been read on the client. */
  ready: boolean;
  meetings: Meeting[];
  notifications: MeetingNotification[];
  statusOf: (m: Meeting) => MeetingStatus;
  meetingsFor: (scope: MeetingScope) => Meeting[];
  notificationsFor: (scope: MeetingScope) => MeetingNotification[];
  upcomingFor: (scope: MeetingScope, limit?: number) => Meeting[];
  countsFor: (scope: MeetingScope) => Record<MeetingStatus, number>;
  getMeeting: (id: string) => Meeting | undefined;
  createMeeting: (draft: MeetingDraft, scope: MeetingScope) => Meeting;
  cancelMeeting: (id: string) => void;
  restoreMeeting: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: (scope: MeetingScope) => void;
  unreadCount: (scope: MeetingScope) => number;
  resetDemo: () => void;
};

const MeetingsContext = createContext<MeetingsContextValue | null>(null);

const EMPTY_COUNTS: Record<MeetingStatus, number> = {
  Live: 0, Today: 0, Upcoming: 0, Completed: 0, Cancelled: 0,
};

/** Who sees what — the single source of truth for per-panel visibility. */
export function visibleTo(meetings: Meeting[], scope: MeetingScope): Meeting[] {
  if (scope === "admin") return meetings.filter((m) => m.scope === "admin");
  if (scope === "teacher") {
    const me = MEETING_PERSONA.teacher.id;
    return meetings.filter(
      (m) => m.scope === "teacher" || (m.audience === "teachers" && m.participants.some((p) => p.id === me)),
    );
  }
  const me = MEETING_PERSONA.student.id;
  return meetings.filter((m) => m.scope === "teacher" && m.participants.some((p) => p.id === me));
}

const bySchedule = (a: Meeting, b: Meeting) =>
  a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date);

export function MeetingsProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>(seedMeetings);
  const [notifications, setNotifications] = useState<MeetingNotification[]>(seedMeetingNotifications);
  const [ready, setReady] = useState(false);
  const seq = useRef(2000);

  /* One-time hydration from localStorage (client only, after first paint). */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        if (Array.isArray(parsed.meetings) && parsed.meetings.length) setMeetings(parsed.meetings);
        if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
      }
    } catch {
      /* corrupt payload — keep the seeds */
    }
    setReady(true);
  }, []);

  /* Persist on every change once hydrated. */
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ meetings, notifications }));
    } catch {
      /* storage full / disabled — the store still works in memory */
    }
  }, [ready, meetings, notifications]);

  const statusOf = useCallback((m: Meeting) => deriveMeetingStatus(m), []);

  const meetingsFor = useCallback((scope: MeetingScope) => [...visibleTo(meetings, scope)].sort(bySchedule), [meetings]);

  const notificationsFor = useCallback((scope: MeetingScope) => {
    const ids = new Set(visibleTo(meetings, scope).map((m) => m.id));
    return notifications.filter((n) => n.scope === scope && ids.has(n.meetingId));
  }, [meetings, notifications]);

  const upcomingFor = useCallback((scope: MeetingScope, limit = 4) =>
    visibleTo(meetings, scope)
      .filter((m) => !m.cancelled && m.date >= MEETING_TODAY)
      .sort(bySchedule)
      .slice(0, limit), [meetings]);

  const countsFor = useCallback((scope: MeetingScope) => {
    const base = { ...EMPTY_COUNTS };
    for (const m of visibleTo(meetings, scope)) base[deriveMeetingStatus(m)] += 1;
    return base;
  }, [meetings]);

  const getMeeting = useCallback((id: string) => meetings.find((m) => m.id === id), [meetings]);

  const createMeeting = useCallback((draft: MeetingDraft, scope: MeetingScope): Meeting => {
    seq.current += 1;
    const created: Meeting = {
      ...draft,
      id: `MTG-${seq.current}`,
      organizer: draft.organizer ?? MEETING_PERSONA[scope],
      createdAt: MEETING_TODAY,
    };
    setMeetings((prev) => [created, ...prev]);
    setNotifications((prev) => [
      {
        id: `MTN-NEW-${seq.current}`,
        meetingId: created.id,
        scope: scope === "admin" ? "teacher" : "student",
        kind: "invite",
        title: "New meeting scheduled",
        message: `${created.organizer.name} scheduled “${created.title}”.`,
        time: "Just now",
        read: false,
      },
      ...prev,
    ]);
    return created;
  }, []);

  const cancelMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, cancelled: true } : m)));
    setNotifications((prev) => prev.map((n) =>
      n.meetingId === id
        ? { ...n, kind: "cancelled" as const, title: "Meeting cancelled", time: "Just now", read: false }
        : n,
    ));
  }, []);

  const restoreMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, cancelled: false } : m)));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback((scope: MeetingScope) => {
    setNotifications((prev) => prev.map((n) => (n.scope === scope ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = useCallback(
    (scope: MeetingScope) => notifications.filter((n) => n.scope === scope && !n.read).length,
    [notifications],
  );

  const resetDemo = useCallback(() => {
    setMeetings(seedMeetings);
    setNotifications(seedMeetingNotifications);
  }, []);

  const value = useMemo<MeetingsContextValue>(() => ({
    ready, meetings, notifications, statusOf, meetingsFor, notificationsFor, upcomingFor, countsFor,
    getMeeting, createMeeting, cancelMeeting, restoreMeeting, markRead, markAllRead, unreadCount, resetDemo,
  }), [
    ready, meetings, notifications, statusOf, meetingsFor, notificationsFor, upcomingFor, countsFor,
    getMeeting, createMeeting, cancelMeeting, restoreMeeting, markRead, markAllRead, unreadCount, resetDemo,
  ]);

  return <MeetingsContext.Provider value={value}>{children}</MeetingsContext.Provider>;
}

export function useMeetings() {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error("useMeetings must be used inside <MeetingsProvider>");
  return ctx;
}
