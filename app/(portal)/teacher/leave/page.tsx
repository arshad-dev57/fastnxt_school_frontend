"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarOff, CheckCircle2, Plus, XCircle } from "lucide-react";
import {
  Btn,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Textarea,
} from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { useAuth } from "@/lib/auth/auth-context";
import {
  describeApiError,
  leaveApi,
  type LeaveRequestItem,
} from "@/lib/auth/api-client";

const COLORS: Record<string, string> = {
  Pending: "var(--theme-warning)",
  Approved: "var(--theme-success)",
  Rejected: "var(--theme-danger)",
};

const LEAVE_TYPES = ["Medical", "Casual", "Annual", "Sick"] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherLeavePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"mine" | "students">("students");
  const [mine, setMine] = useState<LeaveRequestItem[]>([]);
  const [students, setStudents] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "Casual",
    from: todayIso(),
    to: todayIso(),
    reason: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [mineRes, classRes] = await Promise.all([
        leaveApi.mine(),
        leaveApi.classStudents(),
      ]);
      setMine(mineRes.leave ?? []);
      setStudents(classRes.leave ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setMine([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = tab === "mine" ? mine : students;

  const pendingStudents = useMemo(
    () => students.filter((r) => r.status === "Pending").length,
    [students]
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await leaveApi.apply(form);
      setOpen(false);
      setForm({ type: "Casual", from: todayIso(), to: todayIso(), reason: "" });
      setTab("mine");
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const review = async (row: LeaveRequestItem, status: "Approved" | "Rejected") => {
    try {
      await leaveApi.review(row.id, { status });
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Leave"
        subtitle="Apply for your own leave (admin reviews). Class-student requests appear here for you."
        actions={
          <Btn variant="primary" Icon={Plus} onClick={() => setOpen(true)}>
            Apply Leave
          </Btn>
        }
      />

      {error ? (
        <p className="mx-4 mb-2 rounded-lg bg-[var(--theme-danger-soft,rgba(220,38,38,0.08))] px-3 py-2 text-[13px] text-[var(--theme-danger)] sm:mx-6">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 px-4 pt-2 sm:px-6">
        <button
          type="button"
          onClick={() => setTab("students")}
          className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
            tab === "students"
              ? "bg-[var(--theme-primary)] text-white"
              : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]"
          }`}
        >
          Student Requests{pendingStudents ? ` (${pendingStudents})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
            tab === "mine"
              ? "bg-[var(--theme-primary)] text-white"
              : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]"
          }`}
        >
          My Leave
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-3 sm:px-6">
        <StatCard
          label="Student Pending"
          value={pendingStudents}
          Icon={CalendarOff}
          tone="orange"
          sub="Needs your review"
        />
        <StatCard
          label="My Pending"
          value={mine.filter((r) => r.status === "Pending").length}
          Icon={CalendarOff}
          tone="blue"
          sub="Sent to admin"
        />
        <StatCard
          label="My Approved"
          value={mine.filter((r) => r.status === "Approved").length}
          Icon={CalendarOff}
          tone="green"
        />
      </div>

      <div className="mt-2">
        <PortalBoard
          title={tab === "mine" ? "My Leave Applications" : "Class Student Leave"}
          subtitle={
            tab === "mine"
              ? "Your leave goes to admin only."
              : "Students from classes where you are the class teacher."
          }
          Icon={CalendarOff}
          nameLabel={tab === "mine" ? "Leave" : "Student"}
          rows={rows}
          loading={loading}
          keyOf={(r) => r.id}
          nameOf={(r) => (tab === "mine" ? r.type : r.person)}
          subtitleOf={(r) =>
            tab === "mine"
              ? `${r.from} → ${r.to} · ${r.days} day(s)`
              : `${r.cls}-${r.section} · ${r.type}`
          }
          searchTextOf={(r) =>
            `${r.person} ${r.type} ${r.reason} ${r.status} ${r.cls || ""} ${r.section || ""}`
          }
          searchPlaceholder="Search leave"
          scopeLabel={tab === "mine" ? "My leave" : "My class students"}
          countNoun="requests"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k]}
          menu={(r) =>
            tab === "students" && r.status === "Pending"
              ? [
                  {
                    label: "Approve",
                    Icon: CheckCircle2,
                    onClick: () => review(r, "Approved"),
                  },
                  {
                    label: "Reject",
                    Icon: XCircle,
                    onClick: () => review(r, "Rejected"),
                  },
                ]
              : []
          }
          columns={
            tab === "mine"
              ? [
                  { key: "type", label: "Type", width: "110px", cell: (r) => r.type },
                  { key: "from", label: "From", width: "120px", cell: (r) => r.from },
                  { key: "to", label: "To", width: "120px", cell: (r) => r.to },
                  { key: "days", label: "Days", width: "80px", cell: (r) => r.days },
                  { key: "reason", label: "Reason", width: "minmax(160px,1fr)", cell: (r) => r.reason },
                  { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
                ]
              : [
                  { key: "cls", label: "Class", width: "120px", cell: (r) => `${r.cls}-${r.section}` },
                  { key: "type", label: "Type", width: "110px", cell: (r) => r.type },
                  { key: "from", label: "From", width: "120px", cell: (r) => r.from },
                  { key: "to", label: "To", width: "120px", cell: (r) => r.to },
                  { key: "reason", label: "Reason", width: "minmax(140px,1fr)", cell: (r) => r.reason },
                  { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
                ]
          }
          detailFields={(r) => [
            { label: "Applicant", value: r.person },
            { label: "Role", value: r.role },
            { label: "Type", value: r.type },
            { label: "From", value: r.from },
            { label: "To", value: r.to },
            { label: "Days", value: r.days },
            { label: "Reason", value: r.reason },
            { label: "Status", value: <StatusPill label={r.status} /> },
            { label: "Reviewed by", value: r.reviewedBy || "—" },
          ]}
          emptyTitle={
            tab === "mine" ? "No leave applications" : "No student leave requests"
          }
          emptyMessage={
            tab === "mine"
              ? "Apply for leave and admin will review it."
              : "When your class students apply for leave, requests appear here."
          }
          minWidth={780}
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={submit} loading={saving} loadingLabel="Submitting…">
              Submit to Admin
            </Btn>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-[var(--theme-text-muted)]">
          Teacher leave is sent to admin only — not to other teachers.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Leave Type">
            <Select
              options={[...LEAVE_TYPES]}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={form.from}
              onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reason">
              <Textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Reason for leave"
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
