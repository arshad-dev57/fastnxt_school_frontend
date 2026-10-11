"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowUpDown, Filter, RefreshCw, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import { Btn, ConfirmDialog, Field, Input, Modal, Select, type IconType, rs } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton } from "@/components/skeleton";
import { accountsApi, type VoucherItem, type AccountItem, type CashBankAccountItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const STATUSES = ["Draft", "Posted", "Cancelled"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;
const SORTS = ["Voucher #", "Date", "Amount"] as const;
const PAY_METHODS = ["Cash", "Bank", "Cheque", "Online"];

function cashBankLabel(a: CashBankAccountItem) {
  const num = a.number && a.number !== "—" ? a.number : "";
  return num ? `${a.name} (${num})` : a.name;
}

export function VoucherPage({
  title,
  subtitle,
  Icon,
  nameLabel,
  partyLabel,
  accountLabel,
  prefix,
  kind,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  Icon: IconType;
  nameLabel: string;
  partyLabel: string;
  accountLabel: string;
  prefix: string;
  kind: "Receipt" | "Payment";
  emptyMessage: string;
}) {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<VoucherItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [sort, setSort] = useState<string>("Voucher #");
  const [view, setView] = useState<BoardView>("table");
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<VoucherItem | null>(null);
  const [toDelete, setToDelete] = useState<VoucherItem | null>(null);

  const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountsApi.listVouchers({ kind, branchId: branchScope });
      setRows(res.vouchers || []);
    } catch (e: any) {
      setError(e?.message || `Failed to load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await accountsApi.listAccounts();
      setAccounts(res.accounts || []);
    } catch {
      // non-fatal
    }
  };

  const fetchCashBankAccounts = async () => {
    try {
      const res = await accountsApi.listBankAccounts({ branchId: branchScope });
      setCashBankAccounts((res.accounts || []).filter((a) => a.isActive !== false));
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchAccounts();
    fetchCashBankAccounts();
  }, [kind, currentBranchId]);

  const handlePost = async (id: string) => {
    try {
      await accountsApi.postVoucher(id);
      await fetchVouchers();
    } catch (e: any) {
      alert(e?.message || "Failed to post voucher.");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await accountsApi.cancelVoucher(id);
      await fetchVouchers();
    } catch (e: any) {
      alert(e?.message || "Failed to cancel voucher.");
    }
  };

  const accountOptions = useMemo(() => {
    const relevant = accounts.filter((a) =>
      kind === "Receipt" ? a.type === "Income" || a.type === "Asset" : a.type === "Expense" || a.type === "Liability"
    );
    return (relevant.length > 0 ? relevant : accounts).map((a) => a.name);
  }, [accounts, kind]);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => `${r.no} ${r.party} ${r.reference} ${r.account}`.toLowerCase().includes(q.toLowerCase()))
        .filter((r) => (status ? r.status === status : true))
        .filter((r) => (accountFilter ? r.account === accountFilter : true))
        .sort((a, b) =>
          sort === "Date"
            ? (b.date || "").localeCompare(a.date || "")
            : sort === "Amount"
            ? (b.amount || 0) - (a.amount || 0)
            : (b.no || "").localeCompare(a.no || "")
        ),
    [rows, q, status, accountFilter, sort]
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

  const columns: BoardColumn<VoucherItem>[] = [
    {
      key: "date",
      label: "Date",
      width: "110px",
      cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.date}</span>,
    },
    {
      key: "party",
      label: partyLabel,
      width: "minmax(150px,1fr)",
      cell: (r) => <span className="truncate font-medium">{r.party}</span>,
    },
    {
      key: "account",
      label: accountLabel,
      width: "minmax(140px,1fr)",
      cell: (r) => <span className="truncate text-[var(--theme-text-muted)]">{r.account}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      width: "130px",
      cell: (r) => (
        <span
          className={`tabular-nums font-semibold ${
            r.kind === "Receipt" ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]"
          }`}
        >
          {r.kind === "Receipt" ? `+${money(r.amount)}` : `-${money(r.amount)}`}
        </span>
      ),
    },
    { key: "method", label: "Payment Method", width: "110px", cell: (r) => r.method },
    {
      key: "cashBank",
      label: "Cash / Bank",
      width: "minmax(160px,1fr)",
      cell: (r) => (
        <span className="truncate text-[var(--theme-text-muted)]">
          {r.cashBankAccount
            ? r.cashBankAccountNumber
              ? `${r.cashBankAccount} (${r.cashBankAccountNumber})`
              : r.cashBankAccount
            : "—"}
        </span>
      ),
    },
    { key: "reference", label: "Reference", width: "120px", cell: (r) => r.reference || "—" },
    { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
  ];

  if (loading && rows.length === 0) return <BoardPageSkeleton rows={5} cols={7} />;

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)] sm:mx-6">
          {error}
        </div>
      )}

      <BoardList<VoucherItem>
        title={title}
        subtitle={subtitle}
        Icon={Icon}
        nameLabel={nameLabel}
        primaryAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchVouchers}
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Plus className="ic-plus h-[18px] w-[18px]" />
              <span className="hidden sm:inline">New Voucher</span>
            </button>
          </div>
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search vouchers"
        views={VIEWS}
        view={view}
        onView={setView}
        groups={groups}
        columns={columns}
        minWidth={1400}
        keyOf={(r) => r.id}
        nameOf={(r) => r.no}
        subtitleOf={(r) => `${r.party} · ${r.account}`}
        menu={(r) => [
          { label: "View Details", Icon: Eye, onClick: () => setDetail(r) },
          ...(r.status === "Draft"
            ? [{ label: "Post Voucher", Icon: CheckCircle2, onClick: () => handlePost(r.id) }]
            : []),
          ...(r.status !== "Cancelled"
            ? [{ label: "Cancel Voucher", Icon: XCircle, danger: true, onClick: () => handleCancel(r.id) }]
            : []),
          ...(r.status === "Draft"
            ? [{ label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) }]
            : []),
        ]}
        mobileRows={(r) => [
          { label: "Date", value: r.date },
          { label: "Status", value: <StatusPill label={r.status} /> },
          { label: "Amount", value: money(r.amount) },
          { label: "Method", value: r.method },
        ]}
        emptyTitle="No vouchers"
        emptyMessage={emptyMessage}
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
            <ToolDropdown
              Icon={Filter}
              label="Account"
              options={accountOptions}
              value={accountFilter}
              onChange={setAccountFilter}
              allLabel="All Accounts"
            />
            <ToolDropdown
              Icon={ArrowUpDown}
              label="Sort"
              options={SORTS}
              value={sort}
              onChange={(v) => setSort(v || "Voucher #")}
              allLabel="Voucher #"
            />
          </>
        }
      />

      {/* Voucher Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.no ?? ""}
        subtitle={`${detail?.kind} Voucher Details`}
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}
      >
        {detail && (
          <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3">
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Date</span>
              <p className="font-medium">{detail.date}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">{partyLabel}</span>
              <p className="font-medium">{detail.party}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">{accountLabel}</span>
              <p className="font-medium">{detail.account}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Amount</span>
              <p className="font-bold text-[16px] text-[var(--theme-primary)]">{rs(detail.amount)}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Payment Method</span>
              <p className="font-medium">{detail.method}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Cash / Bank Account</span>
              <p className="font-medium">
                {detail.cashBankAccount
                  ? detail.cashBankAccountNumber
                    ? `${detail.cashBankAccount} (${detail.cashBankAccountNumber})`
                    : detail.cashBankAccount
                  : "—"}
              </p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Reference</span>
              <p className="font-medium">{detail.reference || "—"}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Status</span>
              <p className="font-medium">{detail.status}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5 sm:col-span-2">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Journal Entry ID</span>
              <p className="font-mono text-[12px]">{detail.journalEntryId || "None (Draft)"}</p>
            </div>
          </div>
        )}
      </Modal>

      <NewVoucherModal
        open={creating}
        title={`New ${nameLabel.replace(" #", "")}`}
        partyLabel={partyLabel}
        kind={kind}
        accounts={accounts}
        cashBankAccounts={cashBankAccounts}
        onClose={() => setCreating(false)}
        onSave={async (vInput) => {
          await accountsApi.createVoucher({
            ...vInput,
            branchId: currentBranchId !== "all" ? currentBranchId : undefined,
          });
          await fetchVouchers();
          setCreating(false);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await accountsApi.deleteVoucher(toDelete.id);
            await fetchVouchers();
          } catch (e: any) {
            alert(e?.message || "Failed to delete voucher.");
          }
        }}
        title="Delete Voucher"
        confirmLabel="Delete"
        message={`Delete draft voucher ${toDelete?.no}?`}
      />
    </>
  );
}

function NewVoucherModal({
  open,
  title,
  partyLabel,
  kind,
  accounts,
  cashBankAccounts,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  partyLabel: string;
  kind: "Receipt" | "Payment";
  accounts: AccountItem[];
  cashBankAccounts: CashBankAccountItem[];
  onClose: () => void;
  onSave: (input: any) => Promise<void>;
}) {
  const [party, setParty] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cashBankOptions = useMemo(() => {
    if (method === "Cash") return cashBankAccounts.filter((a) => a.kind === "Cash");
    // Bank / Cheque / Online → bank accounts
    const banks = cashBankAccounts.filter((a) => a.kind === "Bank");
    return banks.length > 0 ? banks : cashBankAccounts;
  }, [cashBankAccounts, method]);

  // Set default income/expense account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      const preferred = accounts.find((a) =>
        kind === "Receipt" ? a.type === "Income" : a.type === "Expense"
      );
      setAccountId(preferred?.id || accounts[0].id);
    }
  }, [accounts, kind, accountId]);

  // Keep selected cash/bank account in sync with payment method
  useEffect(() => {
    if (cashBankOptions.length === 0) {
      setCashBankAccountId("");
      return;
    }
    if (!cashBankOptions.some((a) => a.id === cashBankAccountId)) {
      setCashBankAccountId(cashBankOptions[0].id);
    }
  }, [cashBankOptions, cashBankAccountId]);

  const save = async () => {
    if (!party.trim()) {
      setErr("Party name is required.");
      return;
    }
    const val = Number(amount);
    if (!val || val <= 0) {
      setErr("Amount must be greater than zero.");
      return;
    }
    if (!cashBankAccountId) {
      setErr(method === "Cash" ? "Please select a cash account." : "Please select a bank account.");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      await onSave({
        kind,
        party: party.trim(),
        accountId,
        amount: val,
        method,
        cashBankAccountId,
        reference: reference.trim(),
        date,
        status: "Posted",
      });
      setParty("");
      setAmount("");
      setReference("");
    } catch (e: any) {
      setErr(e?.message || "Failed to save voucher.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title={title}
      subtitle={`Record and automatically post a ${kind.toLowerCase()} voucher.`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Saving…">
            Save & Post Voucher
          </Btn>
        </>
      }
    >
      {err && (
        <div className="mb-3 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-2.5 text-[13px] text-[var(--theme-danger-text)]">
          {err}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={partyLabel}>
          <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder="e.g. Ahmed Khan" />
        </Field>
        <Field label="Account" className="sm:col-span-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.name} ({a.type})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount (Rs)">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Payment Method">
          <Select options={PAY_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
        </Field>
        <Field label={method === "Cash" ? "Cash Account" : "Bank Account"} className="sm:col-span-2">
          <select
            value={cashBankAccountId}
            onChange={(e) => setCashBankAccountId(e.target.value)}
            className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]"
          >
            {cashBankOptions.length === 0 ? (
              <option value="">No {method === "Cash" ? "cash" : "bank"} accounts found</option>
            ) : (
              cashBankOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {cashBankLabel(a)} · Bal {rs(a.balance || 0)}
                </option>
              ))
            )}
          </select>
        </Field>
        <Field label="Reference" className="sm:col-span-2">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. FEE-101 or CHEQUE #4521" />
        </Field>
      </div>
    </Modal>
  );
}
