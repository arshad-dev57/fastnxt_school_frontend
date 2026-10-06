"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Eye, Pencil, Trash2, Users2, Phone, Mail, GraduationCap,
  Wallet, Filter, ReceiptText, RefreshCw, Search,
} from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input,
  Modal, PageHeader, Pagination, RowMenu, SearchBox, Select, SplitButton,
  Td, Th, Textarea, cn, rs,
} from "@/components/ui";
import {
  familiesApi,
  type FamilyItem,
  type CreateFamilyInput,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const COLS =
  "grid-cols-[100px_minmax(150px,1.2fr)_120px_minmax(160px,1.3fr)_minmax(170px,1.3fr)_90px_100px_64px]";
const PER_PAGE = 8;

export default function ManageFamiliesPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<FamilyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<FamilyItem | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: FamilyItem } | null>(null);
  const [toDelete, setToDelete] = useState<FamilyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope =
        currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await familiesApi.list({ branchId: branchScope });
      setRows(res.families || []);
    } catch (err: unknown) {
      console.error("Failed to load families:", err);
      setError(err instanceof Error ? err.message : "Failed to load families.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            r.guardian.toLowerCase().includes(q.toLowerCase()) ||
            r.familyCode.toLowerCase().includes(q.toLowerCase()) ||
            r.phone.includes(q) ||
            r.email.toLowerCase().includes(q.toLowerCase())
        )
        .filter((r) => (status ? r.status === status : true)),
    [rows, q, status]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const handleSave = (saved: FamilyItem) => {
    setRows((prev) =>
      modal?.mode === "edit"
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [saved, ...prev]
    );
    setModal(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await familiesApi.delete(toDelete.id);
      setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete family.");
    } finally {
      setDeleting(false);
    }
  };

  const rowMenu = (r: FamilyItem) => [
    { label: "View Family", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader
        title="Manage Families"
        subtitle="Group students under a single guardian and track family fee summaries."
        actions={
          <>
            <button
              type="button"
              onClick={loadData}
              title="Refresh"
              aria-label="Refresh families"
              className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <Link
              href="/fees/invoices"
              className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex"
            >
              <ReceiptText className="h-[18px] w-[18px]" /> Fee Invoices
            </Link>
            <SplitButton
              label="Add Family"
              Icon={Plus}
              onClick={() => setModal({ mode: "add" })}
            />
          </>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        {error && (
          <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox
            value={q}
            onChange={(v) => { setQ(v); setPage(1); }}
            placeholder="Search guardian, code or phone"
            className="w-full sm:w-72"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={["Active", "Inactive"]}
              placeholder="All Status"
              className="w-36"
            />
          </div>
          <span className="ml-auto text-[13px] text-[var(--theme-text-muted)]">
            {filtered.length} {filtered.length === 1 ? "family" : "families"}
          </span>
        </div>

        <Card pad={false}>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
              <Th className="border-l border-[var(--theme-border)]">Family Code</Th>
              <Th className="border-l border-[var(--theme-border)]">Guardian</Th>
              <Th className="border-l border-[var(--theme-border)]">Phone</Th>
              <Th className="border-l border-[var(--theme-border)]">Email</Th>
              <Th className="border-l border-[var(--theme-border)]">Address</Th>
              <Th className="border-l border-[var(--theme-border)]">Students</Th>
              <Th className="border-l border-[var(--theme-border)]">Status</Th>
              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
            </div>

            {loading && rows.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--theme-primary)]" />
                Loading families…
              </div>
            ) : paged.length === 0 ? null : (
              paged.map((r) => (
                <div
                  key={r.id}
                  className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}
                >
                  <Td className="border-l border-[var(--theme-border)] font-mono text-[13px] text-[var(--theme-text-muted)]">
                    {r.familyCode}
                  </Td>
                  <Td className="border-l border-[var(--theme-border)]">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={r.guardian} />
                      <span className="truncate font-medium">{r.guardian}</span>
                    </div>
                  </Td>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.phone || "—"}</Td>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">
                    <span className="truncate">{r.email || "—"}</span>
                  </Td>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">
                    <span className="truncate">{r.address || "—"}</span>
                  </Td>
                  <Td className="border-l border-[var(--theme-border)]">
                    <Badge label={`${r.students} student${r.students !== 1 ? "s" : ""}`} tone="purple" />
                  </Td>
                  <Td className="border-l border-[var(--theme-border)]">
                    <Badge label={r.status} tone={r.status === "Active" ? "green" : "gray"} />
                  </Td>
                  <Td className="justify-center border-l border-[var(--theme-border)]">
                    <RowMenu items={rowMenu(r)} />
                  </Td>
                </div>
              ))
            )}
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-3 md:hidden">
            {loading && rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--theme-text-muted)]">
                <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[var(--theme-primary)]" />
                Loading…
              </div>
            ) : (
              paged.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm"
                  style={{ borderLeft: "6px solid var(--theme-accent-2)" }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={r.guardian} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-medium">{r.guardian}</p>
                      <p className="text-[12px] text-[var(--theme-text-faint)]">
                        {r.familyCode} · {r.students} student{r.students !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <RowMenu items={rowMenu(r)} />
                  </div>
                  <div className="mt-3 space-y-1 text-[13px] text-[var(--theme-text-muted)]">
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {r.phone || "—"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{r.email || "—"}</span>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge label={r.status} tone={r.status === "Active" ? "green" : "gray"} />
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && filtered.length === 0 && (
            <EmptyState
              Icon={Users2}
              title="No families found"
              message={q || status ? "Adjust the search or filters." : "Start by registering a family record."}
              action={
                <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>
                  Add Family
                </Btn>
              }
            />
          )}

          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      {/* ── DETAIL VIEW MODAL ─────────────────────────────────────────────── */}
      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title={view?.guardian ?? ""}
        subtitle={view?.familyCode}
        width="max-w-2xl"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
            <Btn
              variant="primary"
              Icon={Pencil}
              onClick={() => {
                setModal({ mode: "edit", row: view ?? undefined });
                setView(null);
              }}
            >
              Edit
            </Btn>
          </>
        }
      >
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--theme-border)] p-3">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">
                  Guardian information
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={view.guardian} size={40} />
                  <div>
                    <p className="font-medium">{view.guardian}</p>
                    <Badge label={view.status} tone={view.status === "Active" ? "green" : "gray"} />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--theme-border)] p-3">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">
                  Contact information
                </p>
                <p className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                  <Phone className="h-3.5 w-3.5" /> {view.phone || "—"}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{view.email || "—"}</span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--theme-border)] p-3">
              <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">
                <GraduationCap className="h-4 w-4" /> Linked students ({view.students})
              </p>
              {view.studentNames.length > 0 ? (
                <div className="space-y-2">
                  {view.studentNames.map((n, i) => (
                    <div key={n} className="flex items-center gap-3 rounded-lg bg-[var(--theme-sidebar)] px-3 py-2">
                      <Avatar name={n} size={32} />
                      <span className="flex-1 truncate text-[14px] font-medium">{n}</span>
                      <Badge label={view.classList[i] ?? "—"} tone="blue" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--theme-text-muted)]">
                  No students linked yet. Students are linked automatically when their guardian
                  name matches this family&apos;s guardian.
                </p>
              )}
            </div>

            {view.notes && (
              <div className="flex items-start gap-2 rounded-lg bg-[var(--theme-sidebar)] p-3 text-[13px] text-[var(--theme-text-muted)]">
                <span className="font-medium text-[var(--theme-text)]">Notes:</span> {view.notes}
              </div>
            )}

            {view.address && (
              <div className="flex items-start gap-2 rounded-lg bg-[var(--theme-sidebar)] p-3 text-[13px] text-[var(--theme-text-muted)]">
                <span className="font-medium text-[var(--theme-text)]">Address:</span> {view.address}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────────────── */}
      <FamilyForm
        modal={modal}
        onClose={() => setModal(null)}
        onSave={handleSave}
        currentBranchId={currentBranchId}
      />

      {/* ── DELETE CONFIRM ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete family"
        confirmLabel="Delete"
        message={`Remove the family record for "${toDelete?.guardian}" (${toDelete?.familyCode})? Linked students will remain in the directory.`}
      />
    </>
  );
}

// ─── FAMILY FORM ─────────────────────────────────────────────────────────────

function FamilyForm({
  modal,
  onClose,
  onSave,
  currentBranchId,
}: {
  modal: { mode: "add" | "edit"; row?: FamilyItem } | null;
  onClose: () => void;
  onSave: (r: FamilyItem) => void;
  currentBranchId: string;
}) {
  const blank: CreateFamilyInput = {
    guardian: "",
    familyCode: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    status: "Active",
  };

  const [form, setForm] = useState<CreateFamilyInput>(blank);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form when modal opens
  const modalKey = `${modal?.mode ?? ""}-${modal?.row?.id ?? "new"}`;
  const [lastKey, setLastKey] = useState(modalKey);
  if (lastKey !== modalKey) {
    setLastKey(modalKey);
    setForm(
      modal?.row
        ? {
            guardian: modal.row.guardian,
            familyCode: modal.row.familyCode,
            phone: modal.row.phone,
            email: modal.row.email,
            address: modal.row.address,
            notes: modal.row.notes,
            status: modal.row.status,
          }
        : blank
    );
    setFormError(null);
  }

  const set = (patch: Partial<CreateFamilyInput>) =>
    setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    if (!form.guardian.trim()) return "Guardian name is required.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError(null);

    try {
      setSubmitting(true);
      const branchScope =
        currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      let saved: FamilyItem;
      if (modal?.mode === "edit" && modal.row) {
        const res = await familiesApi.update(modal.row.id, { ...form, branchId: branchScope });
        saved = res.family;
      } else {
        const res = await familiesApi.create({ ...form, branchId: branchScope });
        saved = res.family;
      }
      onSave(saved);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save family.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Family" : "New Family"}
      subtitle="Guardian details and contact information"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Btn>
          <Btn
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
            loadingLabel={modal?.mode === "edit" ? "Saving…" : "Creating…"}
          >
            {modal?.mode === "edit" ? "Save Changes" : "Create Family"}
          </Btn>
        </>
      }
    >
      {formError && (
        <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
          {formError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Guardian Name *" className="sm:col-span-2">
          <Input
            value={form.guardian}
            onChange={(e) => set({ guardian: e.target.value })}
            placeholder="Full guardian name"
          />
        </Field>
        <Field label="Family Code">
          <Input
            value={form.familyCode}
            onChange={(e) => set({ familyCode: e.target.value })}
            placeholder="Auto-generated if empty"
          />
        </Field>
        <Field label="Status">
          <Select
            options={["Active", "Inactive"]}
            value={form.status}
            onChange={(e) => set({ status: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="03XX-XXXXXXX"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="guardian@email.com"
          />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="Home address"
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Any additional notes about this family…"
            rows={3}
          />
        </Field>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-[var(--theme-text-muted)]">
        <Search className="h-3.5 w-3.5" />
        Students are linked automatically when their guardian name matches this family&apos;s guardian.
      </p>
    </Modal>
  );
}
