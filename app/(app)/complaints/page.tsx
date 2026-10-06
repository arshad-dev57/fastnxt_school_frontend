"use client";

import { useEffect, useState } from "react";
import { MessageSquareWarning, Plus, CheckCircle2, Clock, Trash2, Edit3 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { Btn, Field, Input, Modal, Select } from "@/components/ui";
import { ticketsApi, describeApiError, type TicketItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export type TicketRow = {
  id: string;
  branchId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  raisedBy: string;
  assignedTo: string;
  due: string;
  description?: string;
};

const COLORS: Record<string, string> = {
  Open: "var(--theme-danger)",
  "In Progress": "var(--theme-warning)",
  Resolved: "var(--theme-success)",
  Closed: "var(--theme-pending)",
};

const PRIORITY_COLOR: Record<string, string> = {
  High: "var(--theme-danger)",
  Medium: "var(--theme-warning)",
  Low: "var(--theme-info)",
};

export default function ComplaintsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editTicket, setEditTicket] = useState<TicketRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "IT Support",
    priority: "Medium",
    status: "Open",
    raisedBy: "",
    assignedTo: "",
    due: "",
    description: "",
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketsApi.list({ branchId: currentBranchId !== "all" ? currentBranchId : undefined });
      const items: TicketRow[] = res.tickets.map((t) => ({
        id: t.id,
        branchId: t.branchId || (currentBranchId !== "all" ? currentBranchId : "B-MAIN"),
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        raisedBy: t.raisedBy,
        assignedTo: t.assignedTo,
        due: t.due,
        description: t.description,
      }));
      setRows(items);
    } catch (err) {
      console.warn("Could not fetch tickets from backend API:", describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentBranchId]);

  const handleCreateOrUpdate = async () => {
    if (!form.title.trim()) {
      alert("Ticket title is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editTicket) {
        const res = await ticketsApi.update(editTicket.id, {
          title: form.title,
          category: form.category,
          priority: form.priority,
          status: form.status,
          raisedBy: form.raisedBy,
          assignedTo: form.assignedTo,
          due: form.due,
          description: form.description,
        });
        setRows((p) => p.map((r) => (r.id === res.ticket.id ? {
          id: res.ticket.id,
          branchId: res.ticket.branchId || editTicket.branchId,
          title: res.ticket.title,
          category: res.ticket.category,
          priority: res.ticket.priority,
          status: res.ticket.status,
          raisedBy: res.ticket.raisedBy,
          assignedTo: res.ticket.assignedTo,
          due: res.ticket.due,
          description: res.ticket.description,
        } : r)));
      } else {
        const res = await ticketsApi.create({
          title: form.title,
          category: form.category,
          priority: form.priority,
          status: form.status,
          raisedBy: form.raisedBy,
          assignedTo: form.assignedTo,
          due: form.due,
          description: form.description,
          branchId: currentBranchId !== "all" ? currentBranchId : undefined,
        });
        const newTicket: TicketRow = {
          id: res.ticket.id,
          branchId: res.ticket.branchId || (currentBranchId !== "all" ? currentBranchId : "B-MAIN"),
          title: res.ticket.title,
          category: res.ticket.category,
          priority: res.ticket.priority,
          status: res.ticket.status,
          raisedBy: res.ticket.raisedBy,
          assignedTo: res.ticket.assignedTo,
          due: res.ticket.due,
          description: res.ticket.description,
        };
        setRows((p) => [newTicket, ...p]);
      }
      setOpenModal(false);
      setEditTicket(null);
      setForm({ title: "", category: "IT Support", priority: "Medium", status: "Open", raisedBy: "", assignedTo: "", due: "", description: "" });
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticket: TicketRow, newStatus: string) => {
    try {
      await ticketsApi.update(ticket.id, { status: newStatus });
      setRows((p) => p.map((r) => (r.id === ticket.id ? { ...r, status: newStatus } : r)));
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await ticketsApi.delete(ticketId);
      setRows((p) => p.filter((r) => r.id !== ticketId));
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const openAddModal = () => {
    setEditTicket(null);
    setForm({ title: "", category: "IT Support", priority: "Medium", status: "Open", raisedBy: "", assignedTo: "", due: "", description: "" });
    setOpenModal(true);
  };

  const openEditModal = (t: TicketRow) => {
    setEditTicket(t);
    setForm({
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      raisedBy: t.raisedBy,
      assignedTo: t.assignedTo,
      due: t.due,
      description: t.description || "",
    });
    setOpenModal(true);
  };

  return (
    <>
      <BranchBoard<TicketRow>
        title="Complaints & Support Tickets"
        subtitle="Support tickets with category, priority, assignment and SLA due dates connected to backend API."
        Icon={MessageSquareWarning}
        nameLabel="Ticket"
        countNoun="tickets"
        rows={rows}
        loading={loading}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.category} · raised by ${r.raisedBy}`}
        searchTextOf={(r) => `${r.title} ${r.category} ${r.raisedBy} ${r.assignedTo} ${r.status}`}
        primaryAction={
          <Btn variant="primary" Icon={Plus} onClick={openAddModal}>Add Ticket</Btn>
        }
        menu={(r) => [
          { label: "Edit Ticket", Icon: Edit3, onClick: () => openEditModal(r) },
          { label: "Mark In Progress", Icon: Clock, onClick: () => handleUpdateStatus(r, "In Progress") },
          { label: "Mark Resolved", Icon: CheckCircle2, onClick: () => handleUpdateStatus(r, "Resolved") },
          { label: "Delete Ticket", Icon: Trash2, danger: true, onClick: () => handleDelete(r.id) },
        ]}
        columns={[
          { key: "category", label: "Category", width: "130px", cell: (r) => r.category },
          { key: "priority", label: "Priority", width: "110px", cell: (r) => <span className="font-medium" style={{ color: PRIORITY_COLOR[r.priority] }}>{r.priority}</span> },
          { key: "raised", label: "Raised By", width: "minmax(130px,1fr)", cell: (r) => r.raisedBy },
          { key: "assigned", label: "Assigned To", width: "minmax(140px,1fr)", cell: (r) => r.assignedTo },
          { key: "due", label: "Due", width: "120px", cell: (r) => r.due },
          { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Ticket", value: r.title },
          { label: "Category", value: r.category },
          { label: "Priority", value: r.priority },
          { label: "Raised By", value: r.raisedBy },
          { label: "Assigned To", value: r.assignedTo },
          { label: "Due", value: r.due },
          { label: "Status", value: r.status },
          { label: "Description", value: r.description || "N/A" },
        ]}
        mobileRows={(r) => [
          { label: "Category", value: r.category },
          { label: "Priority", value: r.priority },
          { label: "Due", value: r.due },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No tickets found"
        emptyMessage="Click 'Add Ticket' to create a new complaint or support ticket."
      />

      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editTicket ? "Edit Ticket" : "New Ticket"} subtitle="Support and complaint management" width="max-w-lg"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setOpenModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreateOrUpdate} disabled={isSubmitting}>
              {editTicket ? "Save Changes" : "Create Ticket"}
            </Btn>
          </>
        }>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ticket Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Projector in Lab 2 not working" />
          </Field>
          <Field label="Category">
            <Select options={["IT Support", "Maintenance", "Academic", "Billing", "Transport", "General"]} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <Field label="Priority">
            <Select options={["High", "Medium", "Low"]} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
          </Field>
          <Field label="Status">
            <Select options={["Open", "In Progress", "Resolved", "Closed"]} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} />
          </Field>
          <Field label="Due Date">
            <Input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
          </Field>
          <Field label="Raised By">
            <Input value={form.raisedBy} onChange={(e) => setForm((f) => ({ ...f, raisedBy: e.target.value }))} placeholder="Reporter name" />
          </Field>
          <Field label="Assigned To">
            <Input value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} placeholder="Assignee name" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Detailed issue description..." />
          </Field>
        </div>
      </Modal>
    </>
  );
}
