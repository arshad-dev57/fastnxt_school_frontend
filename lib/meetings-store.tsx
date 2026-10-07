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
  addMinutesToClock,
  type Meeting, type MeetingNotification, type MeetingOrganizer, type MeetingScope, type MeetingStatus,
  type MeetingMode, type MeetingPlatform, type ParticipantKind, type MeetingParticipant,
} from "@/lib/meetings-data";
import { meetingsApi, type MeetingItem } from "@/lib/auth/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";

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
  refreshMeetings: () => Promise<void>;
};

const MeetingsContext = createContext<MeetingsContextValue | null>(null);

const EMPTY_COUNTS: Record<MeetingStatus, number> = {
  Live: 0, Today: 0, Upcoming: 0, Completed: 0, Cancelled: 0,
};

/** Convert backend API MeetingItem to frontend Meeting model */
export function mapBackendToMeeting(item: MeetingItem): Meeting {
  let dateStr = item.date || "";
  if (dateStr.includes("T")) dateStr = dateStr.split("T")[0];
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date();
    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  let startTime = item.time || "09:00";
  if (startTime.includes("AM") || startTime.includes("PM")) {
    const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const period = match[3].toUpperCase();
      if (period === "PM" && h < 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      startTime = `${String(h).padStart(2, "0")}:${m}`;
    }
  }

  const venue = item.venue || "";
  const venueLower = venue.toLowerCase();
  let mode: MeetingMode = "physical";
  let platform: MeetingPlatform = "In-person";
  let link: string | undefined = undefined;
  let room: string | undefined = undefined;

  if (venueLower.includes("zoom")) {
    mode = "online";
    platform = "Zoom";
  } else if (venueLower.includes("meet") || venueLower.includes("google")) {
    mode = "online";
    platform = "Google Meet";
  } else if (venueLower.includes("teams")) {
    mode = "online";
    platform = "Microsoft Teams";
  } else if (venueLower.includes("http://") || venueLower.includes("https://")) {
    mode = "online";
    platform = "Other";
  } else if (venueLower.includes("hybrid")) {
    mode = "hybrid";
  }

  const urlMatch = venue.match(/(https?:\/\/[^\s]+)/gi);
  if (urlMatch && urlMatch.length > 0) {
    link = urlMatch[0];
  }

  if (mode !== "online") {
    room = venue || "Main Campus";
  } else {
    room = "Online Session";
  }

  const rawParts = Array.isArray(item.participants) ? item.participants : [];
  const participantsList: MeetingParticipant[] = rawParts.map((pStr, idx) => {
    let name = pStr;
    let sub = "Participant";
    let kind: ParticipantKind = "teacher";

    if (pStr.startsWith("Staff:") || pStr.startsWith("Teacher:")) {
      kind = "teacher";
      name = pStr.replace(/^(Staff:|Teacher:)\s*/, "");
    } else if (pStr.startsWith("Student:") || pStr.startsWith("Class:")) {
      kind = "student";
      name = pStr.replace(/^(Student:|Class:)\s*/, "");
    }

    return {
      id: `p-${item.id}-${idx}`,
      name,
      kind,
      sub: pStr.includes("Dept:") ? pStr : "Staff",
    };
  });

  if (participantsList.length === 0) {
    participantsList.push({
      id: `p-${item.id}-all`,
      name: "All Staff & Teachers",
      kind: "teacher",
      sub: "All Staff",
    });
  }

  const isStudentAudience = rawParts.some(
    (p) => p.toLowerCase().includes("student") || p.toLowerCase().includes("class:")
  );

  return {
    id: item.id,
    title: item.title,
    agenda: item.description || item.title,
    type: item.description?.toLowerCase().includes("ptm") ? "Parent–Teacher Meeting" : "Staff Briefing",
    scope: isStudentAudience ? "student" : "teacher",
    audience: isStudentAudience ? "students" : "teachers",
    organizer: {
      id: "organizer-admin",
      name: item.organizer || "Admin",
      role: "Organizer",
    },
    date: dateStr,
    start: startTime,
    end: addMinutesToClock(startTime, 45),
    mode,
    platform,
    link,
    room,
    participants: participantsList,
    cancelled: item.status === "Cancelled",
    createdAt: item.createdAt || dateStr,
  };
}

