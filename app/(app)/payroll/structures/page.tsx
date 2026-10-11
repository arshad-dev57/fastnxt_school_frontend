"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, RowMenu, SearchBox, Select, Textarea, Toggle, rs,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  employeesApi,
  payrollApi,
  type EmployeeItem,
  type SalaryStructureItem,
} from "@/lib/auth/api-client";

type FormState = {
  employeeId: string;
  basic: string;
  houseRent: string;
  transport: string;
  medical: string;
  otherAllow: string;
  tax: string;
  providentFund: string;
  otherDeduct: string;
  effectiveFrom: string;
  status: "Active" | "Inactive";
  notes: string;
};

const blankForm = (): FormState => ({
  employeeId: "",
  basic: "",
  houseRent: "0",
  transport: "0",
  medical: "0",
  otherAllow: "0",
  tax: "0",
  providentFund: "0",
  otherDeduct: "0",
  effectiveFrom: "",
  status: "Active",
  notes: "",
});

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export default function SalaryStructuresPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<SalaryStructureItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: SalaryStructureItem } | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<SalaryStructureItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [structRes, empRes] = await Promise.all([
        payrollApi.listStructures({ branchId: currentBranchId }),
        employeesApi.list({ status: "Active", branchId: currentBranchId !== "all" ? currentBranchId : undefined }),
      ]);
      setRows(structRes.structures ?? []);
      setEmployees(empRes.employees ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(needle) ||
        r.employeeCode.toLowerCase().includes(needle) ||
        r.designation.toLowerCase().includes(needle) ||
        r.department.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const employeeOptions = useMemo(() => {
    const taken = new Set(rows.map((r) => r.employeeId));
    return employees
      .filter((e) => modal?.mode === "edit" || !taken.has(e.id))
      .map((e) => `${e.name} · ${e.employeeId} · ${e.id}`);
  }, [employees, rows, modal?.mode]);

  const openAdd = () => {
    setForm(blankForm());
    setModal({ mode: "add" });
  };

  const openEdit = (row: SalaryStructureItem) => {
    setForm({
      employeeId: row.employeeId,
      basic: String(row.basic),
      houseRent: String(row.houseRent),
      transport: String(row.transport),
      medical: String(row.medical),
      otherAllow: String(row.otherAllow),
      tax: String(row.tax),
      providentFund: String(row.providentFund),
      otherDeduct: String(row.otherDeduct),
      effectiveFrom: row.effectiveFrom || "",
      status: row.status === "Inactive" ? "Inactive" : "Active",
      notes: row.notes || "",
    });
    setModal({ mode: "edit", row });
  };

  const preview = useMemo(() => {
    const basic = num(form.basic);
    const allowances = num(form.houseRent) + num(form.transport) + num(form.medical) + num(form.otherAllow);
    const deductions = num(form.tax) + num(form.providentFund) + num(form.otherDeduct);
    const gross = basic + allowances;
    const net = Math.max(0, gross - deductions);
    return { allowances, deductions, gross, net };
  }, [form]);

  const save = async () => {
    const employeeId =
      modal?.mode === "edit"
        ? form.employeeId
        : form.employeeId.includes(" · ")
          ? form.employeeId.split(" · ").pop() || ""
          : form.employeeId;

    if (!employeeId) {
      setError("Select an employee.");
      return;
    }
    if (!form.basic || num(form.basic) <= 0) {
      setError("Basic salary is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        employeeId,
        basic: num(form.basic),
        houseRent: num(form.houseRent),
        transport: num(form.transport),
        medical: num(form.medical),
        otherAllow: num(form.otherAllow),
        tax: num(form.tax),
        providentFund: num(form.providentFund),
        otherDeduct: num(form.otherDeduct),
        effectiveFrom: form.effectiveFrom || null,
        status: form.status,
        notes: form.notes,
        branchId: currentBranchId !== "all" ? currentBranchId : null,
      };

      if (modal?.mode === "edit" && modal.row) {
        const res = await payrollApi.updateStructure(modal.row.id, payload);
        setRows((p) => p.map((r) => (r.id === res.structure.id ? res.structure : r)));
      } else {
        const res = await payrollApi.upsertStructure(payload);
        setRows((p) => {
          const without = p.filter((r) => r.employeeId !== res.structure.employeeId);
          return [res.structure, ...without].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        });
      }
      setModal(null);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await payrollApi.deleteStructure(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Salary Structures"
        subtitle="Set basic pay, allowances and deductions for each employee. Used when generating a payroll cycle."
        back={
          <Link
            href="/payroll"
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-[var(--theme-border-strong)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
            aria-label="Back to payroll"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
        actions={
          <Btn variant="primary" Icon={Plus} onClick={openAdd}>
            Set Salary
          </Btn>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        {error && (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        )}

        <div className="py-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search employee" className="w-full sm:w-72" />
        </div>

        <div className="space-y-3">
          {loading && (
            <p className="py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading salary structures…</p>
          )}
          {!loading &&
            filtered.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold">{r.employeeName}</p>
                      <Badge label={r.status} />
                      <span className="font-mono text-[11px] text-[var(--theme-text-faint)]">{r.employeeCode}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[var(--theme-text-muted)]">
                      {r.designation} · {r.department}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
                      Basic {rs(r.basic)} · Allowances {rs(r.allowances)} · Deductions {rs(r.deductions)} · Net{" "}
                      <span className="font-semibold text-[var(--theme-text)]">{rs(r.net)}</span>
                    </p>
                  </div>
                  <RowMenu
                    items={[
                      { label: "Edit", Icon: Pencil, onClick: () => openEdit(r) },
                      { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                    ]}
                  />
                </div>
              </Card>
            ))}
          {!loading && filtered.length === 0 && (
            <EmptyState
              Icon={Wallet}
              title="No salary structures"
              message="Set basic pay and allowances for employees before running payroll."
              action={
                <Btn variant="primary" Icon={Plus} onClick={openAdd}>
                  Set Salary
                </Btn>
              }
            />
          )}
        </div>
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Salary Structure" : "Set Employee Salary"}
        subtitle="Amounts are in PKR and feed the next payroll generation"
        width="max-w-2xl"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </Btn>
            <Btn variant="primary" Icon={CheckCircle2} loading={saving} onClick={save}>
              Save Structure
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          {modal?.mode === "add" ? (
            <Field label="Employee">
              <Select
                options={employeeOptions.length ? employeeOptions : ["No active employees without a structure"]}
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="Select employee"
              />
            </Field>
          ) : (
            <Field label="Employee">
              <Input value={modal?.row?.employeeName || ""} disabled />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["basic", "Basic"],
                ["houseRent", "House Rent"],
                ["transport", "Transport"],
                ["medical", "Medical"],
                ["otherAllow", "Other Allow."],
                ["tax", "Tax"],
                ["providentFund", "Provident Fund"],
                ["otherDeduct", "Other Deduct."],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <Input
                  type="number"
                  min={0}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>

          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-3 py-2 text-[13px] text-[var(--theme-text-muted)]">
            Allowances {rs(preview.allowances)} · Deductions {rs(preview.deductions)} · Gross {rs(preview.gross)} ·{" "}
            <span className="font-semibold text-[var(--theme-text)]">Net {rs(preview.net)}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Effective from">
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
              />
            </Field>
            <div className="flex items-end gap-3 pb-1">
              <span className="text-[13px] font-medium">Status</span>
              <Toggle
                checked={form.status === "Active"}
                onChange={(v) => setForm((f) => ({ ...f, status: v ? "Active" : "Inactive" }))}
                label={form.status}
              />
            </div>
          </div>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete salary structure"
        confirmLabel="Delete"
        message={`Remove salary structure for “${toDelete?.employeeName}”? Existing payslips are kept.`}
      />
    </>
  );
}
