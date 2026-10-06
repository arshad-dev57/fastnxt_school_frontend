"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, BookOpen, Layers, RefreshCw } from "lucide-react";
import {
  Btn, ConfirmDialog, EmptyState, Field, Input, Modal, PillSelect, RowMenu,
  Select, SplitButton, Td, Th, ToolbarBtn, cn, ACTIVE_COLORS,
} from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, BarCell, BoardPill, GroupHead, GroupTable,
} from "@/components/board";
import { useBranch } from "@/lib/branch-context";
import { isInBranchScope } from "@/lib/branch-scope";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { subjectsApi, type SubjectItem, type CreateSubjectInput } from "@/lib/auth/api-client";

const TYPES: SubjectItem["type"][] = ["Core", "Elective", "Activity"];
const TYPE_COLORS: Record<string, string> = { Core: "var(--theme-info)", Elective: "var(--theme-accent-2)", Activity: "var(--theme-warning)" };
const STATUSES: SubjectItem["status"][] = ["Active", "Inactive"];
const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];
const COLS = "grid-cols-[44px_minmax(200px,1.4fr)_120px_130px_140px_130px_64px]";

export default function AllSubjectsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [sortAsc, setSortAsc] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: SubjectItem } | null>(null);
  const [view, setView] = useState<SubjectItem | null>(null);
  const [toDelete, setToDelete] = useState<SubjectItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await subjectsApi.list({ branchId: branchScope });
      setRows(res.subjects || []);
    } catch (err: unknown) {
      console.error("Failed to load subjects:", err);
      setError(err instanceof Error ? err.message : "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const groups = useMemo(() => {
    const base = rows
      .filter((r) => !currentBranchId || currentBranchId === "all" || !r.branchId || r.branchId === currentBranchId)
      .filter((r) => tab === "All" || r.status === tab)
      .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

    const distinctTypes = Array.from(new Set([...TYPES, ...base.map((r) => r.type)]));
    return distinctTypes
      .map((t) => ({
        type: t,
        color: TYPE_COLORS[t] || "var(--theme-info)",
        items: base.filter((r) => r.type.toLowerCase() === t.toLowerCase()),
      }))
      .filter((g) => g.items.length > 0);
  }, [rows, currentBranchId, q, tab, sortAsc]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const handleSave = async (data: CreateSubjectInput, id?: string) => {
    try {
      setActionLoading(true);
      if (id) {
        const res = await subjectsApi.update(id, data);
        setRows((p) => p.map((r) => (r.id === id ? res.subject : r)));
      } else {
        const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
        const res = await subjectsApi.create({ ...data, branchId: branchScope });
        setRows((p) => [res.subject, ...p]);
      }
      setModal(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save subject.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetStatus = async (id: string, status: SubjectItem["status"]) => {
    try {
      setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
      await subjectsApi.updateStatus(id, status);
    } catch (err: unknown) {
      console.error("Failed to update status:", err);
      fetchSubjects();
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setActionLoading(true);
      await subjectsApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete subject.");
    } finally {
      setActionLoading(false);
    }
  };

  const rowMenu = (r: SubjectItem) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={BookOpen}
          title="All Subjects"
          subtitle="Manage the curriculum subjects offered across all classes."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchSubjects}
                title="Refresh"
                aria-label="Refresh subjects"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Link
                href="/subjects/assign"
                className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <BookOpen className="h-[18px] w-[18px]" /> Assign Subjects
              </Link>
            </div>
          }
        />
        <BranchScopeBar count={total} noun="subjects" />
        <BoardTabs tabs={TABS} value={tab} onChange={setTab} />
        <BoardToolbar>
          <SplitButton label="Add Subject" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          <BoardSearch value={q} onChange={setQ} placeholder="Search subjects" />
          <ToolbarBtn Icon={ArrowUpDown} label={sortAsc ? "A–Z" : "Z–A"} onClick={() => setSortAsc((s) => !s)} />
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

        {loading && (
          <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--theme-primary)]" />
            Loading subjects...
          </div>
        )}

        {!loading && total === 0 && (
          <EmptyState
            Icon={BookOpen}
            title="No subjects found"
            message="Adjust your search or add a new subject to curriculum."
            action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Subject</Btn>}
          />
        )}

        {!loading && total > 0 && (
          <div className="space-y-8 md:min-w-[820px]">
            {groups.map((g) => {
              const open = !collapsed[g.type];
              return (
                <section key={g.type}>
                  <GroupHead
                    title={g.type}
                    color={g.color}
                    count={g.items.length}
                    open={open}
                    onToggle={() => setCollapsed((p) => ({ ...p, [g.type]: open }))}
                  />

                  {open && (
                    <>
                      {/* DESKTOP TABLE */}
                      <div className="hidden md:block">
                        <GroupTable>
                          <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                            <div className="border-l-[6px]" style={{ borderColor: g.color }} />
                            <Th className="border-l border-[var(--theme-border)]">Subject</Th>
                            <Th className="border-l border-[var(--theme-border)]">Subject Code</Th>
                            <Th className="border-l border-[var(--theme-border)]">Type</Th>
                            <Th className="border-l border-[var(--theme-border)]">Assigned Classes</Th>
                            <Th className="border-l border-[var(--theme-border)]">Status</Th>
                            <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                          </div>
                          {g.items.map((r) => (
                            <div
                              key={r.id}
                              className={cn(
                                "row grid",
                                COLS,
                                "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]"
                              )}
                            >
                              <BarCell color={g.color} className="py-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                                  <BookOpen className="h-4 w-4" />
                                </span>
                              </BarCell>
                              <Td className="gap-2 font-medium">
                                <span className="truncate">{r.name}</span>
                              </Td>
                              <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)] font-mono text-[13px]">{r.code}</Td>
                              <Td className="border-l border-[var(--theme-border)]">
                                <BoardPill label={r.type} color={TYPE_COLORS[r.type]} />
                              </Td>
                              <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">
                                {r.classes} {r.classes === 1 ? "class" : "classes"}
                              </Td>
                              <Td className="border-l border-[var(--theme-border)]">
                                <PillSelect<SubjectItem["status"]>
                                  value={r.status}
                                  options={STATUSES}
                                  colors={ACTIVE_COLORS}
                                  onPick={(s) => handleSetStatus(r.id, s)}
                                  className="w-24"
                                  menuWidth="w-32"
                                />
                              </Td>
                              <Td className="justify-center border-l border-[var(--theme-border)]">
                                <RowMenu items={rowMenu(r)} />
                              </Td>
                            </div>
                          ))}
                        </GroupTable>
                      </div>

                      {/* MOBILE CARDS */}
                      <div className="space-y-3 md:hidden">
                        {g.items.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm"
                            style={{ borderLeft: `6px solid ${g.color}` }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                                <BookOpen className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[16px] font-medium">{r.name}</p>
                                <p className="text-[13px] text-[var(--theme-text-muted)]">
                                  {r.code} · {r.classes} {r.classes === 1 ? "class" : "classes"}
                                </p>
                              </div>
                              <RowMenu items={rowMenu(r)} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <BoardPill label={r.type} color={TYPE_COLORS[r.type]} />
                              <PillSelect<SubjectItem["status"]>
                                value={r.status}
                                options={STATUSES}
                                colors={ACTIVE_COLORS}
                                onPick={(s) => handleSetStatus(r.id, s)}
                                className="w-24"
                                menuWidth="w-32"
                              />
                            </div>
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

      <SubjectForm
        modal={modal}
        loading={actionLoading}
        onClose={() => setModal(null)}
        onSave={handleSave}
      />

      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title={view?.name ?? ""}
        subtitle="Subject details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}
      >
        {view && (
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Subject Code" value={view.code} />
            <Detail label="Type" value={view.type} />
            <Detail label="Assigned Classes" value={`${view.classes} classes`} />
            <Detail label="Status" value={view.status} />
            {view.description && (
              <div className="col-span-2">
                <Detail label="Description" value={view.description} />
              </div>
            )}
            <div className="col-span-2">
              <Detail label="Subject ID" value={view.id} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete subject"
        confirmLabel={actionLoading ? "Deleting..." : "Delete"}
        message={`Delete "${toDelete?.name}"? This will remove the subject and any class assignments.`}
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

function SubjectForm({
  modal,
  loading,
  onClose,
  onSave,
}: {
  modal: { mode: "add" | "edit"; row?: SubjectItem } | null;
  loading: boolean;
  onClose: () => void;
  onSave: (data: CreateSubjectInput, id?: string) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<SubjectItem["type"]>("Core");
  const [status, setStatus] = useState<SubjectItem["status"]>("Active");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (modal?.row) {
      setName(modal.row.name || "");
      setCode(modal.row.code || "");
      setType(modal.row.type || "Core");
      setStatus(modal.row.status || "Active");
      setDescription(modal.row.description || "");
    } else {
      setName("");
      setCode("");
      setType("Core");
      setStatus("Active");
      setDescription("");
    }
  }, [modal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Subject name is required.");
      return;
    }
    onSave(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        status,
        description: description.trim() || undefined,
      },
      modal?.mode === "edit" ? modal.row?.id : undefined
    );
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Subject" : "New Subject"}
      subtitle="Add a subject to the school curriculum."
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : modal?.mode === "edit" ? "Save Changes" : "Create Subject"}
          </Btn>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Subject Name *" className="sm:col-span-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Advanced Mathematics"
            required
          />
        </Field>
        <Field label="Subject Code">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MATH-101"
          />
        </Field>
        <Field label="Type">
          <Select
            options={TYPES}
            value={type}
            onChange={(e) => setType(e.target.value as SubjectItem["type"])}
          />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <Select
            options={["Active", "Inactive"]}
            value={status}
            onChange={(e) => setStatus(e.target.value as SubjectItem["status"])}
          />
        </Field>
        <Field label="Description (Optional)" className="sm:col-span-2">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview or syllabus topic notes"
          />
        </Field>
      </form>
    </Modal>
  );
}
