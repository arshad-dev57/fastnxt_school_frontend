"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DoorOpen, UserPlus, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { visitorsApi, type VisitorItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog } from "@/components/ui";

const COLORS: Record<string, string> = { In: "var(--theme-warning)", Out: "var(--theme-success)" };

export default function FrontOfficePage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(VisitorItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: VisitorItem } | null>(null);
  const [toDelete, setToDelete] = useState<VisitorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await visitorsApi.list({ branchId: branchScope });
      setRows((res.visitors || []).map(r => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await visitorsApi.delete(toDelete.id);
      setRows(p => p.filter(r => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BranchBoard<VisitorItem & { branchId: string }>
        title="Front Office — Visitors"
        subtitle="Visitor log, gate passes and reception register for the campus."
        Icon={DoorOpen}
        nameLabel="Visitor"
        countNoun="visitors"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.visitor}
        subtitleOf={(r) => `${r.purpose} · Host: ${r.host}`}
        searchTextOf={(r) => `${r.visitor} ${r.purpose} ${r.host} ${r.badge} ${r.phone}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link href="/admissions" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex">
              <UserPlus className="h-[18px] w-[18px]" /> Admissions
            </Link>
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Visitor</Btn>
          </div>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "purpose", label: "Purpose", width: "minmax(150px,1fr)", cell: (r) => r.purpose },
          { key: "host", label: "Host", width: "minmax(140px,1fr)", cell: (r) => r.host },
          { key: "badge", label: "Badge", width: "100px", cell: (r) => r.badge },
          { key: "in", label: "In", width: "90px", cell: (r) => r.inTime },
          { key: "out", label: "Out", width: "90px", cell: (r) => r.outTime },
          { key: "status", label: "Status", width: "90px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Visitor", value: r.visitor },
          { label: "Phone", value: r.phone },
          { label: "Purpose", value: r.purpose },
          { label: "Host", value: r.host },
          { label: "Badge", value: r.badge },
          { label: "Date", value: r.date },
          { label: "In / Out", value: `${r.inTime} – ${r.outTime}` },
          { label: "Status", value: r.status },
        ]}
        mobileRows={(r) => [
          { label: "Purpose", value: r.purpose },
          { label: "Host", value: r.host },
          { label: "Badge", value: r.badge },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No visitors"
        emptyMessage="No visitor records match the current campus scope."
      />

      <VisitorForm
        modal={modal}
        onClose={() => setModal(null)}
        onSave={(saved: any) => {
          setRows(p => modal?.mode === "edit" ? p.map(r => r.id === saved.id ? { ...saved, branchId: saved.branchId || "" } : r) : [{ ...saved, branchId: saved.branchId || "" }, ...p]);
          setModal(null);
        }}
        currentBranchId={currentBranchId}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Visitor"
        message={`Remove the visitor record for "${toDelete?.visitor}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function VisitorForm({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = { visitor: "", phone: "", purpose: "", host: "", badge: "", date: new Date().toISOString().slice(0,10), inTime: "", outTime: "", status: "In" };
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const key = `${modal?.mode}-${modal?.row?.id}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setForm(modal?.row ? { ...modal.row } : blank);
    setErr(null);
  }

  const submit = async () => {
    if (!form.visitor.trim()) return setErr("Visitor is required.");
    setSubmitting(true);
    setErr(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      let res;
      if (modal?.mode === "edit") {
        res = await visitorsApi.update(modal.row.id, { ...form, branchId: branchScope });
      } else {
        res = await visitorsApi.create({ ...form, branchId: branchScope });
      }
      onSave(res.visitor);
    } catch (e: any) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!modal} onClose={onClose} title={modal?.mode === "edit" ? "Edit Visitor" : "New Visitor"} footer={
      <>
        <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>Save</Btn>
      </>
    }>
      {err && <div className="mb-4 text-red-500 text-sm">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Visitor"><Input value={form.visitor} onChange={e => setForm({ ...form, visitor: e.target.value })} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Purpose"><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></Field>
        <Field label="Host"><Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} /></Field>
        <Field label="Badge #"><Input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="In Time"><Input type="time" value={form.inTime} onChange={e => setForm({ ...form, inTime: e.target.value })} /></Field>
        <Field label="Out Time"><Input type="time" value={form.outTime} onChange={e => setForm({ ...form, outTime: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={["In", "Out"]} />
        </Field>
      </div>
    </Modal>
  );
}
