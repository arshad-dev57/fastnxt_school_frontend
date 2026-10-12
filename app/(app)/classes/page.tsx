"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, School, Users, Building2, BookOpen, Layers, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  Avatar, Badge, Btn, ConfirmDialog, EmptyState, Modal, PillSelect, RowMenu,
  Select, SplitButton, Td, Th, ToolbarBtn, cn, ACTIVE_COLORS,
} from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, BarCell, GroupHead, GroupTable,
} from "@/components/board";
import { ClassFormModal } from "@/components/classes/class-form-modal";
import { useBranch } from "@/lib/branch-context";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { classesApi, type ClassItem, type TeacherOption } from "@/lib/auth/api-client";
const SECTIONS_ALL = ["A", "B", "C", "D"];
const STATUSES: ClassItem["status"][] = ["Active", "Inactive"];
const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];
const COLS = "grid-cols-[44px_minmax(180px,1.3fr)_90px_150px_100px_minmax(160px,1fr)_130px_64px]";

export default function AllClassesPage() {
  const { currentBranchId } = useBranch();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [section, setSection] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: ClassItem } | null>(null);
  const [view, setView] = useState<ClassItem | null>(null);
  const [toDelete, setToDelete] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [classRes, teacherRes] = await Promise.all([
        classesApi.list({ branchId: branchScope }, ctrl.signal),
        classesApi.listTeachers(branchScope, ctrl.signal),
      ]);
      setClasses(classRes.classes ?? []);
      setTeachers(teacherRes.teachers ?? []);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError((err as Error).message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const groups = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    const base = classes
      .filter((r) => !currentBranchId || currentBranchId === "all" || !r.branchId || r.branchId === currentBranchId)
      .filter((r) => tab === "All" || r.status === tab)
      .filter((r) => !query || (r.name || "").toLowerCase().includes(query) || (r.code || "").toLowerCase().includes(query))
      .filter((r) => (section ? (r.sections || []).includes(section) : true))
      .sort((a, b) => (sortAsc ? (a.name || "").localeCompare(b.name || "") : (b.name || "").localeCompare(a.name || "")));
    return STATUSES
      .map((s) => ({ status: s, color: ACTIVE_COLORS[s], items: base.filter((r) => r.status === s) }))
      .filter((g) => g.items.length > 0);
  }, [classes, currentBranchId, q, tab, section, sortAsc]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const handleSave = async (payload: Partial<ClassItem> & { teacherId?: string | null }) => {
    setSaving(true);
    setApiError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      if (modal?.mode === "edit" && modal.row) {
        const res = await classesApi.update(modal.row.id, { ...payload, branchId: branchScope });
        setClasses((p) => p.map((r) => (r.id === modal.row!.id ? res.class : r)));
      } else {
        const res = await classesApi.create({ ...payload, branchId: branchScope } as Parameters<typeof classesApi.create>[0]);
        setClasses((p) => [res.class, ...p]);
      }
      setModal(null);
    } catch (err: unknown) {
      setApiError((err as Error).message || "Failed to save class.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: ClassItem["status"]) => {
    try {
      const res = await classesApi.updateStatus(id, status);
      setClasses((p) => p.map((r) => (r.id === id ? res.class : r)));
    } catch {
      // silently revert — reload
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await classesApi.delete(toDelete.id);
      setClasses((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to delete class.");
    } finally {
      setDeleting(false);
    }
  };

  const rowMenu = (r: ClassItem) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={School}
          title="All Classes"
          subtitle="Manage school classes, sections and class teachers."
          actions={
            <>
              <div className="hidden -space-x-2 md:flex">
                {classes.slice(0, 3).map((r) => (
                  <span key={r.id} className="rounded-full ring-2 ring-white"><Avatar name={r.teacher} size={32} /></span>
                ))}
              </div>
              <Link href="/subjects/assign" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:flex">
                <BookOpen className="h-[18px] w-[18px]" /> Assign Subjects
              </Link>
            </>
          }
        />
        <BranchScopeBar count={total} noun="classes" />
        <BoardTabs tabs={TABS} value={tab} onChange={setTab} />
        <BoardToolbar>
          <SplitButton label="Add Class" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          <BoardSearch value={q} onChange={setQ} placeholder="Search classes" />
          <ToolbarBtn Icon={ArrowUpDown} label={sortAsc ? "A–Z" : "Z–A"} onClick={() => setSortAsc((s) => !s)} />
          <div className="shrink-0"><Select value={section} onChange={(e) => setSection(e.target.value)} options={SECTIONS_ALL} placeholder="All Sections" className="h-9 w-36" /></div>
          <ToolbarBtn Icon={RefreshCw} label="Refresh" onClick={fetchData} />
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-[var(--theme-danger-border)] bg-[var(--theme-danger-soft)] px-4 py-3 text-[14px] text-[var(--theme-danger-text)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchData} className="ml-auto underline">Retry</button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-[var(--theme-text-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading classes…
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && total === 0 && (
          <EmptyState Icon={School} title="No classes found" message="Try adjusting your filters, or add a new class."
            action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Class</Btn>} />
        )}

        {!loading && (
          <div className="space-y-8 md:min-w-[900px]">
            {groups.map((g) => {
              const open = !collapsed[g.status];
              return (
                <section key={g.status}>
                  <GroupHead title={g.status} color={g.color} count={g.items.length} open={open}
                    onToggle={() => setCollapsed((p) => ({ ...p, [g.status]: open }))} />

                  {open && (
                    <>
                      {/* DESKTOP TABLE */}
                      <div className="hidden md:block">
                        <GroupTable>
                          <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                            <div className="border-l-[6px]" style={{ borderColor: g.color }} />
                            <Th className="border-l border-[var(--theme-border)]">Class</Th>
                            <Th className="border-l border-[var(--theme-border)]">Code</Th>
                            <Th className="border-l border-[var(--theme-border)]">Sections</Th>
                            <Th className="border-l border-[var(--theme-border)]">Students</Th>
                            <Th className="border-l border-[var(--theme-border)]">Class Teacher</Th>
                            <Th className="border-l border-[var(--theme-border)]">Status</Th>
                            <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                          </div>
                          {g.items.map((r) => (
                            <div key={r.id} className={cn("row grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                              <BarCell color={g.color} className="py-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]"><School className="h-4 w-4" /></span>
                              </BarCell>
                              <Td className="gap-2 font-medium"><span className="truncate">{r.name}</span></Td>
                              <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.code}</Td>
                              <Td className="gap-1 border-l border-[var(--theme-border)]">{r.sections.map((s) => <Badge key={s} label={s} tone="gray" />)}</Td>
                              <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.students}</Td>
                              <Td className="border-l border-[var(--theme-border)]"><span className="truncate">{r.teacher}</span></Td>
                              <Td className="border-l border-[var(--theme-border)]">
                                <PillSelect<ClassItem["status"]> value={r.status} options={STATUSES} colors={ACTIVE_COLORS} onPick={(s) => handleStatusChange(r.id, s)} className="w-24" menuWidth="w-32" />
                              </Td>
                              <Td className="justify-center border-l border-[var(--theme-border)]"><RowMenu items={rowMenu(r)} /></Td>
                            </div>
                          ))}
                        </GroupTable>
                      </div>

                      {/* MOBILE CARDS */}
                      <div className="space-y-3 md:hidden">
                        {g.items.map((r) => (
                          <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: `6px solid ${g.color}` }}>
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]"><School className="h-4 w-4" /></span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[16px] font-medium">{r.name}</p>
                                <p className="text-[13px] text-[var(--theme-text-muted)]">{r.code} · {r.students} students</p>
                              </div>
                              <RowMenu items={rowMenu(r)} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {r.sections.map((s) => <Badge key={s} label={`Section ${s}`} tone="gray" />)}
                              <PillSelect<ClassItem["status"]> value={r.status} options={STATUSES} colors={ACTIVE_COLORS} onPick={(s) => handleStatusChange(r.id, s)} className="w-24" menuWidth="w-32" />
                            </div>
                            <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">Teacher: {r.teacher}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </BoardBody>

      {/* Class Form Modal */}
      <ClassFormModal
        modal={modal}
        teachers={teachers}
        saving={saving}
        apiError={apiError}
        onClose={() => { setModal(null); setApiError(null); }}
        onSave={handleSave}
      />

      {/* View Modal */}
      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} subtitle="Class details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}>
        {view && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Class Code" value={view.code} />
              <Detail label="Status" value={view.status} />
              <Detail label="Students" value={String(view.students)} />
              <Detail label="Class Teacher" value={view.teacher} />
              <Detail label="Sections" value={view.sections.join(", ")} />
              <Detail label="Session" value={view.session} />
            </div>
            {view.description && (
              <p className="rounded-lg bg-[var(--theme-sidebar)] px-3 py-2 text-[13px] text-[var(--theme-text-muted)]">{view.description}</p>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-[var(--theme-sidebar)] p-3 text-[13px] text-[var(--theme-text-muted)]">
              <Building2 className="h-4 w-4" /> Session {view.session} · Academic year
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete class"
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        message={`Are you sure you want to delete ${toDelete?.name}? This action cannot be undone.`}
      />
    </Board>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-[var(--theme-text-faint)]">{label}</p>
      <p className="text-[14px] font-medium">{value}</p>
    </div>
  );
}