/** Who sees what — single source of truth for per-panel visibility. */
export function visibleTo(
  meetings: Meeting[],
  scope: MeetingScope,
  currentUser?: { name?: string; email?: string } | null
): Meeting[] {
  if (scope === "admin") return meetings;

  if (scope === "teacher") {
    const teacherName = (currentUser?.name || "").toLowerCase();
    const teacherEmail = (currentUser?.email || "").toLowerCase();

    return meetings.filter((m) => {
      // Exclude student-only meetings
      if (m.scope === "student" && m.audience === "students") return false;

      // If no participants, default to visible for teachers
      if (!m.participants || m.participants.length === 0) return true;

      const pStrAll = m.participants.map((p) => `${p.name} ${p.sub}`.toLowerCase()).join(" ");

      // Match all staff sentinels or teacher audience
      if (
        pStrAll.includes("all staff") ||
        pStrAll.includes("all teacher") ||
        pStrAll.includes("all staff & teachers") ||
        pStrAll.includes("staff briefing") ||
        m.audience === "teachers" ||
        m.scope === "teacher"
      ) {
        return true;
      }

      // Match teacher name or email
      if (teacherName && pStrAll.includes(teacherName)) return true;
      if (teacherEmail && pStrAll.includes(teacherEmail)) return true;

      return true;
    });
  }

  // Student scope
  return meetings.filter((m) => m.scope === "student" || m.audience === "students");
}

const bySchedule = (a: Meeting, b: Meeting) =>
  a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date);

export function MeetingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<MeetingNotification[]>(seedMeetingNotifications);
  const [ready, setReady] = useState(false);
  const seq = useRef(2000);

  const refreshMeetings = useCallback(async () => {
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await meetingsApi.list({ branchId: branchScope });
      if (res && Array.isArray(res.meetings)) {
        const backendMeetings = res.meetings.map(mapBackendToMeeting);
        setMeetings(backendMeetings);
      }
    } catch (err) {
      console.error("Failed to fetch meetings from API", err);
    }
  }, [currentBranchId]);

  /* Hydration from API */
  useEffect(() => {
    setReady(true);
    refreshMeetings();
  }, [refreshMeetings]);

  /* Refresh meetings when branch changes */
  useEffect(() => {
    if (ready) {
      refreshMeetings();
    }
  }, [currentBranchId, ready, refreshMeetings]);

  /* Persist on change */
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ meetings, notifications }));
    } catch {
      /* storage full / disabled */
    }
  }, [ready, meetings, notifications]);

  const statusOf = useCallback((m: Meeting) => deriveMeetingStatus(m), []);

  const meetingsFor = useCallback(
    (scope: MeetingScope) => [...visibleTo(meetings, scope, user)].sort(bySchedule),
    [meetings, user]
  );

  const notificationsFor = useCallback(
    (scope: MeetingScope) => {
      const ids = new Set(visibleTo(meetings, scope, user).map((m) => m.id));
      return notifications.filter((n) => n.scope === scope && ids.has(n.meetingId));
    },
    [meetings, notifications, user]
  );

  const upcomingFor = useCallback(
    (scope: MeetingScope, limit = 4) =>
      visibleTo(meetings, scope, user)
        .filter((m) => !m.cancelled && m.date >= MEETING_TODAY)
        .sort(bySchedule)
        .slice(0, limit),
    [meetings, user]
  );

  const countsFor = useCallback(
    (scope: MeetingScope) => {
      const base = { ...EMPTY_COUNTS };
      for (const m of visibleTo(meetings, scope, user)) base[deriveMeetingStatus(m)] += 1;
      return base;
    },
    [meetings, user]
  );

  const getMeeting = useCallback((id: string) => meetings.find((m) => m.id === id), [meetings]);

  const createMeeting = useCallback(
    (draft: MeetingDraft, scope: MeetingScope): Meeting => {
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
    },
    []
  );

  const cancelMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, cancelled: true } : m)));
    setNotifications((prev) =>
      prev.map((n) =>
        n.meetingId === id
          ? { ...n, kind: "cancelled" as const, title: "Meeting cancelled", time: "Just now", read: false }
          : n
      )
    );
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
    [notifications]
  );

  const resetDemo = useCallback(() => {
    setMeetings(seedMeetings);
    setNotifications(seedMeetingNotifications);
  }, []);

  const value = useMemo<MeetingsContextValue>(
    () => ({
      ready,
      meetings,
      notifications,
      statusOf,
      meetingsFor,
      notificationsFor,
      upcomingFor,
      countsFor,
      getMeeting,
      createMeeting,
      cancelMeeting,
      restoreMeeting,
      markRead,
      markAllRead,
      unreadCount,
      resetDemo,
      refreshMeetings,
    }),
    [
      ready,
      meetings,
      notifications,
      statusOf,
      meetingsFor,
      notificationsFor,
      upcomingFor,
      countsFor,
      getMeeting,
      createMeeting,
      cancelMeeting,
      restoreMeeting,
      markRead,
      markAllRead,
      unreadCount,
      resetDemo,
      refreshMeetings,
    ]
  );

  return <MeetingsContext.Provider value={value}>{children}</MeetingsContext.Provider>;
}

export function useMeetings() {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error("useMeetings must be used inside <MeetingsProvider>");
  return ctx;
}

