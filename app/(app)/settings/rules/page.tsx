"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ScrollText, CheckCircle2 } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, RowMenu, SearchBox, Textarea, Toggle,
} from "@/components/ui";
import { RULES, type RuleRow } from "@/lib/mock-data";

export default function RulesPage() {
  const [rows, setRows] = useState<RuleRow[]>(RULES);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: RuleRow } | null>(null);
  const [toDelete, setToDelete] = useState<RuleRow | null>(null);

  const filtered = rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()) || r.body.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id: string) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r)));

  return (
    <>
      <PageHeader title="Rules & Regulations" subtitle="Maintain the school code of conduct and policy documents."
        actions={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Rule</Btn>} />

      <div className="px-4 pb-24 sm:px-6">
        <div className="py-3"><SearchBox value={q} onChange={setQ} placeholder="Search rules" className="w-full sm:w-72" /></div>

        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><ScrollText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold">{r.title}</p>
                    <Badge label={r.status} />
                    <span className="font-mono text-[11px] text-[#9699A6]">{r.id}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#676879]">{r.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Toggle checked={r.status === "Active"} onChange={() => toggle(r.id)} />
                  <RowMenu items={[
                    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
                    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                  ]} />
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <EmptyState Icon={ScrollText} title="No rules found" message="Add a rule or regulation for the school." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Rule</Btn>} />}
        </div>
      </div>

      <RuleForm modal={modal} onClose={() => setModal(null)}
        onSave={(row) => { setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p])); setModal(null); }} />

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete rule" confirmLabel="Delete" message={`Delete “${toDelete?.title}”? Students will no longer see this rule.`} />
    </>
  );
}

function RuleForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: RuleRow } | null; onClose: () => void; onSave: (r: RuleRow) => void }) {
  const blank: RuleRow = { id: "", title: "", body: "", status: "Active" };
  const [form, setForm] = useState<RuleRow>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<RuleRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-xl"
      title={modal?.mode === "edit" ? "Edit Rule" : "New Rule"} subtitle="Describe the policy clearly for staff and students"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" Icon={CheckCircle2} onClick={() => onSave({ ...form, id: form.id || `RULE-${String(Date.now()).slice(-3)}` })}>{modal?.mode === "edit" ? "Save Changes" : "Add Rule"}</Btn></>}>
      <div className="space-y-4">
        <Field label="Title"><Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Uniform Policy" /></Field>
        <Field label="Rule / Regulation"><Textarea value={form.body} onChange={(e) => set({ body: e.target.value })} placeholder="Describe the rule in detail" /></Field>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-[#323338]">Status</span>
          <Toggle checked={form.status === "Active"} onChange={(v) => set({ status: v ? "Active" : "Inactive" })} label={form.status} />
        </div>
      </div>
    </Modal>
  );
}
