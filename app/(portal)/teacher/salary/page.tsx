"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { Card, EmptyState, PageHeader, StatCard, rs } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { useAuth } from "@/lib/auth/auth-context";
import { describeApiError, payrollApi, type PayslipItem } from "@/lib/auth/api-client";

function monthLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function TeacherSalaryPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [employeeName, setEmployeeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PayslipItem | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.mine();
      setPayslips(res.payslips ?? []);
      setEmployeeName(res.employee?.name || user.name || "");
      setSelected((prev) => {
        const list = res.payslips ?? [];
        if (prev && list.some((p) => p.id === prev.id)) return prev;
        return list[0] || null;
      });
    } catch (err) {
      setError(describeApiError(err).message);
      setPayslips([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    for (const p of payslips) {
      if (p.status === "Paid") paid += 1;
      else unpaid += 1;
    }
    return { paid, unpaid, total: payslips.length };
  }, [payslips]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="My Salary"
        subtitle={
          employeeName
            ? `Month-wise payslips for ${employeeName}. See which months are paid or still pending.`
            : "Month-wise payslips once admin runs and approves payroll."
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        {error && (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 py-3">
          <StatCard label="Months" value={counts.total} Icon={Wallet} tone="blue" />
          <StatCard label="Paid" value={counts.paid} Icon={Wallet} tone="green" />
          <StatCard label="Unpaid" value={counts.unpaid} Icon={Wallet} tone="orange" />
        </div>

        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--theme-text-muted)]">Loading salary…</p>
        )}

        {!loading && payslips.length === 0 && !error && (
          <EmptyState
            Icon={Wallet}
            title="No salary records yet"
            message="When admin generates and approves your payroll for a month, it will show here with Paid / Unpaid status."
          />
        )}

        {!loading && payslips.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              {payslips.map((p) => {
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-[var(--theme-primary)] bg-[var(--theme-active-bg)]"
                        : "border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-hover)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">{monthLabel(p.month)}</p>
                      <p className="text-[12px] text-[var(--theme-text-muted)]">{rs(p.net)}</p>
                    </div>
                    <StatusPill label={p.status === "Paid" ? "Paid" : "Unpaid"} />
                  </button>
                );
              })}
            </div>

            {selected && (
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[18px] font-bold">{monthLabel(selected.month)}</p>
                    <p className="text-[13px] text-[var(--theme-text-muted)]">
                      {selected.designation} · {selected.employeeCode}
                    </p>
                  </div>
                  <StatusPill label={selected.status === "Paid" ? "Paid" : "Approved · Unpaid"} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Basic</p>
                    <p className="text-[15px] font-semibold">{rs(selected.basic)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Allowances</p>
                    <p className="text-[15px] font-semibold">{rs(selected.allowances)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Deductions</p>
                    <p className="text-[15px] font-semibold">{rs(selected.deductions)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Net Pay</p>
                    <p className="text-[15px] font-semibold text-[var(--theme-primary)]">{rs(selected.net)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-3 text-[13px] sm:grid-cols-2">
                  <p>House Rent: {rs(selected.houseRent)}</p>
                  <p>Transport: {rs(selected.transport)}</p>
                  <p>Medical: {rs(selected.medical)}</p>
                  <p>Other Allowances: {rs(selected.otherAllow)}</p>
                  <p>Tax: {rs(selected.tax)}</p>
                  <p>Provident Fund: {rs(selected.providentFund)}</p>
                  <p>Other Deductions: {rs(selected.otherDeduct)}</p>
                  <p>
                    Paid on:{" "}
                    {selected.paidAt
                      ? new Date(selected.paidAt).toLocaleDateString()
                      : selected.status === "Paid"
                        ? "—"
                        : "Not paid yet"}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
