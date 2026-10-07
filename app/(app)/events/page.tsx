"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { eventsApi, type EventItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog } from "@/components/ui";

const COLORS: Record<string, string> = { Upcoming: "var(--theme-info)", Ongoing: "var(--theme-warning)", Completed: "var(--theme-success)" };

export default function EventsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(EventItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: EventItem } | null>(null);
  const [toDelete, setToDelete] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await eventsApi.list({ branchId: branchScope });
      setRows((res.events || []).map(r => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load events");
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
      await eventsApi.delete(toDelete.id);
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
      <BranchBoard<EventItem & { branchId: string }>
        title="Events & Academic Calendar"
        subtitle="Branch-specific and institution-wide events, exams, PTMs and activities."
        Icon={CalendarDays}
        nameLabel="Event"
        countNoun="events"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.type} · ${r.startDate}`}
        searchTextOf={(r) => `${r.title} ${r.type} ${r.venue} ${r.audience}`}
        primaryAction={
          <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Event</Btn>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "type", label: "Type", width: "120px", cell: (r) => r.type },
          { key: "start", label: "Start", width: "120px", cell: (r) => r.startDate },
          { key: "end", label: "End", width: "120px", cell: (r) => r.endDate },
          { key: "venue", label: "Venue", width: "minmax(140px,1fr)", cell: (r) => r.venue },
          { key: "audience", label: "Audience", width: "minmax(140px,1fr)", cell: (r) => r.audience },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Event", value: r.title },
          { label: "Type", value: r.type },
          { label: "Start", value: r.startDate },
          { label: "End", value: r.endDate },
          { label: "Venue", value: r.venue },
          { label: "Audience", value: r.audience },
          { label: "Status", value: r.status },
        ]}
        mobileRows={(r) => [
          { label: "Type", value: r.type },
          { label: "When", value: `${r.startDate}${r.endDate !== r.startDate ? ` → ${r.endDate}` : ""}` },
          { label: "Venue", value: r.venue },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No events"
        emptyMessage="No events match the current campus scope."
      />

      <EventForm
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
        title="Delete Event"
        message={`Remove the event "${toDelete?.title}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function EventForm({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = { title: "", type: "", startDate: new Date().toISOString().slice(0,10), endDate: new Date().toISOString().slice(0,10), venue: "", audience: "", status: "Upcoming" };
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
        res = await eventsApi.update(modal.row.id, { ...form, branchId: branchScope });
      } else {
        res = await eventsApi.create({ ...form, branchId: branchScope });
      }
      onSave(res.event);
    } catch (e: any) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!modal} onClose={onClose} title={modal?.mode === "edit" ? "Edit Event" : "New Event"} footer={
      <>
        <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>Save</Btn>
      </>
    }>
      {err && <div className="mb-4 text-red-500 text-sm">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" className="col-span-2"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Type"><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} /></Field>
        <Field label="Audience"><Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /></Field>
        <Field label="Start Date"><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
        <Field label="End Date"><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
        <Field label="Venue"><Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={["Upcoming", "Ongoing", "Completed", "Cancelled"]} />
        </Field>
      </div>
    </Modal>
  );
}
