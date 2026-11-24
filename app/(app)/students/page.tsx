"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, IdCard, UserPlus, Plus, ArrowUpDown, Layers, Filter, RefreshCw } from "lucide-react";
import {
  Avatar, ConfirmDialog, EmptyState, RowMenu, Td, Th, cn,
} from "@/components/ui";
import { Board, BoardBar, BoardBody, BoardHead, GroupHead, GroupTable, BarCell } from "@/components/board";
import {
  ColumnsDropdown, BoardToolbarBar, BoardInlineSearch, StatusPill, ToolDropdown, statusColor,
  type BoardView,
} from "@/components/board-kit";
import { CalendarBoard, KanbanBoard, MobileItem } from "@/components/board-views";
import { BoardPageSkeleton } from "@/components/skeleton";
import { useBranch } from "@/lib/branch-context";
import { studentsApi, classesApi, type StudentItem, type ClassItem } from "@/lib/auth/api-client";
import { ADMISSION_TRACKS, courseNamesFrom, matchesStudentSearch, studentTrackLabel } from "@/lib/student-directory";
const COL_META: { key: string; label: string; width: string }[] = [
  { key: "studentId", label: "Student ID", width: "120px" },
  { key: "cls", label: "Class", width: "120px" },
  { key: "course", label: "Course", width: "160px" },
  { key: "section", label: "Section", width: "96px" },
  { key: "guardian", label: "Guardian", width: "minmax(150px,1fr)" },
  { key: "phone", label: "Phone", width: "150px" },
  { key: "status", label: "Status", width: "130px" },
  { key: "admissionDate", label: "Admission Date", width: "140px" },
];
const PALETTE = [
  "var(--theme-primary)", "var(--theme-accent)", "var(--theme-success)",
  "var(--theme-warning)", "var(--theme-danger)", "var(--theme-info)",
  "var(--theme-accent-2)", "var(--theme-success-text)"
];
const SORTS = ["Name", "Student ID", "Class", "Admission Date"] as const;
const GROUP_BY = ["Status", "Class", "Course", "Section", "Gender"] as const;

type SortLabel = (typeof SORTS)[number];
type GroupLabel = (typeof GROUP_BY)[number];

