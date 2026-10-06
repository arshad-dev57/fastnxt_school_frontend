"use client";

import { useMemo, useState } from "react";
import { Plus, ArrowUpDown, Filter } from "lucide-react";
import { Btn, Field, Input, Modal, Select, type IconType } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton, simulateDelay, useInitialLoading } from "@/components/skeleton";
import { PAY_METHODS, type Voucher } from "@/lib/accounting-mock-data";


const STATUSES = ["Draft", "Posted", "Cancelled"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;
const SORTS = ["Voucher #", "Date", "Amount"] as const;

export function VoucherPage({ title, subtitle, Icon, nameLabel, partyLabel, accountLabel, prefix, seed, accounts, emptyMessage }: {
  title: string; subtitle: string; Icon: IconType; nameLabel: string;
  partyLabel: string; accountLabel: string; prefix: string; seed: Voucher[]; accounts: string[]; emptyMessage: string;
}) {
  const [rows, setRows] = useState<Voucher[]>(seed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");
  const [sort, setSort] = useState<string>("Voucher #");
  const [view, setView] = useState<BoardView>("table");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => rows
    .filter((r) => `${r.no} ${r.party} ${r.reference} ${r.account}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true))
    .filter((r) => (account ? r.account === account : true))
    .sort((a, b) => (sort === "Date" ? a.date.localeCompare(b.date) : sort === "Amount" ? b.amount - a.amount : a.no.localeCompare(b.no))),
  [rows, q, status, account, sort]);

  const groups = useMemo(() => STATUSES.map((s) => ({
    key: s, label: s, color: statusColor(s), items: filtered.filter((r) => r.status === s),
  })).filter((g) => g.items.length > 0), [filtered]);

  const columns: BoardColumn<Voucher>[] = [
    { key: "date", label: "Date", width: "120px", cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.date}</span> },
    { key: "party", label: partyLabel, width: "minmax(150px,1fr)", cell: (r) => <span className="truncate">{r.party}</span> },
    { key: "account", label: accountLabel, width: "minmax(140px,1fr)", cell: (r) => <span className="truncate text-[var(--theme-text-muted)]">{r.account}</span> },
    { key: "amount", label: "Amount", width: "130px", cell: (r) => <span className="tabular-nums">{money(r.amount)}</span> },
    { key: "method", label: "Payment Method", width: "150px", cell: (r) => r.method },
    { key: "reference", label: "Reference", width: "120px", cell: (r) => r.reference },
    { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
  ];

  const loading = useInitialLoading();
  if (loading) return <BoardPageSkeleton rows={5} cols={7} />;

  return (
    <>
      <BoardList<Voucher>
        title={title}
        subtitle={subtitle}
        Icon={Icon}
        nameLabel={nameLabel}
        primaryAction={
          <button type="button" onClick={() => setCreating(true)}
            className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
            <Plus className="ic-plus h-[18px] w-[18px]" /><span className="hidden sm:inline">New Voucher</span>
          </button>
        }
        search={q} onSearch={setQ} searchPlaceholder="Search vouchers"
        views={VIEWS} view={view} onView={setView}
        groups={groups} columns={columns} minWidth={1460}
        keyOf={(r) => r.id}
        nameOf={(r) => r.no}
        subtitleOf={(r) => `${r.party} · ${r.account}`}
        menu={() => []}
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
            <ToolDropdown Icon={Filter} label="Status" options={STATUSES} value={status} onChange={setStatus} allLabel="All Status" />
            <ToolDropdown Icon={Filter} label="Account" options={accounts} value={account} onChange={setAccount} allLabel="All Accounts" />
            <ToolDropdown Icon={ArrowUpDown} label="Sort" options={SORTS} value={sort} onChange={(v) => setSort(v || "Voucher #")} allLabel="Voucher #" />
            <ToolDropdown Icon={Filter} label="Date" options={["This Month", "Last Month", "This Quarter"]} value="" onChange={() => {}} allLabel="All Dates" />
          </>
        }
      />

      <NewVoucher open={creating} title={`New ${nameLabel.replace(" #", "")}`} partyLabel={partyLabel} prefix={prefix}
        accounts={accounts} onClose={() => setCreating(false)}
        onSave={async (v) => { await simulateDelay(); setRows((p) => [v, ...p]); setCreating(false); }} />
    </>
  );
}

function NewVoucher({ open, title, partyLabel, prefix, accounts, onClose, onSave }: {
  open: boolean; title: string; partyLabel: string; prefix: string; accounts: string[];
  onClose: () => void; onSave: (v: Voucher) => Promise<void>;
}) {
  const [party, setParty] = useState("");
  const [account, setAccount] = useState(accounts[0]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>(PAY_METHODS[0]);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const no = `${prefix}-${String(Date.now()).slice(-4)}`;
    await onSave({
      id: no, no, date: new Date().toISOString().slice(0, 10), party: party || "—", account,
      amount: Number(amount) || 0, method: method as Voucher["method"], reference: reference || "—", status: "Posted",
    });
    setSaving(false); setParty(""); setAmount(""); setReference("");
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg" title={title} subtitle="Record a new voucher transaction."
      footer={<><Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Saving…">Save Voucher</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={partyLabel} className="sm:col-span-2"><Input value={party} onChange={(e) => setParty(e.target.value)} /></Field>
        <Field label="Account"><Select options={accounts} value={account} onChange={(e) => setAccount(e.target.value)} /></Field>
        <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
        <Field label="Payment Method"><Select options={PAY_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} /></Field>
        <Field label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
