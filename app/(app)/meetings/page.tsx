"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { meetingsApi, type MeetingItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog, Textarea } from "@/components/ui";

const COLORS: Record<string, string> = { Scheduled: "var(--theme-info)", Live: "var(--theme-warning)", Completed: "var(--theme-success)", Cancelled: "var(--theme-danger)" };

export default function MeetingsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(MeetingItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: MeetingItem } | null>(null);
  const [toDelete, setToDelete] = useState<MeetingItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await meetingsApi.list({ branchId: branchScope });
      setRows((res.meetings || []).map(r => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
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
      await meetingsApi.delete(toDelete.id);
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
      <BranchBoard<MeetingItem & { branchId: string }>
        title="Meetings & Appointments"
        subtitle="Schedule and track staff meetings, PTMs and committee sessions."
        Icon={Users}
        nameLabel="Meeting"
        countNoun="meetings"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.date} at ${r.time} · Organizer: ${r.organizer}`}
        searchTextOf={(r) => `${r.title} ${r.organizer} ${r.venue} ${r.description}`}
        primaryAction={
          <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Schedule Meeting</Btn>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
          { key: "time", label: "Time", width: "100px", cell: (r) => r.time },
          { key: "organizer", label: "Organizer", width: "140px", cell: (r) => r.organizer },
          { key: "venue", label: "Venue", width: "minmax(140px,1fr)", cell: (r) => r.venue },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Meeting Title", value: r.title },
          { label: "Date", value: r.date },
          { label: "Time", value: r.time },
          { label: "Venue", value: r.venue },
          { label: "Organizer", value: r.organizer },
          { label: "Status", value: r.status },
          { label: "Description", value: r.description },
        ]}
        mobileRows={(r) => [
          { label: "When", value: `${r.date} ${r.time}` },
          { label: "Venue", value: r.venue },
          { label: "Organizer", value: r.organizer },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No meetings"
        emptyMessage="No meetings match the current campus scope."
      />

      <MeetingForm
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
        title="Delete Meeting"
        message={`Remove the meeting "${toDelete?.title}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function MeetingForm({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = { title: "", date: new Date().toISOString().slice(0,10), time: "10:00", venue: "", organizer: "", status: "Scheduled", description: "", participants: [] };
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
        res = await meetingsApi.update(modal.row.id, { ...form, branchId: branchScope });
      } else {
        res = await meetingsApi.create({ ...form, branchId: branchScope });
      }
      onSave(res.meeting);
    } catch (e: any) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!modal} onClose={onClose} title={modal?.mode === "edit" ? "Edit Meeting" : "Schedule Meeting"} footer={
      <>
        <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>Save</Btn>
      </>
    }>
      {err && <div className="mb-4 text-red-500 text-sm">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Meeting Title" className="col-span-2"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Time"><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></Field>
        <Field label="Venue"><Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></Field>
        <Field label="Organizer"><Input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={["Scheduled", "Live", "Completed", "Cancelled"]} />
        </Field>
        <Field label="Description" className="col-span-2">
          <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}