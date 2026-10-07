"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { UserPlus, DoorOpen, Plus, Pencil, Trash2, UserCheck, Users } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { admissionsApi, type AdmissionEnquiryItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog } from "@/components/ui";

const COLORS: Record<string, string> = {
  Enquiry: "var(--theme-pending)", "Follow-up": "var(--theme-info)", Application: "var(--theme-primary)",
  Test: "var(--theme-accent-2)", Approved: "var(--theme-success)", Admitted: "var(--theme-success)", Rejected: "var(--theme-danger)",
};

export default function AdmissionsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(AdmissionEnquiryItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: AdmissionEnquiryItem } | null>(null);
  const [toDelete, setToDelete] = useState<AdmissionEnquiryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await admissionsApi.list({ branchId: branchScope });
      setRows((res.enquiries || []).map(r => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load enquiries");
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
      await admissionsApi.delete(toDelete.id);
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
      <BranchBoard<AdmissionEnquiryItem & { branchId: string }>
        title="Admission Pipeline"
        subtitle="Enquiry → follow-up → application → test → approval → admission."
        Icon={UserPlus}
        nameLabel="Applicant"
        countNoun="enquiries"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.stage}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.applicant}
        subtitleOf={(r) => `${r.cls} · Guardian: ${r.guardian}`}
        searchTextOf={(r) => `${r.applicant} ${r.guardian} ${r.phone} ${r.cls} ${r.stage}`}
        primaryAction={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/students/new" className="h-9 items-center gap-1.5 rounded bg-[var(--theme-success)] px-3 text-[13px] font-semibold text-white hover:opacity-90 inline-flex shadow-sm">
              <UserCheck className="h-4 w-4" /> New Admission Form
            </Link>
            <Link href="/front-office" className="hidden h-9 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] font-medium hover:bg-[var(--theme-hover)] lg:inline-flex">
              <DoorOpen className="h-4 w-4" /> Front Office
            </Link>
            <Link href="/students" className="hidden h-9 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] font-medium hover:bg-[var(--theme-hover)] xl:inline-flex">
              <Users className="h-4 w-4" /> Enrolled Students
            </Link>
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Lead/Enquiry</Btn>
          </div>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "cls", label: "Applied For", width: "120px", cell: (r) => r.cls },
          { key: "guardian", label: "Guardian", width: "minmax(150px,1fr)", cell: (r) => r.guardian },
          { key: "phone", label: "Phone", width: "140px", cell: (r) => r.phone },
          { key: "source", label: "Source", width: "120px", cell: (r) => r.source },
          { key: "follow", label: "Next Follow-up", width: "140px", cell: (r) => r.followUp },
          { key: "stage", label: "Stage", width: "130px", cell: (r) => <StatusPill label={r.stage} /> },
        ]}
        detailFields={(r) => [
          { label: "Applicant", value: r.applicant },
          { label: "Guardian", value: r.guardian },
          { label: "Phone", value: r.phone },
          { label: "Applied For", value: r.cls },
          { label: "Source", value: r.source },
          { label: "Stage", value: r.stage },
          { label: "Next Follow-up", value: r.followUp },
          { label: "Counselor", value: r.counselor },
        ]}
        mobileRows={(r) => [
          { label: "Class", value: r.cls },
          { label: "Guardian", value: r.guardian },
          { label: "Follow-up", value: r.followUp },
          { label: "Stage", value: <StatusPill label={r.stage} /> },
        ]}
        emptyTitle="No enquiries"
        emptyMessage="No admission enquiries match the current campus scope."
      />

      <AdmissionForm
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
        title="Delete Enquiry"
        message={`Remove the admission enquiry for "${toDelete?.applicant}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function AdmissionForm({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = { applicant: "", guardian: "", phone: "", cls: "", source: "", followUp: "", counselor: "", stage: "Enquiry" };
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
    if (!form.applicant.trim()) return setErr("Applicant is required.");
    setSubmitting(true);
    setErr(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      let res;
      if (modal?.mode === "edit") {
        res = await admissionsApi.update(modal.row.id, { ...form, branchId: branchScope });
      } else {
        res = await admissionsApi.create({ ...form, branchId: branchScope });
      }
      onSave(res.enquiry);
    } catch (e: any) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!modal} onClose={onClose} title={modal?.mode === "edit" ? "Edit Enquiry" : "New Enquiry"} footer={
      <>
        <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>Save</Btn>
      </>
    }>
      {err && <div className="mb-4 text-red-500 text-sm">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Applicant"><Input value={form.applicant} onChange={e => setForm({ ...form, applicant: e.target.value })} /></Field>
        <Field label="Guardian"><Input value={form.guardian} onChange={e => setForm({ ...form, guardian: e.target.value })} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Class"><Input value={form.cls} onChange={e => setForm({ ...form, cls: e.target.value })} /></Field>
        <Field label="Stage">
          <Select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} options={["Enquiry", "Follow-up", "Application", "Test", "Approved", "Admitted", "Rejected"]} />
        </Field>
        <Field label="Source"><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></Field>
        <Field label="Next Follow-up"><Input type="date" value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })} /></Field>
        <Field label="Counselor"><Input value={form.counselor} onChange={e => setForm({ ...form, counselor: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
