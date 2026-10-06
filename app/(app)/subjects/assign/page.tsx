"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, BookOpen, Trash2, UserCheck, School, ClipboardList, Filter, Layers, RefreshCw } from "lucide-react";
import {
  Avatar, Badge, Btn, EmptyState, Field, RowMenu, Select, Td, Th, ToolbarBtn, cn, ConfirmDialog,
} from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, BarCell, GroupHead, GroupTable,
} from "@/components/board";
import {
  classesApi,
  subjectsApi,
  type ClassItem,
  type TeacherOption,
  type SubjectItem,
  type SubjectAssignmentItem,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const PALETTE = [
  "var(--theme-info)",
  "var(--theme-accent-2)",
  "var(--theme-success)",
  "#FF158A",
  "var(--theme-warning)",
  "var(--theme-success-text)",
];
const COLS = "grid-cols-[44px_110px_minmax(180px,1.4fr)_minmax(160px,1fr)_150px_64px]";

export default function AssignSubjectsPage() {
  const { currentBranchId } = useBranch();

  // Reference data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  // Assignments
  const [list, setList] = useState<SubjectAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [toDelete, setToDelete] = useState<SubjectAssignmentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load all dependencies
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      const [classesRes, subjectsRes, teachersRes, assignmentsRes] = await Promise.all([
        classesApi.list({ branchId: branchScope }),
        subjectsApi.list({ branchId: branchScope }),
        classesApi.listTeachers(branchScope),
        subjectsApi.listAssignments({ branchId: branchScope }),
      ]);

      const loadedClasses = classesRes.classes || [];
      setClasses(loadedClasses);
      setSubjects(subjectsRes.subjects || []);
      setTeachers(teachersRes.teachers || []);
      setList(assignmentsRes.assignments || []);

      // Check query param for default class
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const prefillClass = urlParams.get("class");
        if (prefillClass && loadedClasses.some((c) => c.name === prefillClass)) {
          setCls(prefillClass);
          const found = loadedClasses.find((c) => c.name === prefillClass);
          if (found && found.sections?.length > 0) {
            setSection(found.sections[0]);
          }
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load assignment page data:", err);
      setError(err instanceof Error ? err.message : "Failed to load page data.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived sections based on selected class
  const availableSections = useMemo(() => {
    if (!cls) return ["A", "B", "C", "D"];
    const found = classes.find((c) => c.name === cls);
    return found && found.sections?.length > 0 ? found.sections : ["A"];
  }, [cls, classes]);

  // When class changes, adjust section
  const handleClassChange = (selectedClassName: string) => {
    setCls(selectedClassName);
    const found = classes.find((c) => c.name === selectedClassName);
    if (found && found.sections?.length > 0) {
      setSection(found.sections[0]);
    } else {
      setSection("A");
    }
    // Auto-suggest teacher if class has an assigned teacher
    if (found?.teacher && found.teacher !== "Unassigned" && !teacher) {
      setTeacher(found.teacher);
    }
  };

  const canAssign = !!(cls && section && subject && teacher);

  const handleAssign = async () => {
    if (!canAssign) return;
    try {
      setSubmitting(true);
      const selectedClass = classes.find((c) => c.name === cls);
      const selectedSubject = subjects.find((s) => s.name === subject);
      const selectedTeacher = teachers.find((t) => t.name === teacher);

      const res = await subjectsApi.createAssignment({
        cls,
        section,
        subject,
        teacher,
        classId: selectedClass?.id,
        subjectId: selectedSubject?.id,
        teacherId: selectedTeacher?.id,
        branchId: currentBranchId || undefined,
      });

      // Update state without full page refresh
      setList((p) => [res.assignment, ...p.filter((a) => a.id !== res.assignment.id)]);
      setSubject("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to assign subject.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await subjectsApi.deleteAssignment(toDelete.id);
      setList((p) => p.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove assignment.");
    } finally {
      setDeleting(false);
    }
  };

  const classTabs = useMemo(() => ["All", ...Array.from(new Set(list.map((a) => a.cls)))], [list]);

  const byClass = useMemo(() => {
    const filtered = list
      .filter((a) => tab === "All" || a.cls === tab)
      .filter(
        (a) =>
          q === "" ||
          a.subject.toLowerCase().includes(q.toLowerCase()) ||
          a.teacher.toLowerCase().includes(q.toLowerCase()) ||
          a.cls.toLowerCase().includes(q.toLowerCase())
      );
    return Array.from(new Set(filtered.map((a) => a.cls))).map((name, i) => ({
      cls: name,
      color: PALETTE[i % PALETTE.length],
      items: filtered.filter((a) => a.cls === name),
    }));
  }, [list, tab, q]);

  const total = byClass.reduce((n, g) => n + g.items.length, 0);

  const classOptions = classes.map((c) => c.name);
  const subjectOptions = subjects.map((s) => s.name);
  const teacherOptions = Array.from(
    new Set([
      ...teachers.map((t) => t.name),
      ...classes.map((c) => c.teacher).filter((t): t is string => Boolean(t && t !== "Unassigned")),
    ])
  );

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={ClipboardList}
          title="Assign Subjects"
          subtitle="Link subjects to classes, sections and subject teachers."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                title="Refresh"
                aria-label="Refresh assignments"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Link
                href="/subjects/classes"
                className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <School className="h-[18px] w-[18px]" /> Classes Overview
              </Link>
            </div>
          }
        />
        <BoardTabs tabs={classTabs} value={tab} onChange={setTab} />
        <BoardToolbar>
          <BoardSearch value={q} onChange={setQ} placeholder="Search subject, teacher or class" className="ml-0" />
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {error && (
          <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        {/* NEW ASSIGNMENT PANEL */}
        <div className="overflow-hidden rounded-l border-y border-r border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm">
          <div className="p-3 sm:p-4" style={{ borderLeft: "6px solid var(--theme-primary)" }}>
            <div className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
              <ClipboardList className="h-[18px] w-[18px] text-[var(--theme-primary)]" /> New assignment
              <span className="text-[13px] font-normal text-[var(--theme-text-muted)]">
                Select class, section, subject and teacher from database
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Class *">
                <Select
                  options={classOptions}
                  value={cls}
                  onChange={(e) => handleClassChange(e.target.value)}
                  placeholder={loading ? "Loading classes..." : classOptions.length > 0 ? "Select class" : "No classes found"}
                  disabled={loading || classOptions.length === 0}
                />
              </Field>
              <Field label="Section *">
                <Select
                  options={availableSections}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Select section"
                />
              </Field>
              <Field label="Subject *">
                <Select
                  options={subjectOptions}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={loading ? "Loading subjects..." : subjectOptions.length > 0 ? "Select subject" : "No subjects found"}
                  disabled={loading || subjectOptions.length === 0}
                />
              </Field>
              <Field label="Subject Teacher *">
                <Select
                  options={teacherOptions}
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder={loading ? "Loading teachers..." : teacherOptions.length > 0 ? "Select teacher" : "No teachers found"}
                  disabled={loading || teacherOptions.length === 0}
                />
              </Field>
              <div className="flex flex-col justify-end">
                <Btn
                  variant="primary"
                  Icon={Plus}
                  className="w-full"
                  disabled={!canAssign || submitting}
                  onClick={handleAssign}
                >
                  {submitting ? "Assigning..." : "Assign Subject"}
                </Btn>
                {!canAssign && (
                  <p className="mt-1 text-[12px] text-[var(--theme-text-faint)]">Fill all fields to enable.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Mini
            label="Assignments"
            value={list.length}
            Icon={ClipboardList}
            color="var(--theme-primary)"
            soft="var(--theme-primary-soft)"
          />
          <Mini
            label="Classes covered"
            value={new Set(list.map((a) => a.cls)).size}
            Icon={School}
            color="var(--theme-success)"
            soft="var(--theme-success-soft)"
          />
          <Mini
            label="Teachers involved"
            value={new Set(list.map((a) => a.teacher)).size}
            Icon={UserCheck}
            color="var(--theme-accent-2)"
            soft="var(--theme-accent-soft)"
          />
        </div>

        {loading && (
          <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--theme-primary)]" />
            Loading assignments...
          </div>
        )}

        {/* ASSIGNED SUBJECTS — grouped by class */}
        {!loading && total === 0 && (
          <div className="mt-6">
            <EmptyState
              Icon={BookOpen}
              title="No assignments yet"
              message="Use the form above to assign curriculum subjects to classes and teachers."
            />
          </div>
        )}

        {!loading && total > 0 && (
          <div className="mt-6 space-y-8 md:min-w-[760px]">
            {byClass.map((g) => (
              <section key={g.cls}>
                <GroupHead title={g.cls} color={g.color} count={g.items.length} />

                {/* DESKTOP TABLE */}
                <div className="hidden md:block">
                  <GroupTable>
                    <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                      <div className="border-l-[6px]" style={{ borderColor: g.color }} />
                      <Th className="border-l border-[var(--theme-border)]">Section</Th>
                      <Th className="border-l border-[var(--theme-border)]">Subject</Th>
                      <Th className="border-l border-[var(--theme-border)]">Teacher</Th>
                      <Th className="border-l border-[var(--theme-border)]">Assigned Date</Th>
                      <Th className="border-l border-[var(--theme-border)]">
                        <span className="sr-only">Actions</span>
                      </Th>
                    </div>
                    {g.items.map((a) => (
                      <div
                        key={a.id}
                        className={cn(
                          "row grid",
                          COLS,
                          "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]"
                        )}
                      >
                        <BarCell color={g.color} className="py-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]">
                            <BookOpen className="h-4 w-4" />
                          </span>
                        </BarCell>
                        <Td className="border-l border-[var(--theme-border)]">
                          <Badge label={`Sec ${a.section}`} tone="gray" />
                        </Td>
                        <Td className="gap-2 border-l border-[var(--theme-border)] font-medium">
                          <BookOpen className="h-4 w-4 shrink-0 text-[var(--theme-accent-strong)]" />
                          <span className="truncate">{a.subject}</span>
                        </Td>
                        <Td className="gap-2 border-l border-[var(--theme-border)]">
                          <Avatar name={a.teacher} size={28} />
                          <span className="truncate">{a.teacher}</span>
                        </Td>
                        <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)] text-[13px]">
                          <span className="rounded-full border border-[var(--theme-border)] px-2.5 py-0.5">
                            {a.date}
                          </span>
                        </Td>
                        <Td className="justify-center border-l border-[var(--theme-border)]">
                          <RowMenu
                            items={[
                              {
                                label: "Remove",
                                Icon: Trash2,
                                danger: true,
                                onClick: () => setToDelete(a),
                              },
                            ]}
                          />
                        </Td>
                      </div>
                    ))}
                  </GroupTable>
                </div>

                {/* MOBILE CARDS */}
                <div className="space-y-3 md:hidden">
                  {g.items.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm"
                      style={{ borderLeft: `6px solid ${g.color}` }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium">{a.subject}</p>
                          <p className="text-[13px] text-[var(--theme-text-muted)]">
                            {a.cls} (Section {a.section}) · {a.date}
                          </p>
                        </div>
                        <button
                          onClick={() => setToDelete(a)}
                          className="text-[var(--theme-danger)] p-1 hover:bg-rose-50 rounded"
                          aria-label="Remove assignment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                        <Avatar name={a.teacher} size={26} />
                        <span className="font-medium text-[var(--theme-text)]">{a.teacher}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </BoardBody>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleRemove}
        title="Remove assignment"
        confirmLabel={deleting ? "Removing..." : "Remove"}
        message={`Remove assignment of "${toDelete?.subject}" to ${toDelete?.cls} (Section ${toDelete?.section}) with teacher ${toDelete?.teacher}?`}
      />
    </Board>
  );
}

function Mini({
  label,
  value,
  Icon,
  color,
  soft,
}: {
  label: string;
  value: number;
  Icon: React.ElementType;
  color: string;
  soft: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: soft, color }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-2 text-[22px] font-bold">{value}</p>
      <p className="text-[13px] text-[var(--theme-text-muted)]">{label}</p>
    </div>
  );
}