export default function AllStudentsPage() {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [course, setCourse] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [sort, setSort] = useState<SortLabel>("Name");
  const [sortAsc, setSortAsc] = useState(true);
  const [group, setGroup] = useState<GroupLabel>("Status");
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<BoardView>("table");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toDelete, setToDelete] = useState<StudentItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [studentsRes, classesRes] = await Promise.all([
        studentsApi.list({ branchId: branchScope }),
        classesApi.list({ branchId: branchScope }),
      ]);
      setRows(studentsRes.students || []);
      setClasses(classesRes.classes || []);
    } catch (err: unknown) {
      console.error("Failed to load students:", err);
      setError(err instanceof Error ? err.message : "Failed to load students directory.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classNames = useMemo(() => classes.map((c) => c.name), [classes]);
  const courseNames = useMemo(() => courseNamesFrom(rows), [rows]);
  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => (c.sections || []).forEach((s) => set.add(s)));
    rows.forEach((r) => r.section && set.add(r.section));
    return Array.from(set).sort();
  }, [classes, rows]);

  const filtered = useMemo(() => rows
    .filter((r) => !currentBranchId || currentBranchId === "all" || !r.branchId || r.branchId === currentBranchId)
    .filter((r) => matchesStudentSearch(r, q))
    .filter((r) => (cls ? r.cls === cls : true))
    .filter((r) => (course ? r.course === course : true))
    .filter((r) => (program ? studentTrackLabel(r) === program : true))
    .filter((r) => (section ? r.section === section : true))
    .filter((r) => (status ? r.status === status : true))
    .filter((r) => (gender ? r.gender === gender : true))
    .sort((a, b) => {
      const key = sort === "Name" ? "name" : sort === "Student ID" ? "studentId" : sort === "Class" ? "cls" : "admissionDate";
      const c = String(a[key as keyof StudentItem] || '').localeCompare(String(b[key as keyof StudentItem] || ''));
      return sortAsc ? c : -c;
    }), [rows, currentBranchId, q, cls, course, program, section, status, gender, sort, sortAsc]);

  const groups = useMemo(() => {
    const map = new Map<string, StudentItem[]>();
    for (const r of filtered) {
      const k = group === "Status" ? r.status : group === "Class" ? r.cls : group === "Course" ? (r.course || "No course") : group === "Section" ? `Section ${r.section}` : (r.gender || 'Other');
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return [...map.keys()].sort().map((k, i) => ({
      key: k, label: k, items: map.get(k)!,
      color: group === "Status" ? statusColor(k) : PALETTE[i % PALETTE.length],
    }));
  }, [filtered, group]);

  const visibleCols = COL_META.filter((c) => !hidden.includes(c.key));
  const tmpl = `44px minmax(190px,1.4fr) ${visibleCols.map((c) => c.width).join(" ")} 64px`;
  const latestMonth = useMemo(() => filtered.map((r) => r.admissionDate).filter(Boolean).sort().slice(-1)[0]?.slice(0, 7), [filtered]);

  const rowMenu = (r: StudentItem) => [
    { label: "View Details", Icon: Eye, onClick: () => router.push(`/students/${r.id}`) },
    { label: "Edit Student", Icon: Pencil, onClick: () => router.push(`/students/${r.id}/edit`) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setActionLoading(true);
      await studentsApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete student.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && rows.length === 0) return <BoardPageSkeleton rows={5} cols={6} />;

  return (
    <Board>
      <BoardBar>
        <BoardHead
          title="All Students"
          subtitle="Search and filter by class, course, Law, IT, or Nursing."
          Icon={UserPlus}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                title="Refresh"
                aria-label="Refresh students"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Link href="/students/id-cards" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] sm:flex">
                <IdCard className="h-[18px] w-[18px]" /> ID Cards
              </Link>
              <Link href="/students/new" className="flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
                <Plus className="h-[18px] w-[18px]" /> Add Student
              </Link>
            </div>
          }
        />

        <BoardToolbarBar>
          <BoardInlineSearch value={q} onChange={setQ} placeholder="Search name, ID, course, Law, IT or Nursing…" />
          <ToolDropdown Icon={Filter} label="Class" options={classNames} value={cls} onChange={setCls} allLabel="All Classes" />
          <ToolDropdown Icon={Filter} label="Program" options={ADMISSION_TRACKS} value={program} onChange={setProgram} allLabel="All Programs" />
          <ToolDropdown Icon={Filter} label="Course" options={courseNames} value={course} onChange={setCourse} allLabel="All Courses" />
          <ToolDropdown Icon={ArrowUpDown} label="Sort" options={SORTS} value={sort} onChange={(v) => { setSort((v || "Name") as SortLabel); setSortAsc(true); }} allLabel="Name" />
          <ColumnsDropdown columns={COL_META} hidden={hidden} onToggle={(k) => setHidden((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />
          <ToolDropdown Icon={Layers} label="Group by" options={GROUP_BY} value={group} onChange={(v) => setGroup((v || "Status") as GroupLabel)} allLabel="Status" />
          <ToolDropdown Icon={Filter} label="Section" options={sectionOptions} value={section} onChange={setSection} allLabel="All Sections" />
          <ToolDropdown Icon={Filter} label="Status" options={["Active", "Inactive"]} value={status} onChange={setStatus} allLabel="All Status" />
        </BoardToolbarBar>
      </BoardBar>

      <BoardBody>
        {error && (
          <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        {view === "table" && (
          groups.length === 0 ? (
            <EmptyState
              Icon={UserPlus}
              title="No students found"
              message="No student records match your filters. Add a new student to get started."
              action={
                <Link
                  href="/students/new"
                  className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--theme-primary-hover)]"
                >
                  <Plus className="h-4 w-4" /> Add Student
                </Link>
              }
            />
          ) : (
            <div className="space-y-8 md:min-w-[980px]">
              {groups.map((g) => {
                const open = !collapsed[g.key];
                return (
                  <section key={g.key}>
                    <GroupHead title={g.label} color={g.color} count={g.items.length} open={open}
                      onToggle={() => setCollapsed((p) => ({ ...p, [g.key]: open }))} />
                    {open && (
                      <>
                        <div className="hidden md:block">
                          <GroupTable>
                            <div className="grid border-b border-[var(--theme-border)] bg-[var(--theme-surface)]" style={{ gridTemplateColumns: tmpl }}>
                              <BarCell color={g.color} />
                              <Th>Student</Th>
                              {visibleCols.map((c) => <Th key={c.key} className="border-l border-[var(--theme-border)]">{c.label}</Th>)}
                              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                            </div>
                            {g.items.map((r) => (
                              <div key={r.id} onClick={() => router.push(`/students/${r.id}`)}
                                className="row grid cursor-pointer border-b border-[var(--theme-border)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]"
                                style={{ gridTemplateColumns: tmpl }}>
                                <BarCell color={g.color} className="py-2.5"><Avatar name={r.name} src={r.photo} size={30} /></BarCell>
                                <Td className="min-w-0"><span className="truncate font-medium">{r.name}</span></Td>
                                {visibleCols.map((c) => (
                                  <Td key={c.key} className="min-w-0 border-l border-[var(--theme-border)]">
                                    {c.key === "status"
                                      ? <StatusPill label={r.status} />
                                      : <span className="truncate text-[var(--theme-text-muted)] font-mono text-[13px]">{String(r[c.key as keyof StudentItem] ?? '—')}</span>}
                                  </Td>
                                ))}
                                <Td className="justify-center border-l border-[var(--theme-border)]">
                                  <span onClick={(e) => e.stopPropagation()}><RowMenu items={rowMenu(r)} /></span>
                                </Td>
                              </div>
                            ))}
                          </GroupTable>
                        </div>
                        <div className="space-y-3 md:hidden">
                          {g.items.map((r) => (
                            <div key={r.id} role="link" tabIndex={0} onClick={() => router.push(`/students/${r.id}`)} onKeyDown={(e) => { if (e.key === "Enter") router.push(`/students/${r.id}`); }} className="cursor-pointer">
                            <MobileItem name={r.name} subtitle={`${r.studentId} · ${r.cls}-${r.section}${r.course ? ` · ${r.course}` : ""}`}
                              actions={<span onClick={(e) => e.stopPropagation()}><RowMenu items={rowMenu(r)} /></span>}
                              rows={[
                                { label: "Status", value: <StatusPill label={r.status} /> },
                                { label: "Guardian", value: r.guardian || r.father || '—' },
                                { label: "Phone", value: r.phone || '—' },
                                { label: "Admission", value: r.admissionDate },
                              ]} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          )
        )}

        {view === "kanban" && (
          <KanbanBoard
            columns={groups.map((g) => ({ key: g.key, label: g.label, color: g.color, items: g.items }))}
            keyOf={(r) => r.id}
            renderCard={(r) => (
              <button type="button" onClick={() => router.push(`/students/${r.id}`)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left shadow-sm transition-colors hover:bg-[var(--theme-hover)]">
                <span className="flex items-start gap-2">
                  <Avatar name={r.name} src={r.photo} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{r.name}</span>
                    <span className="block truncate text-[12px] text-[var(--theme-text-muted)]">{r.studentId} · {r.cls}-{r.section}{r.course ? ` · ${r.course}` : ""}</span>
                  </span>
                </span>
                <span className="mt-2 flex items-center gap-2">
                  <StatusPill label={r.status} />
                  <span className="truncate text-[12px] text-[var(--theme-text-faint)]">{r.guardian || r.father}</span>
                </span>
              </button>
            )}
          />
        )}

        {view === "calendar" && (
          <CalendarBoard items={filtered} getDate={(r) => r.admissionDate} initialMonth={latestMonth}
            renderChip={(r) => (
              <button type="button" onClick={() => router.push(`/students/${r.id}`)} title={`${r.name} · ${r.cls}-${r.section}`}
                className="flex w-full items-center gap-1.5 rounded bg-[var(--theme-hover)] px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-[var(--theme-border)]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusColor(r.status) }} />
                <span className="truncate">{r.name}</span>
              </button>
            )}
          />
        )}
      </BoardBody>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete student"
        confirmLabel={actionLoading ? "Deleting..." : "Delete"}
        message={`Are you sure you want to remove "${toDelete?.name}" from the student directory? This action cannot be undone.`}
      />
    </Board>
  );
}


