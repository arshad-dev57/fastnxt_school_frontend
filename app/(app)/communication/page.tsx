"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Megaphone, CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { noticesApi, type NoticeItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog } from "@/components/ui";

const COLORS: Record<string, string> = { Draft: "var(--theme-pending)", Scheduled: "var(--theme-info)", Sent: "var(--theme-success)", Failed: "var(--theme-danger)" };

export default function CommunicationPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(NoticeItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: NoticeItem } | null>(null);
  const [toDelete, setToDelete] = useState<NoticeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await noticesApi.list({ branchId: branchScope });
      setRows((res.notices || []).map(r => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notices");
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
      await noticesApi.delete(toDelete.id);
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
      <BranchBoard<NoticeItem & { branchId: string }>
        title="Communication Hub"
        subtitle="Notices, circulars and announcements with delivery status and reach."
        Icon={Megaphone}
        nameLabel="Notice"
        countNoun="notices"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.type} · to ${r.audience}`}
        searchTextOf={(r) => `${r.title} ${r.audience} ${r.channel} ${r.type}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link href="/events" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex">
              <CalendarDays className="h-[18px] w-[18px]" /> Events
            </Link>
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Notice</Btn>
          </div>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "audience", label: "Audience", width: "minmax(140px,1fr)", cell: (r) => r.audience },
          { key: "channel", label: "Channel", width: "140px", cell: (r) => r.channel },
          { key: "type", label: "Type", width: "130px", cell: (r) => r.type },
          { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
          { key: "reach", label: "Reach", width: "100px", cell: (r) => r.reach.toLocaleString() },
          { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Title", value: r.title },
          { label: "Audience", value: r.audience },
          { label: "Channel", value: r.channel },
          { label: "Type", value: r.type },
          { label: "Date", value: r.date },
          { label: "Reach", value: r.reach.toLocaleString() },
          { label: "Status", value: r.status },
        ]}
        mobileRows={(r) => [
          { label: "Audience", value: r.audience },
          { label: "Channel", value: r.channel },
          { label: "Reach", value: r.reach.toLocaleString() },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No notices"
        emptyMessage="No notices match the current campus scope."
      />

      <NoticeForm
        modal={modal}
        onClose={() => setModal(null)}
        onSave={(saved) => {
          setRows(p => modal?.mode === "edit" ? p.map(r => r.id === saved.id ? { ...saved, branchId: saved.branchId || "" } : r) : [{ ...saved, branchId: saved.branchId || "" }, ...p]);
          setModal(null);
        }}
        currentBranchId={currentBranchId}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Notice"
        message={`Remove the notice "${toDelete?.title}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function NoticeForm({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = { title: "", audience: "", channel: "", type: "", date: new Date().toISOString().slice(0,10), reach: 0, status: "Draft" };
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
    if (!form.title.trim()) return setErr("Title is required.");
    setSubmitting(true);
    setErr(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      let res;
      if (modal?.mode === "edit") {
        res = await noticesApi.update(modal.row.id, { ...form, branchId: branchScope });
      } else {
        res = await noticesApi.create({ ...form, branchId: branchScope });
      }
      onSave(res.notice);
    } catch (e: any) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!modal} onClose={onClose} title={modal?.mode === "edit" ? "Edit Notice" : "New Notice"} footer={
      <>
        <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>Save</Btn>
      </>
    }>
      {err && <div className="mb-4 text-red-500 text-sm">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" className="col-span-2"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Audience"><Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /></Field>
        <Field label="Channel"><Input value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} /></Field>
        <Field label="Type"><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Reach"><Input type="number" value={form.reach} onChange={e => setForm({ ...form, reach: parseInt(e.target.value) || 0 })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={["Draft", "Scheduled", "Sent", "Failed"]} />
        </Field>
      </div>
    </Modal>
  );
}
