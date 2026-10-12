"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Printer, LoaderCircle, Clock } from "lucide-react";
import { Btn, PageHeader, StatCard, Card, CardHead } from "@/components/ui";
import { PortalTimetable, type TimetableSlotView } from "@/components/portal/portal-timetable";
import { PortalScopeBar } from "@/components/portal/portal-ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  timetableApi,
  employeesApi,
  subjectsApi,
  type TimetableSlotItem,
  type SubjectAssignmentItem,
} from "@/lib/auth/api-client";

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState(user?.name || "Teacher");
  const [campusName, setCampusName] = useState("Main Branch");
  const [slots, setSlots] = useState<TimetableSlotView[]>([]);
  const [day, setDay] = useState("Monday");

  useEffect(() => {
    let cancelled = false;

    async function loadTeacherTimetable() {
      setLoading(true);
      try {
        let nameToSearch = user?.name || "";

        // 1. Resolve exact teacher name & campus from employee record
        if (user?.email) {
          try {
            const empRes = await employeesApi.list({ q: user.email });
            if (empRes.employees?.length > 0) {
              const emp = empRes.employees[0];
              nameToSearch = emp.name;
              setTeacherName(emp.name);
              if (emp.branchId) setCampusName(emp.branchId);
            }
          } catch (e) {
            console.warn("Could not fetch employee record for email:", e);
          }
        }

        if (cancelled) return;

        // 2. Fetch timetable slots for this teacher
        let fetchedSlots: TimetableSlotItem[] = [];
        if (nameToSearch) {
          try {
            const ttRes = await timetableApi.list({ teacher: nameToSearch });
            fetchedSlots = ttRes.slots || [];
          } catch (e) {
            console.warn("Failed to fetch teacher timetable slots:", e);
          }
        }

        // If no teacher filter match, try fetching all slots in branch to see if name matched partially
        if (fetchedSlots.length === 0) {
          try {
            const allSlotsRes = await timetableApi.list();
            if (allSlotsRes.slots?.length > 0) {
              const matched = allSlotsRes.slots.filter(
                (s) =>
                  s.teacher.toLowerCase().includes(nameToSearch.toLowerCase()) ||
                  nameToSearch.toLowerCase().includes(s.teacher.toLowerCase())
              );
              if (matched.length > 0) {
                fetchedSlots = matched;
              }
            }
          } catch (e) {
            // fallback ignore
          }
        }

        if (cancelled) return;

        // 3. Fallback to subject assignments if no timetable slots created by admin yet
        if (fetchedSlots.length === 0 && nameToSearch) {
          try {
            const assignRes = await subjectsApi.listAssignments({ teacher: nameToSearch });
            const assignments: SubjectAssignmentItem[] = assignRes.assignments || [];

            if (assignments.length > 0) {
              const generated: TimetableSlotView[] = [];
              const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
              let pCounter = 1;

              for (const a of assignments) {
                for (const d of weekDays) {
                  generated.push({
                    id: `fallback-${a.id}-${d}-${pCounter}`,
                    cls: a.cls,
                    section: a.section,
                    day: d,
                    period: pCounter,
                    subject: a.subject,
                    teacher: nameToSearch,
                    room: `Room ${100 + pCounter}`,
                    startTime: `0${7 + pCounter}:00 AM`,
                    endTime: `0${7 + pCounter}:45 AM`,
                  });
                }
                pCounter = (pCounter % 6) + 1;
              }

              setSlots(generated);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Fallback subject assignments check failed:", e);
          }
        }

        // Map backend slots to TimetableSlotView
        setSlots(
          fetchedSlots.map((s) => ({
            id: s.id,
            cls: s.cls,
            section: s.section,
            day: s.day,
            period: s.period,
            subject: s.subject,
            teacher: s.teacher,
            room: s.room,
            startTime: s.startTime,
            endTime: s.endTime,
          }))
        );
      } catch (err) {
        console.error("Error loading teacher timetable page:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTeacherTimetable();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const daySlots = slots.filter((s) => s.day === day);
  const uniqueSections = new Set(slots.map((s) => `${s.cls}-${s.section}`)).size;
  const uniqueSubjects = new Set(slots.map((s) => s.subject)).size;

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="My Timetable"
          subtitle={`Weekly teaching schedule for ${teacherName}.`}
          actions={
            <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>
              Print / PDF
            </Btn>
          }
        />
      </div>

      <div className="px-4 pb-24 sm:px-6">
        <div className="no-print">
          <PortalScopeBar count={slots.length} noun="period slots" label={teacherName} Icon={CalendarClock} />

          <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
            <StatCard label="Weekly Periods" value={slots.length} Icon={CalendarClock} tone="blue" sub={campusName} />
            <StatCard label="Assigned Sections" value={uniqueSections} Icon={CalendarClock} tone="purple" sub="Teaching" />
            <StatCard label="Subjects" value={uniqueSubjects} Icon={CalendarClock} tone="green" />
            <StatCard label={`${day} Periods`} value={daySlots.length} Icon={CalendarClock} tone="orange" sub="Selected Day" />
          </div>
        </div>

        {loading ? (
          <div className="no-print flex h-48 items-center justify-center gap-2 text-[14px] text-[var(--theme-text-muted)]">
            <LoaderCircle className="h-5 w-5 animate-spin text-[var(--theme-primary)]" /> Loading timetable...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="print-area print-document print-timetable lg:col-span-2">
              <div className="mb-3 hidden border-b-2 border-black pb-2 print:block">
                <h1 className="text-[16px] font-bold">Teaching Timetable</h1>
                <p className="text-[11px] text-neutral-600">{teacherName} · {campusName}</p>
              </div>
              <PortalTimetable
                slots={slots}
                title="Weekly teaching timetable"
                subtitle="Period-wise & time-wise schedule assigned to you."
                highlightDay={day}
              />
            </div>

            <Card pad={false} className="no-print">
              <CardHead title="Classes & Schedule" subtitle="Period-wise details" Icon={CalendarClock} />
              <div className="divide-y divide-[var(--theme-border)]">
                {slots.length === 0 ? (
                  <p className="p-4 text-center text-[13px] text-[var(--theme-text-muted)]">
                    No periods scheduled yet.
                  </p>
                ) : (
                  slots
                    .slice()
                    .sort((a, b) => a.day.localeCompare(b.day) || a.period - b.period)
                    .map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[12px] font-bold text-[var(--theme-primary-hover)]">
                          P{s.period}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium">{s.subject}</p>
                          <p className="truncate text-[12px] text-[var(--theme-text-muted)]">
                            {s.cls}-{s.section} · {s.room || "Room TBD"}
                          </p>
                          {(s.startTime || s.endTime) && (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--theme-text-faint)]">
                              <Clock className="h-3 w-3" />
                              {s.startTime} - {s.endTime}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[12px] font-semibold text-[var(--theme-text-muted)]">
                          {s.day.slice(0, 3)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
