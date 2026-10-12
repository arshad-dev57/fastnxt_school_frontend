"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarOff, Plus } from "lucide-react";
import { Btn, Field, Input, Modal, PageHeader, Select, StatCard, Textarea } from "@/components/ui";
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

export default function StudentLeavePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaveRequestItem[]>([]);
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
      const res = await leaveApi.mine();
      setRows(res.leave ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0 };
    for (const r of rows) c[r.status as keyof typeof c] = (c[r.status as keyof typeof c] ?? 0) + 1;
    return c;
  }, [rows]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await leaveApi.apply(form);
      setOpen(false);
      setForm({ type: "Casual", from: todayIso(), to: todayIso(), reason: "" });
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Leave Requests"
        subtitle="Apply for leave. Your class teacher and admin will both see the request."
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

      <div className="grid grid-cols-3 gap-3 px-4 pt-2 sm:px-6">
        <StatCard label="Pending" value={counts.Pending} Icon={CalendarOff} tone="orange" />
        <StatCard label="Approved" value={counts.Approved} Icon={CalendarOff} tone="green" />
        <StatCard label="Rejected" value={counts.Rejected} Icon={CalendarOff} tone="red" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Leave"
          subtitle={`Applications for ${user?.name || "you"}`}
          Icon={CalendarOff}
          nameLabel="Leave"
          rows={rows}
          loading={loading}
          keyOf={(r) => r.id}
          nameOf={(r) => r.type}
          subtitleOf={(r) => `${r.from} → ${r.to} · ${r.days} day(s)`}
          searchTextOf={(r) => `${r.type} ${r.reason} ${r.status} ${r.from} ${r.to}`}
          searchPlaceholder="Search leave"
          scopeLabel={user?.name || "My leave"}
          countNoun="requests"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k]}
          columns={[
            { key: "from", label: "From", width: "120px", cell: (r) => r.from },
            { key: "to", label: "To", width: "120px", cell: (r) => r.to },
            { key: "days", label: "Days", width: "80px", cell: (r) => r.days },
            { key: "reason", label: "Reason", width: "minmax(160px,1fr)", cell: (r) => r.reason },
            { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Type", value: r.type },
            { label: "From", value: r.from },
            { label: "To", value: r.to },
            { label: "Days", value: r.days },
            { label: "Reason", value: r.reason },
            { label: "Status", value: <StatusPill label={r.status} /> },
            { label: "Reviewed by", value: r.reviewedBy || "—" },
          ]}
          emptyTitle="No leave requests"
          emptyMessage="Apply for leave and it will appear here with its status."
          minWidth={720}
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
              Submit Request
            </Btn>
          </>
        }
      >
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
                placeholder="Why do you need leave?"
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
