"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet, Plus, CheckCircle2, Banknote, Trash2, RefreshCw, Eye, Users, Printer,
} from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, RowMenu, Select, StatCard, Textarea, rs,
} from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { PrintDocument, PrintTable, triggerPrint, useSchoolPrintMeta } from "@/components/print/print-document";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  payrollApi,
  type PayrollRunItem,
  type PayslipItem,
} from "@/lib/auth/api-client";

const COLORS: Record<string, string> = {
  Draft: "var(--theme-pending)",
  Approved: "var(--theme-info)",
  Paid: "var(--theme-success)",
};

function monthLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollPage() {
  const { currentBranchId } = useBranch();
  const { meta } = useSchoolPrintMeta();
  const [runs, setRuns] = useState<PayrollRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<{ run: PayrollRunItem; payslips: PayslipItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toDelete, setToDelete] = useState<PayrollRunItem | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.listRuns({
        branchId: currentBranchId,
        status: statusFilter !== "All" ? statusFilter : undefined,
      });
      setRuns(res.runs ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openRun = async (id: string) => {
    setActiveRunId(id);
    setDetailLoading(true);
    setError(null);
    try {
      const data = await payrollApi.getRun(id);
      setRunDetail(data);
    } catch (err) {
      setError(describeApiError(err).message);
      setRunDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const createRun = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await payrollApi.createRun({
        month,
        notes: notes.trim() || undefined,
        branchId: currentBranchId !== "all" ? currentBranchId : null,
      });
      setCreateOpen(false);
      setNotes("");
      await load();
      await openRun(res.run.id);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: "generate" | "approve" | "pay") => {
    if (!activeRunId) return;
    setActionBusy(true);
    setError(null);
    try {
      if (action === "generate") await payrollApi.generate(activeRunId);
      if (action === "approve") await payrollApi.approve(activeRunId);
      if (action === "pay") await payrollApi.pay(activeRunId);
      await openRun(activeRunId);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setActionBusy(false);
    }
  };

  const deleteRun = async () => {
    if (!toDelete) return;
    try {
      await payrollApi.deleteRun(toDelete.id);
      if (activeRunId === toDelete.id) {
        setActiveRunId(null);
        setRunDetail(null);
      }
      setToDelete(null);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const stats = useMemo(() => {
    const c = { Draft: 0, Approved: 0, Paid: 0 };
    for (const r of runs) {
      if (r.status in c) c[r.status as keyof typeof c] += 1;
    }
    return c;
  }, [runs]);

  return (
    <>
      <PageHeader
        title="Payroll Cycles"
        subtitle="Standard cycle: set salaries → create month → generate payslips → approve → mark paid."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/payroll/structures"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <Users className="h-4 w-4" /> Salary Structures
            </Link>
            <Btn variant="primary" Icon={Plus} onClick={() => setCreateOpen(true)}>
              New Cycle
            </Btn>
          </div>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        {error && (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 py-3">
          <StatCard label="Draft" value={stats.Draft} Icon={Wallet} tone="orange" />
          <StatCard label="Approved" value={stats.Approved} Icon={CheckCircle2} tone="blue" />
          <StatCard label="Paid" value={stats.Paid} Icon={Banknote} tone="green" />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            options={["All", "Draft", "Approved", "Paid"]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          />
        </div>

        <div className="space-y-3">
          {loading && (
            <p className="py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading payroll cycles…</p>
          )}
          {!loading &&
            runs.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold">{r.title || monthLabel(r.month)}</p>
                      <StatusPill label={r.status} />
                      <Badge label={r.month} />
                    </div>
                    <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
                      {r.employeeCount} employee{r.employeeCount === 1 ? "" : "s"} · Gross {rs(r.totalGross)} ·
                      Deductions {rs(r.totalDeductions)} · Net{" "}
                      <span className="font-semibold text-[var(--theme-text)]">{rs(r.totalNet)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Btn variant="secondary" size="sm" Icon={Eye} onClick={() => openRun(r.id)}>
                      Open
                    </Btn>
                    {r.status === "Draft" && (
                      <RowMenu
                        items={[
                          {
                            label: "Delete",
                            Icon: Trash2,
                            danger: true,
                            onClick: () => setToDelete(r),
                          },
                        ]}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          {!loading && runs.length === 0 && (
            <EmptyState
              Icon={Wallet}
              title="No payroll cycles"
              message="Create a monthly cycle, generate payslips from salary structures, then approve and pay."
              action={
                <Btn variant="primary" Icon={Plus} onClick={() => setCreateOpen(true)}>
                  New Cycle
                </Btn>
              }
            />
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Payroll Cycle"
        subtitle="Pick the salary month for this campus"
        width="max-w-md"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Btn>
            <Btn variant="primary" Icon={Plus} loading={saving} onClick={createRun}>
              Create Cycle
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Month">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Includes festival bonus" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!activeRunId}
        onClose={() => {
          setActiveRunId(null);
          setRunDetail(null);
        }}
        title={runDetail ? runDetail.run.title || monthLabel(runDetail.run.month) : "Payroll Cycle"}
        subtitle={
          runDetail
            ? `${runDetail.run.month} · ${runDetail.run.status} · ${runDetail.payslips.length} payslips`
            : "Loading…"
        }
        width="max-w-4xl"
        footer={
          runDetail ? (
            <>
              {runDetail.payslips.length > 0 && (
                <Btn variant="secondary" Icon={Printer} onClick={triggerPrint}>
                  Print / PDF
                </Btn>
              )}
              {runDetail.run.status === "Draft" && (
                <>
                  <Btn
                    variant="secondary"
                    Icon={RefreshCw}
                    loading={actionBusy}
                    onClick={() => runAction("generate")}
                  >
                    {runDetail.payslips.length ? "Re-generate missing" : "Generate Payslips"}
                  </Btn>
                  <Btn
                    variant="primary"
                    Icon={CheckCircle2}
                    loading={actionBusy}
                    disabled={runDetail.payslips.length === 0}
                    onClick={() => runAction("approve")}
                  >
                    Approve
                  </Btn>
                </>
              )}
              {runDetail.run.status === "Approved" && (
                <Btn variant="primary" Icon={Banknote} loading={actionBusy} onClick={() => runAction("pay")}>
                  Mark as Paid
                </Btn>
              )}
              {runDetail.run.status === "Paid" && (
                <span className="text-[13px] text-[var(--theme-success)]">
                  Paid{runDetail.run.paidAt ? ` on ${new Date(runDetail.run.paidAt).toLocaleDateString()}` : ""}
                </span>
              )}
            </>
          ) : null
        }
      >
        {detailLoading && (
          <p className="no-print py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading payslips…</p>
        )}
        {!detailLoading && runDetail && (
          <div className="space-y-3">
            <div
              className="no-print rounded-lg border px-3 py-2 text-[12.5px]"
              style={{
                borderColor: "var(--theme-border)",
                background: "var(--theme-sidebar)",
                color: COLORS[runDetail.run.status] || "var(--theme-text-muted)",
              }}
            >
              Cycle status: <strong>{runDetail.run.status}</strong>
              {" · "}Gross {rs(runDetail.run.totalGross)}
              {" · "}Deductions {rs(runDetail.run.totalDeductions)}
              {" · "}Net {rs(runDetail.run.totalNet)}
            </div>

            {runDetail.payslips.length === 0 ? (
              <div className="no-print">
                <EmptyState
                  Icon={Users}
                  title="No payslips yet"
                  message="Generate payslips from active employee salary structures."
                  action={
                    <Btn variant="primary" Icon={RefreshCw} loading={actionBusy} onClick={() => runAction("generate")}>
                      Generate Payslips
                    </Btn>
                  }
                />
              </div>
            ) : (
              <>
                <div className="no-print max-h-[40vh] overflow-auto rounded-lg border border-[var(--theme-border)]">
                  <table className="w-full min-w-[720px] text-left text-[13px]">
                    <thead className="sticky top-0 bg-[var(--theme-sidebar)] text-[var(--theme-text-muted)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Employee</th>
                        <th className="px-3 py-2 font-medium">Basic</th>
                        <th className="px-3 py-2 font-medium">Allowances</th>
                        <th className="px-3 py-2 font-medium">Deductions</th>
                        <th className="px-3 py-2 font-medium">Net</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runDetail.payslips.map((p) => (
                        <tr key={p.id} className="border-t border-[var(--theme-border)]">
                          <td className="px-3 py-2">
                            <p className="font-medium">{p.employeeName}</p>
                            <p className="text-[11px] text-[var(--theme-text-faint)]">
                              {p.designation} · {p.employeeCode}
                            </p>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{rs(p.basic)}</td>
                          <td className="px-3 py-2 tabular-nums">{rs(p.allowances)}</td>
                          <td className="px-3 py-2 tabular-nums">{rs(p.deductions)}</td>
                          <td className="px-3 py-2 font-semibold tabular-nums">{rs(p.net)}</td>
                          <td className="px-3 py-2">
                            <StatusPill label={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="hidden print:block">
                <PrintDocument
                  title="Payroll Register"
                  subtitle={`${monthLabel(runDetail.run.month)} · ${runDetail.run.status} · ${runDetail.payslips.length} payslips · Net ${rs(runDetail.run.totalNet)}`}
                  meta={meta}
                  preparedBy="Payroll / Accounts"
                  className="!shadow-none !ring-0"
                >
                  <div className="mb-3 grid grid-cols-3 gap-2 border border-neutral-400 text-[11px]">
                    <div className="border-r border-neutral-400 p-2">
                      <p className="text-neutral-600">Gross</p>
                      <p className="font-bold tabular-nums">{rs(runDetail.run.totalGross)}</p>
                    </div>
                    <div className="border-r border-neutral-400 p-2">
                      <p className="text-neutral-600">Deductions</p>
                      <p className="font-bold tabular-nums">{rs(runDetail.run.totalDeductions)}</p>
                    </div>
                    <div className="p-2">
                      <p className="text-neutral-600">Net Payable</p>
                      <p className="font-bold tabular-nums">{rs(runDetail.run.totalNet)}</p>
                    </div>
                  </div>
                  <PrintTable
                    columns={[
                      { label: "#", width: "36px" },
                      { label: "Employee" },
                      { label: "Code", width: "80px" },
                      { label: "Basic", align: "right", width: "80px" },
                      { label: "Allow.", align: "right", width: "80px" },
                      { label: "Deduct.", align: "right", width: "80px" },
                      { label: "Net", align: "right", width: "90px" },
                      { label: "Status", width: "70px" },
                    ]}
                  >
                    {runDetail.payslips.map((p, i) => (
                      <tr key={p.id} className="border-b border-neutral-300">
                        <td className="px-2 py-1.5 text-neutral-600">{i + 1}</td>
                        <td className="px-2 py-1.5 font-medium">
                          {p.employeeName}
                          <span className="block text-[10px] font-normal text-neutral-600">{p.designation}</span>
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[11px]">{p.employeeCode}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{rs(p.basic)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{rs(p.allowances)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{rs(p.deductions)}</td>
                        <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{rs(p.net)}</td>
                        <td className="px-2 py-1.5">{p.status}</td>
                      </tr>
                    ))}
                  </PrintTable>
                </PrintDocument>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={deleteRun}
        title="Delete payroll cycle"
        confirmLabel="Delete"
        message={`Delete “${toDelete?.title || toDelete?.month}”? Generated payslips will be removed.`}
      />
    </>
  );
}
