"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  LoaderCircle,
  Clock,
  School,
  User,
  MapPin,
} from "lucide-react";
import {
  Btn,
  Card,
  CardHead,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  cn,
} from "@/components/ui";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { useBranch } from "@/lib/branch-context";
import {
  timetableApi,
  classesApi,
  employeesApi,
  subjectsApi,
  type TimetableSlotItem,
  type ClassItem,
  type EmployeeItem,
  type SubjectItem,
} from "@/lib/auth/api-client";
import { PERIODS, PERIOD_TIMES, WEEK_DAYS, TIMETABLE_SLOTS } from "@/lib/school-mock-data";

type Mode = "Class" | "Teacher" | "Room";
const MODES: Mode[] = ["Class", "Teacher", "Room"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Detect teacher / room / class double-bookings for the same day + period. */
function findConflicts(slots: TimetableSlotItem[]) {
  const conflicts: { slot: string; resource: string; kind: string }[] = [];
  const byCell = new Map<string, TimetableSlotItem[]>();

  for (const s of slots) {
    const key = `${s.day}·P${s.period}`;
    byCell.set(key, [...(byCell.get(key) ?? []), s]);
  }

  for (const [cell, group] of byCell) {
    if (group.length < 2) continue;

    // Check teacher double booking
    const teacherMap = new Map<string, number>();
    for (const s of group) {
      if (s.teacher) {
        teacherMap.set(s.teacher, (teacherMap.get(s.teacher) ?? 0) + 1);
      }
    }
    for (const [teacher, count] of teacherMap) {
      if (count > 1) {
        conflicts.push({ slot: cell, resource: teacher, kind: "Teacher" });
      }
    }

    // Check room double booking
    const roomMap = new Map<string, number>();
    for (const s of group) {
      if (s.room) {
        roomMap.set(s.room, (roomMap.get(s.room) ?? 0) + 1);
      }
    }
    for (const [room, count] of roomMap) {
      if (count > 1) {
        conflicts.push({ slot: cell, resource: room, kind: "Room" });
      }
    }

    // Check class double booking
    const classMap = new Map<string, number>();
    for (const s of group) {
      const clsKey = `${s.cls}-${s.section}`;
      classMap.set(clsKey, (classMap.get(clsKey) ?? 0) + 1);
    }
    for (const [clsKey, count] of classMap) {
      if (count > 1) {
        conflicts.push({ slot: cell, resource: clsKey, kind: "Class" });
      }
    }
  }

  return conflicts;
}

export default function TimetablePage() {
  const { currentBranchId } = useBranch();
  const [slots, setSlots] = useState<TimetableSlotItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Available options for dropdowns
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [teacherList, setTeacherList] = useState<EmployeeItem[]>([]);
  const [subjectList, setSubjectList] = useState<SubjectItem[]>([]);

  // Filtering mode
  const [mode, setMode] = useState<Mode>("Class");
  const [target, setTarget] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlotItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form Fields
  const [formDay, setFormDay] = useState("Monday");
  const [formPeriod, setFormPeriod] = useState(1);
  const [formStartTime, setFormStartTime] = useState("08:00 AM");
  const [formEndTime, setFormEndTime] = useState("08:45 AM");
  const [formClass, setFormClass] = useState("Class 10");
  const [formSection, setFormSection] = useState("A");
  const [formSubject, setFormSubject] = useState("Mathematics");
  const [formTeacher, setFormTeacher] = useState("");
  const [formRoom, setFormRoom] = useState("R-101");
  const [formError, setFormError] = useState("");

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsRes, classesRes, employeesRes, subjectsRes] = await Promise.allSettled([
        timetableApi.list({ branchId: currentBranchId === "all" ? undefined : currentBranchId }),
        classesApi.list({ branchId: currentBranchId === "all" ? undefined : currentBranchId }),
        employeesApi.list({ branchId: currentBranchId === "all" ? undefined : currentBranchId }),
        subjectsApi.list(),
      ]);

      if (slotsRes.status === "fulfilled") {
        setSlots(slotsRes.value.slots || []);
      }
      if (classesRes.status === "fulfilled") {
        setClassList(classesRes.value.classes || []);
      }
      if (employeesRes.status === "fulfilled") {
        setTeacherList(employeesRes.value.employees || []);
      }
      if (subjectsRes.status === "fulfilled") {
        setSubjectList(subjectsRes.value.subjects || []);
      }
    } catch (e) {
      console.error("Failed to load timetable data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranchId]);

  // Derived filter targets
  const targets = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) {
      const val =
        mode === "Class" ? `${s.cls}-${s.section}` : mode === "Teacher" ? s.teacher : s.room || "Unassigned";
      if (val) set.add(val);
    }

    // If targets from slots are empty, provide defaults from active DB models
    if (set.size === 0) {
      if (mode === "Class") {
        classList.forEach((c) => {
          const secs = Array.isArray(c.sections) && c.sections.length > 0 ? c.sections : ["A"];
          secs.forEach((sec) => set.add(`${c.name}-${sec}`));
        });
        if (set.size === 0) {
          set.add("Grade 10-A");
          set.add("Grade 9-B");
        }
      } else if (mode === "Teacher") {
        teacherList.forEach((t) => set.add(t.name));
        if (set.size === 0) {
          set.add("Bilal Raza");
          set.add("Ayesha Malik");
        }
      } else {
        set.add("R-101");
        set.add("R-102");
        set.add("Lab-1");
      }
    }

    return [...set].sort();
  }, [slots, mode, classList, teacherList]);

  const activeTarget = target && targets.includes(target) ? target : targets[0] ?? "";

  const matchesFilter = (s: TimetableSlotItem) => {
    if (!activeTarget) return true;
    const val =
      mode === "Class" ? `${s.cls}-${s.section}` : mode === "Teacher" ? s.teacher : s.room || "Unassigned";
    return val.toLowerCase() === activeTarget.toLowerCase();
  };

  const conflicts = useMemo(() => findConflicts(slots), [slots]);

  // Handle open modal for Create or Edit
  const handleOpenCreate = (dayStr?: string, periodNum?: number) => {
    setEditingSlot(null);
    setFormDay(dayStr || "Monday");
    const p = periodNum || 1;
    setFormPeriod(p);
    const times = PERIOD_TIMES[p as keyof typeof PERIOD_TIMES] || { start: "08:00", end: "08:45" };
    setFormStartTime(times.start);
    setFormEndTime(times.end);
    setFormClass(classList[0]?.name || "Class 10");
    const firstSec = classList[0]?.sections?.[0] || "A";
    setFormSection(firstSec);
    setFormSubject(subjectList[0]?.name || "Mathematics");
    setFormTeacher(teacherList[0]?.name || "Bilal Raza");
    setFormRoom("R-101");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: TimetableSlotItem) => {
    setEditingSlot(slot);
    setFormDay(slot.day || "Monday");
    setFormPeriod(slot.period || 1);
    setFormStartTime(slot.startTime || "08:00");
    setFormEndTime(slot.endTime || "08:45");
    setFormClass(slot.cls || "Class 10");
    setFormSection(slot.section || "A");
    setFormSubject(slot.subject || "Mathematics");
    setFormTeacher(slot.teacher || "");
    setFormRoom(slot.room || "R-101");
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle Save Slot
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClass || !formSection || !formSubject || !formTeacher) {
      setFormError("Class, Section, Subject, and Teacher are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        branchId: currentBranchId === "all" ? null : currentBranchId,
        cls: formClass.trim(),
        section: formSection.trim(),
        day: formDay,
        period: Number(formPeriod),
        startTime: formStartTime,
        endTime: formEndTime,
        subject: formSubject.trim(),
        teacher: formTeacher.trim(),
        room: formRoom.trim(),
      };

      if (editingSlot) {
        const res = await timetableApi.update(editingSlot.id, payload);
        setSlots((prev) => prev.map((s) => (s.id === res.slot.id ? res.slot : s)));
      } else {
        const res = await timetableApi.create(payload);
        setSlots((prev) => [...prev, res.slot]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save timetable slot.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Slot
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this timetable slot?")) return;
    try {
      await timetableApi.delete(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete slot.");
    }
  };

  // Handle Seed Initial Sample Timetable
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const defaultTeacher = teacherList[0]?.name || "Bilal Raza";
      const secondTeacher = teacherList[1]?.name || teacherList[0]?.name || "Ayesha Malik";

      const sampleSlots = [
        { cls: "Grade 10", section: "A", day: "Monday", period: 1, startTime: "08:00 AM", endTime: "08:45 AM", subject: "Mathematics", teacher: defaultTeacher, room: "R-101" },
        { cls: "Grade 10", section: "A", day: "Monday", period: 2, startTime: "08:45 AM", endTime: "09:30 AM", subject: "English", teacher: secondTeacher, room: "R-101" },
        { cls: "Grade 10", section: "A", day: "Monday", period: 3, startTime: "09:40 AM", endTime: "10:25 AM", subject: "Physics", teacher: defaultTeacher, room: "Lab-1" },
        { cls: "Grade 10", section: "A", day: "Tuesday", period: 1, startTime: "08:00 AM", endTime: "08:45 AM", subject: "Chemistry", teacher: secondTeacher, room: "Lab-2" },
        { cls: "Grade 10", section: "A", day: "Tuesday", period: 2, startTime: "08:45 AM", endTime: "09:30 AM", subject: "Mathematics", teacher: defaultTeacher, room: "R-101" },
        { cls: "Grade 9", section: "B", day: "Monday", period: 1, startTime: "08:00 AM", endTime: "08:45 AM", subject: "Urdu", teacher: secondTeacher, room: "R-102" },
        { cls: "Grade 9", section: "B", day: "Wednesday", period: 2, startTime: "08:45 AM", endTime: "09:30 AM", subject: "Science", teacher: defaultTeacher, room: "R-102" },
      ];

      for (const s of sampleSlots) {
        await timetableApi.create({
          branchId: currentBranchId === "all" ? null : currentBranchId,
          ...s,
        });
      }
      await loadData();
    } catch (err: any) {
      alert("Failed to seed timetable: " + (err.message || "error"));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Timetable Management"
        subtitle="Period-wise and time-wise weekly schedule with conflict detection, branch filtering, and teacher allocation."
        actions={
          <div className="flex items-center gap-2">
            {slots.length === 0 && (
              <Btn variant="secondary" Icon={seeding ? LoaderCircle : Sparkles} onClick={handleSeed} disabled={seeding}>
                {seeding ? "Seeding..." : "Seed Default Timetable"}
              </Btn>
            )}
            <Btn variant="primary" Icon={Plus} onClick={() => handleOpenCreate()}>
              Add Period Slot
            </Btn>
          </div>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        <BranchScopeBar count={slots.length} noun="scheduled periods" />

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
          <StatCard label="Total Slots" value={slots.length} Icon={CalendarClock} tone="blue" sub="Scheduled" />
          <StatCard label="Classes Covered" value={new Set(slots.map((s) => `${s.cls}-${s.section}`)).size} Icon={School} tone="purple" />
          <StatCard label="Teachers Assigned" value={new Set(slots.map((s) => s.teacher)).size} Icon={User} tone="green" />
          <StatCard label="Conflicts" value={conflicts.length} Icon={AlertTriangle} tone={conflicts.length ? "red" : "gray"} sub={conflicts.length ? "Double booked" : "All clear"} />
        </div>

        {/* VIEW & TARGET FILTER BAR */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
          <label className="flex items-center gap-2 text-[13px] font-medium text-[var(--theme-text-muted)]">
            View By:
            <Select
              options={MODES}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as Mode);
                setTarget("");
              }}
              className="w-36"
            />
          </label>

          <label className="flex items-center gap-2 text-[13px] font-medium text-[var(--theme-text-muted)]">
            Selected {mode}:
            <Select
              options={targets}
              value={activeTarget}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={`All ${mode.toLowerCase()}s`}
              className="w-60"
            />
          </label>
        </div>

        {/* CONFLICT WARNING CARD */}
        {conflicts.length > 0 && (
          <Card pad={false} className="mb-5 border-l-4 border-l-[var(--theme-danger)]">
            <CardHead
              Icon={AlertTriangle}
              title={`${conflicts.length} Scheduling Conflicts Detected`}
              subtitle="Resolve double bookings before publishing the timetable."
            />
            <div className="p-4">
              <ul className="grid gap-2 sm:grid-cols-2">
                {conflicts.map((c, i) => (
                  <li
                    key={`${c.slot}-${c.kind}-${c.resource}-${i}`}
                    className="flex items-start gap-2 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>{c.kind} double-booked:</strong> {c.resource} at {c.slot.replace("·P", " · Period ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {/* WEEKLY PERIOD GRID */}
        <Card pad={false}>
          <CardHead
            Icon={CalendarClock}
            title={`${mode} Timetable — ${activeTarget || "All"}`}
            subtitle="Period-wise and time-wise weekly grid view."
            right={
              <span className="rounded-full bg-[var(--theme-primary-soft)] px-3 py-1 text-[12px] font-medium text-[var(--theme-primary-hover)]">
                {slots.filter(matchesFilter).length} Periods
              </span>
            }
          />

          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-[14px] text-[var(--theme-text-muted)]">
              <LoaderCircle className="h-5 w-5 animate-spin text-[var(--theme-primary)]" /> Loading timetable...
            </div>
          ) : (
            <div className="overflow-x-auto p-3">
              <table className="w-full min-w-[850px] border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="w-32 border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
                      Period & Time
                    </th>
                    {DAYS.map((d) => (
                      <th
                        key={d}
                        className="border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((p) => {
                    const times = PERIOD_TIMES[p] || { start: "00:00", end: "00:00" };
                    return (
                      <tr key={p}>
                        {/* PERIOD COLUMN */}
                        <td className="border border-[var(--theme-border)] bg-[var(--theme-subtle)]/30 px-3 py-2.5 align-top">
                          <p className="font-bold text-[var(--theme-text)]">Period {p}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--theme-text-faint)]">
                            <Clock className="h-3 w-3" />
                            {times.start} - {times.end}
                          </p>
                        </td>

                        {/* DAY CELLS */}
                        {DAYS.map((d) => {
                          const cellSlots = slots.filter((s) => s.day === d && s.period === p && matchesFilter(s));
                          const hasConflict = cellSlots.length > 1;

                          return (
                            <td
                              key={d}
                              className={cn(
                                "border border-[var(--theme-border)] px-2 py-2 align-top transition-colors hover:bg-[var(--theme-subtle)]/20",
                                hasConflict && "bg-[var(--theme-danger-soft)]/50"
                              )}
                            >
                              {cellSlots.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCreate(d, p)}
                                  className="group flex h-14 w-full items-center justify-center rounded border border-dashed border-transparent hover:border-[var(--theme-border)] hover:bg-[var(--theme-surface)]"
                                >
                                  <Plus className="h-4 w-4 text-[var(--theme-text-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                              ) : (
                                <div className="space-y-1.5">
                                  {cellSlots.map((s) => (
                                    <div
                                      key={s.id}
                                      className="group relative rounded-lg border border-[var(--theme-border)] bg-[var(--theme-primary-soft)]/30 p-2 shadow-xs transition-all hover:border-[var(--theme-primary)] hover:shadow-sm"
                                    >
                                      <div className="flex items-start justify-between gap-1">
                                        <p className="font-semibold text-[var(--theme-primary-hover)]">
                                          {s.subject}
                                        </p>
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEdit(s)}
                                            className="rounded p-0.5 text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-primary)]"
                                            title="Edit Slot"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(s.id)}
                                            className="rounded p-0.5 text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-danger)]"
                                            title="Delete Slot"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <p className="mt-1 text-[12px] font-medium text-[var(--theme-text)]">
                                        {mode === "Teacher" ? `${s.cls}-${s.section}` : s.teacher}
                                      </p>
                                      <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--theme-text-muted)]">
                                        <span>{mode === "Class" ? `${s.cls}-${s.section}` : s.room || "No Room"}</span>
                                        <span>{s.startTime || times.start}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* CREATE / EDIT TIMETABLE SLOT MODAL */}
      <Modal
        open={isModalOpen}
        title={editingSlot ? "Edit Period Slot" : "Add Period Slot"}
        onClose={() => setIsModalOpen(false)}
      >
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[13px] text-[var(--theme-danger-text)]">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Day">
                <Select
                  options={DAYS}
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value)}
                />
              </Field>

              <Field label="Period Number">
                <Select
                  options={PERIODS.map((p) => `Period ${p}`)}
                  value={`Period ${formPeriod}`}
                  onChange={(e) => {
                    const pNum = Number(e.target.value.replace("Period ", ""));
                    setFormPeriod(pNum);
                    const times = PERIOD_TIMES[pNum as keyof typeof PERIOD_TIMES] || { start: "08:00 AM", end: "08:45 AM" };
                    setFormStartTime(times.start);
                    setFormEndTime(times.end);
                  }}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time">
                <Input
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  placeholder="e.g. 08:00 AM"
                />
              </Field>

              <Field label="End Time">
                <Input
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  placeholder="e.g. 08:45 AM"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Class">
                {classList.length > 0 ? (
                  <Select
                    options={Array.from(new Set(classList.map((c) => c.name)))}
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                  />
                ) : (
                  <Input
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="e.g. Grade 10"
                  />
                )}
              </Field>

              <Field label="Section">
                <Input
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject">
                {subjectList.length > 0 ? (
                  <Select
                    options={subjectList.map((s) => s.name)}
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  />
                ) : (
                  <Input
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                )}
              </Field>

              <Field label="Teacher">
                {teacherList.length > 0 ? (
                  <Select
                    options={teacherList.map((t) => t.name)}
                    value={formTeacher || teacherList[0]?.name || ""}
                    onChange={(e) => setFormTeacher(e.target.value)}
                  />
                ) : (
                  <Input
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="e.g. Bilal Raza"
                  />
                )}
              </Field>
            </div>

            <Field label="Room / Hall Number">
              <Input
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                placeholder="e.g. R-101 or Science Lab 1"
              />
            </Field>

            <div className="mt-6 flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving..." : editingSlot ? "Update Slot" : "Create Slot"}
              </Btn>
            </div>
          </form>
        </Modal>
      </>
    );
  }
