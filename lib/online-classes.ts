import type { OnlineClassItem } from "@/lib/auth/api-client";

export const ONLINE_CLASS_STATUS_COLORS: Record<string, string> = {
  Scheduled: "var(--theme-info)",
  Live: "var(--theme-warning)",
  Completed: "var(--theme-success)",
  Cancelled: "var(--theme-danger)",
};

export function formatOnlineClassWhen(iso: string, timezone = "Asia/Karachi") {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function onlineClassSearchText(row: OnlineClassItem) {
  return `${row.title} ${row.cls} ${row.section} ${row.subjectName} ${row.teacherName} ${row.status}`;
}

export function isTodayInTz(iso: string, timezone = "Asia/Karachi") {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
    return fmt.format(new Date(iso)) === fmt.format(new Date());
  } catch {
    return false;
  }
}
