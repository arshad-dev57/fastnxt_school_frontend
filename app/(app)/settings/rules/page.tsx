"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ScrollText, CheckCircle2, GraduationCap, User } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, RowMenu, SearchBox, Select, Textarea, Toggle,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  rulesApi,
  type RuleAudience,
  type SchoolRuleItem,
} from "@/lib/auth/api-client";

const AUDIENCES: RuleAudience[] = ["Teachers", "Students", "Both"];

const AUDIENCE_TONE: Record<string, string> = {
  Teachers: "var(--theme-info)",
  Students: "var(--theme-accent-strong)",
  Both: "var(--theme-primary)",
};

export default function RulesPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<SchoolRuleItem[]>([]);
  const [q, setQ] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: SchoolRuleItem } | null>(null);
  const [toDelete, setToDelete] = useState<SchoolRuleItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rulesApi.list({
        branchId: currentBranchId,
        audience: audienceFilter !== "All" ? audienceFilter : undefined,
      });
      setRows(res.rules ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, audienceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) => r.title.toLowerCase().includes(needle) || r.body.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const toggleStatus = async (row: SchoolRuleItem) => {
    const next = row.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await rulesApi.update(row.id, { status: next });
      setRows((p) => p.map((r) => (r.id === row.id ? res.rule : r)));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const saveRule = async (form: { title: string; body: string; audience: RuleAudience; status: "Active" | "Inactive" }) => {
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and rule body are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (modal?.mode === "edit" && modal.row) {
        const res = await rulesApi.update(modal.row.id, form);
        setRows((p) => p.map((r) => (r.id === res.rule.id ? res.rule : r)));
      } else {
        const res = await rulesApi.create({
          ...form,
          branchId: currentBranchId !== "all" ? currentBranchId : null,
        });
        setRows((p) => [res.rule, ...p]);
      }
      setModal(null);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async () => {
    if (!toDelete) return;
    try {
      await rulesApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Rules & Regulations"
        subtitle="Add school policies for teachers and students. Each audience only sees rules meant for them."
        actions={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Rule</Btn>}
      />

      <div className="px-4 pb-24 sm:px-6">
        {error && (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 py-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search rules" className="w-full sm:w-72" />
          <Select
            options={["All", ...AUDIENCES]}
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-3">
          {loading && (
            <p className="py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading rules…</p>
          )}
          {!loading && filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                  <ScrollText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold">{r.title}</p>
                    <Badge label={r.status} />
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: `color-mix(in srgb, ${AUDIENCE_TONE[r.audience] || "var(--theme-primary)"} 14%, transparent)`,
                        color: AUDIENCE_TONE[r.audience] || "var(--theme-primary)",
                      }}
                    >
                      {r.audience === "Teachers" ? <GraduationCap className="h-3 w-3" /> : null}
                      {r.audience === "Students" ? <User className="h-3 w-3" /> : null}
                      {r.audience === "Both" ? <ScrollText className="h-3 w-3" /> : null}
                      For {r.audience}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--theme-text-muted)]">{r.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Toggle checked={r.status === "Active"} onChange={() => toggleStatus(r)} />
                  <RowMenu items={[
                    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
                    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                  ]} />
                </div>
              </div>
            </Card>
          ))}
          {!loading && filtered.length === 0 && (
            <EmptyState
              Icon={ScrollText}
              title="No rules found"
              message="Add a rule for teachers, students, or both."
              action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Rule</Btn>}
            />
          )}
        </div>
      </div>

      <RuleForm
        modal={modal}
        saving={saving}
        onClose={() => setModal(null)}
        onSave={saveRule}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={deleteRule}
        title="Delete rule"
        confirmLabel="Delete"
        message={`Delete “${toDelete?.title}”? It will no longer appear for ${toDelete?.audience === "Both" ? "teachers and students" : (toDelete?.audience || "users").toLowerCase()}.`}
      />
    </>
  );
}

function RuleForm({
  modal,
  saving,
  onClose,
  onSave,
}: {
  modal: { mode: "add" | "edit"; row?: SchoolRuleItem } | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: { title: string; body: string; audience: RuleAudience; status: "Active" | "Inactive" }) => void;
}) {
  const blank: { title: string; body: string; audience: RuleAudience; status: "Active" | "Inactive" } = {
    title: "",
    body: "",
    audience: "Both",
    status: "Active",
  };
  const [form, setForm] = useState(blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(
      modal?.row
        ? {
            title: modal.row.title,
            body: modal.row.body,
            audience: (AUDIENCES.includes(modal.row.audience as RuleAudience)
              ? modal.row.audience
              : "Both") as RuleAudience,
            status: modal.row.status === "Inactive" ? "Inactive" : "Active",
          }
        : blank
    );
  }
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      width="max-w-xl"
      title={modal?.mode === "edit" ? "Edit Rule" : "New Rule"}
      subtitle="Choose who should see this rule — teachers, students, or both"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn
            variant="primary"
            Icon={CheckCircle2}
            loading={saving}
            onClick={() => onSave(form)}
          >
            {modal?.mode === "edit" ? "Save Changes" : "Add Rule"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Uniform Policy" />
        </Field>
        <Field label="Rule / Regulation">
          <Textarea value={form.body} onChange={(e) => set({ body: e.target.value })} placeholder="Describe the rule in detail" />
        </Field>
        <Field label="Show to">
          <Select
            options={AUDIENCES}
            value={form.audience}
            onChange={(e) => set({ audience: e.target.value as RuleAudience })}
          />
        </Field>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">Status</span>
          <Toggle
            checked={form.status === "Active"}
            onChange={(v) => set({ status: v ? "Active" : "Inactive" })}
            label={form.status}
          />
        </div>
      </div>
    </Modal>
  );
}
