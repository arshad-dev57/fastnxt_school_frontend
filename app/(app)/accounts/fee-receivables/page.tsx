"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, ArrowUpDown, HandCoins, DollarSign, RefreshCw, CheckCircle2 } from "lucide-react";
import { Btn, Field, Input, Modal, Select, StatCard, rs } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton } from "@/components/skeleton";
import { accountsApi, type CashBankAccountItem, type ReceivableItem, type ReceivablesResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const STATUSES = ["Paid", "Partial", "Pending", "Overdue"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

function cashBankLabel(a: CashBankAccountItem) {
  const num = a.number && a.number !== "—" ? a.number : "";
  return num ? `${a.name} (${num})` : a.name;
}

export default function FeeReceivablesPage() {
  const { currentBranchId } = useBranch();
  const [data, setData] = useState<ReceivablesResponse | null>(null);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cls, setCls] = useState("");
  const [view, setView] = useState<BoardView>("table");

  // Collect Fee modal
  const [collecting, setCollecting] = useState<ReceivableItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [collectSaving, setCollectSaving] = useState(false);
  const [collectErr, setCollectErr] = useState<string | null>(null);

  const fetchReceivables = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.listReceivables({ branchId: branchScope });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load fee receivables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
    fetchReceivables();
    accountsApi
      .listBankAccounts({ branchId: branchScope })
      .then((res) => setCashBankAccounts((res.accounts || []).filter((a) => a.isActive !== false)))
      .catch(() => {});
  }, [currentBranchId]);

  const rows = data?.rows || [];
  const summary = data?.summary || { total: 0, currentDue: 0, overdue: 0, collected: 0, totalCount: 0 };

  const classList = useMemo(() => [...new Set(rows.map((r) => r.cls))], [rows]);

  const cashBankOptions = useMemo(() => {
    if (payMethod === "Cash") return cashBankAccounts.filter((a) => a.kind === "Cash");
    const banks = cashBankAccounts.filter((a) => a.kind === "Bank");
    return banks.length > 0 ? banks : cashBankAccounts;
  }, [cashBankAccounts, payMethod]);

  useEffect(() => {
    if (cashBankOptions.length === 0) {
      setCashBankAccountId("");
      return;
    }
    if (!cashBankOptions.some((a) => a.id === cashBankAccountId)) {
      setCashBankAccountId(cashBankOptions[0].id);
    }
  }, [cashBankOptions, cashBankAccountId]);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => `${r.student} ${r.sid} ${r.invoice}`.toLowerCase().includes(q.toLowerCase()))
        .filter((r) => (status ? r.status === status : true))
        .filter((r) => (cls ? r.cls === cls : true)),
    [rows, q, status, cls]
  );

  const groups = useMemo(
    () =>
      STATUSES.map((s) => ({
        key: s,
        label: s,
        color: statusColor(s),
        items: filtered.filter((r) => r.status === s),
      })).filter((g) => g.items.length > 0),
    [filtered]
  );

  const openCollect = (r: ReceivableItem) => {
    setCollecting(r);
    setPayAmount(String(r.outstanding));
    setPayMethod("Cash");
    setCollectErr(null);
  };

  const handleCollectSubmit = async () => {
    if (!collecting) return;
    const val = Number(payAmount);
    if (!val || val <= 0) {
      setCollectErr("Payment amount must be greater than zero.");
      return;
    }
    if (!cashBankAccountId) {
      setCollectErr(payMethod === "Cash" ? "Please select a cash account." : "Please select a bank account.");
      return;
    }

    setCollectSaving(true);
    setCollectErr(null);
    try {
      await accountsApi.collectFee(collecting.id, {
        amount: val,
        method: payMethod,
        cashBankAccountId,
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      setCollecting(null);
      await fetchReceivables();
    } catch (e: any) {
      setCollectErr(e?.message || "Failed to collect fee.");
    } finally {
      setCollectSaving(false);
    }
  };

  const columns: BoardColumn<ReceivableItem>[] = [
    {
      key: "sid",
      label: "Student ID",
      width: "110px",
      cell: (r) => <span className="font-mono text-[12px] text-[var(--theme-text-muted)]">{r.sid}</span>,
    },
    {
      key: "student",
      label: "Student Name",
      width: "minmax(140px,1.2fr)",
      cell: (r) => <span className="font-medium">{r.student}</span>,
    },
    { key: "cls", label: "Class", width: "120px", cell: (r) => `${r.cls}-${r.section}` },
    { key: "invoice", label: "Invoice", width: "130px", cell: (r) => r.invoice },
    {
      key: "due",
      label: "Due Date",
      width: "110px",
      cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.dueDate}</span>,
    },
    {
      key: "total",
      label: "Total Fee",
      width: "120px",
      cell: (r) => <span className="tabular-nums">{money(r.total)}</span>,
    },
    {
      key: "paid",
      label: "Paid",
      width: "120px",
      cell: (r) => <span className="tabular-nums text-[var(--theme-success-text)]">{money(r.paid)}</span>,
    },
    {
      key: "out",
      label: "Outstanding",
      width: "130px",
      cell: (r) => (
        <span
          className={`tabular-nums font-semibold ${
            r.outstanding > 0 ? "text-[var(--theme-danger-text)]" : "text-[var(--theme-text-muted)]"
          }`}
        >
          {money(r.outstanding)}
        </span>
      ),
    },
    { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
  ];

  if (loading && rows.length === 0) return <BoardPageSkeleton rows={5} cols={8} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:px-6 lg:grid-cols-4">
        <StatCard
          label="Total Receivable"
          value={rs(summary.total)}
          Icon={HandCoins}
          tone="blue"
          sub="All outstanding fees"
        />
        <StatCard
          label="Current Due"
          value={rs(summary.currentDue)}
          Icon={HandCoins}
          tone="orange"
          sub="Pending & partial invoices"
        />
        <StatCard
          label="Overdue"
          value={rs(summary.overdue)}
          Icon={HandCoins}
          tone="red"
          sub="Past due date"
        />
        <StatCard
          label="Collected (Total)"
          value={rs(summary.collected)}
          Icon={DollarSign}
          tone="green"
          sub="Fee collections posted"
        />
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)] sm:mx-6">
          {error}
        </div>
      )}

      <BoardList<ReceivableItem>
        title="Fee Receivables"
        subtitle="Track outstanding fee invoices and record fee collections into accounting."
        Icon={HandCoins}
        nameLabel="Invoice #"
        primaryAction={
          <button
            type="button"
            onClick={fetchReceivables}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search student, SID, invoice"
        views={VIEWS}
        view={view}
        onView={setView}
        groups={groups}
        columns={columns}
        minWidth={1380}
        keyOf={(r) => r.id}
        nameOf={(r) => r.invoice}
        subtitleOf={(r) => `${r.student} · ${r.cls}-${r.section}`}
        menu={(r) => [
          ...(r.outstanding > 0
            ? [{ label: "Collect Fee", Icon: CheckCircle2, onClick: () => openCollect(r) }]
            : []),
        ]}
        mobileRows={(r) => [
          { label: "Student", value: r.student },
          { label: "Class", value: `${r.cls}-${r.section}` },
          { label: "Due Date", value: r.dueDate },
          { label: "Outstanding", value: money(r.outstanding) },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No receivables found"
        emptyMessage="No fee invoices match the filter criteria."
        toolbar={
          <>
            <ToolDropdown
              Icon={Filter}
              label="Status"
              options={STATUSES}
              value={status}
              onChange={setStatus}
              allLabel="All Status"
            />
            {classList.length > 0 && (
              <ToolDropdown
                Icon={Filter}
                label="Class"
                options={classList}
                value={cls}
                onChange={setCls}
                allLabel="All Classes"
              />
            )}
          </>
        }
      />

      {/* Collect Fee Modal */}
      <Modal
        open={!!collecting}
        onClose={() => setCollecting(null)}
        title="Collect Fee Payment"
        subtitle={`Collect fee for ${collecting?.student} (${collecting?.invoice})`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setCollecting(null)} disabled={collectSaving}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={handleCollectSubmit}
              loading={collectSaving}
              loadingLabel="Posting to Ledger…"
            >
              Collect & Post to Accounting
            </Btn>
          </>
        }
      >
        {collectErr && (
          <div className="mb-3 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-2.5 text-[13px] text-[var(--theme-danger-text)]">
            {collectErr}
          </div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Total Fee</span>
              <p className="font-semibold">{rs(collecting?.total || 0)}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Current Outstanding</span>
              <p className="font-bold text-[var(--theme-danger-text)]">{rs(collecting?.outstanding || 0)}</p>
            </div>
          </div>

          <Field label="Amount to Collect (Rs)">
            <Input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0"
            />
          </Field>

          <Field label="Payment Method">
            <Select
              options={["Cash", "Bank", "Cheque", "Online"]}
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            />
          </Field>
          <Field label={payMethod === "Cash" ? "Cash Account" : "Bank Account"}>
            <select
              value={cashBankAccountId}
              onChange={(e) => setCashBankAccountId(e.target.value)}
              className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]"
            >
              {cashBankOptions.length === 0 ? (
                <option value="">No {payMethod === "Cash" ? "cash" : "bank"} accounts found</option>
              ) : (
                cashBankOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {cashBankLabel(a)} · Bal {rs(a.balance || 0)}
                  </option>
                ))
              )}
            </select>
          </Field>
          <p className="text-[12px] text-[var(--theme-text-muted)]">
            Collecting this fee will automatically record a posted Receipt Voucher (RV) and balanced Journal Entry
            crediting Tuition Fees and debiting the selected Cash/Bank account in the accounting ledger.
          </p>
        </div>
      </Modal>
    </div>
  );
}
