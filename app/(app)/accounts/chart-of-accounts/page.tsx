"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, ArrowUpDown, Layers, Filter, Wallet } from "lucide-react";
import { Btn, ConfirmDialog, EmptyState, Field, Input, Modal, RowMenu, Select, Td, Th } from "@/components/ui";
import { Board, BoardBar, BoardBody, BoardHead, GroupHead, GroupTable, BarCell } from "@/components/board";
import {
  ColumnsDropdown, BoardToolbarBar, BoardInlineSearch, StatusPill, ToolDropdown, ViewTabs, type BoardView,
} from "@/components/board-kit";
import { KanbanBoard, MobileItem } from "@/components/board-views";
import { BoardPageSkeleton, simulateDelay, useInitialLoading } from "@/components/skeleton";
import { ACCOUNTS, ACC_GROUPS, type AccType, type LedgerAccount } from "@/lib/accounting-mock-data";

const COL_META = [
  { key: "code", label: "Code", width: "110px" },
  { key: "type", label: "Type", width: "120px" },
  { key: "parent", label: "Parent", width: "minmax(150px,1fr)" },
  { key: "status", label: "Status", width: "130px" },
];
const TYPES: AccType[] = ["Asset", "Liability", "Equity", "Income", "Expense"];
const PARENTS = ["Current Assets", "Non-current Assets", "Current Liabilities", "School Fund", "Fee Income", "Other Income", "Operating Expenses"];
const SORTS = ["Name", "Code", "Type"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;
type SortLabel = (typeof SORTS)[number];

export default function ChartOfAccountsPage() {
  const [rows, setRows] = useState<LedgerAccount[]>(ACCOUNTS);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<SortLabel>("Name");
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<BoardView>("table");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: LedgerAccount } | null>(null);
  const [detail, setDetail] = useState<LedgerAccount | null>(null);
  const [toDelete, setToDelete] = useState<LedgerAccount | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => `${r.name} ${r.code} ${r.parent}`.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (type ? r.type === type : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => {
      const key = sort === "Name" ? "name" : sort === "Code" ? "code" : "type";
      return String(a[key as keyof LedgerAccount]).localeCompare(String(b[key as keyof LedgerAccount]));
    }), [rows, q, type, status, sort]);

  const groups = useMemo(() => ACC_GROUPS.map((g) => ({
    key: g.key, label: g.label, color: g.color, items: filtered.filter((r) => r.type === g.key),
  })).filter((g) => g.items.length > 0), [filtered]);

  const visibleCols = COL_META.filter((c) => !hidden.includes(c.key));
  const tmpl = `44px minmax(200px,1.4fr) ${visibleCols.map((c) => c.width).join(" ")} 64px`;

  const loading = useInitialLoading();
  if (loading) return <BoardPageSkeleton rows={5} cols={5} />;

  const rowMenu = (r: LedgerAccount) => [
    { label: "View", Icon: Eye, onClick: () => setDetail(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <Board>
      <BoardBar>
        <BoardHead title="Chart of Accounts" subtitle="Manage school financial accounts and account categories." Icon={Wallet}
          actions={
            <button type="button" onClick={() => setModal({ mode: "add" })}
              className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
              <Plus className="ic-plus h-[18px] w-[18px]" /> New Account
            </button>
          } />
        <ViewTabs views={VIEWS} value={view} onChange={setView} />
        <BoardToolbarBar>
          <button type="button" onClick={() => setModal({ mode: "add" })}
            className="ic-plus-btn mr-1 inline-flex h-9 shrink-0 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
            <Plus className="ic-plus h-[18px] w-[18px]" /><span className="hidden sm:inline">New item</span>
          </button>
          <BoardInlineSearch value={q} onChange={setQ} placeholder="Search accounts" />
          <ToolDropdown Icon={Filter} label="Type" options={TYPES} value={type} onChange={setType} allLabel="All Types" />
          <ToolDropdown Icon={ArrowUpDown} label="Sort" options={SORTS} value={sort} onChange={(v) => setSort((v || "Name") as SortLabel)} allLabel="Name" />
          <ColumnsDropdown columns={COL_META} hidden={hidden} onToggle={(k) => setHidden((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />
          <ToolDropdown Icon={Layers} label="Group by" options={["Type"]} value="Type" onChange={() => {}} allLabel="Type" />
          <ToolDropdown Icon={Filter} label="Status" options={["Active", "Inactive"]} value={status} onChange={setStatus} allLabel="All Status" />
        </BoardToolbarBar>
      </BoardBar>

      <BoardBody>
        {view === "table" && (
          groups.length === 0 ? <EmptyState Icon={Wallet} title="No accounts found" message="Adjust your search or add a new account." /> : (
            <div className="space-y-8 md:min-w-[860px]">
              {groups.map((g) => {
                const open = !collapsed[g.key];
                return (
                  <section key={g.key}>
                    <GroupHead title={g.label} color={g.color} count={g.items.length} open={open}
                      onToggle={() => setCollapsed((p) => ({ ...p, [g.key]: open }))} />
                    {open && (
                      <>
                        <div className="hidden md:block">
                          <GroupTable>
                            <div className="grid border-b border-[var(--theme-border)] bg-[var(--theme-surface)]" style={{ gridTemplateColumns: tmpl }}>
                              <BarCell color={g.color} />
                              <Th>Account Name</Th>
                              {visibleCols.map((c) => <Th key={c.key} className="border-l border-[var(--theme-border)]">{c.label}</Th>)}
                              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                            </div>
                            {g.items.map((r) => (
                              <div key={r.id} onClick={() => setDetail(r)}
                                className="row grid cursor-pointer border-b border-[var(--theme-border)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]"
                                style={{ gridTemplateColumns: tmpl }}>
                                <BarCell color={g.color} className="py-2.5" />
                                <Td className="min-w-0 font-medium"><span className="truncate">{r.name}</span></Td>
                                {visibleCols.map((c) => (
                                  <Td key={c.key} className="min-w-0 border-l border-[var(--theme-border)]">
                                    {c.key === "status"
                                      ? <StatusPill label={r.status} />
                                      : <span className="truncate text-[var(--theme-text-muted)]">{String(r[c.key as keyof LedgerAccount])}</span>}
                                  </Td>
                                ))}
                                <Td className="justify-center border-l border-[var(--theme-border)]">
                                  <span onClick={(e) => e.stopPropagation()}><RowMenu items={rowMenu(r)} /></span>
                                </Td>
                              </div>
                            ))}
                          </GroupTable>
                        </div>
                        <div className="space-y-3 md:hidden">
                          {g.items.map((r) => (
                            <MobileItem key={r.id} name={r.name} subtitle={`${r.code} · ${r.type}`} actions={<RowMenu items={rowMenu(r)} />}
                              rows={[{ label: "Parent", value: r.parent }, { label: "Status", value: <StatusPill label={r.status} /> }]} />
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          )
        )}

        {view === "kanban" && (
          <KanbanBoard columns={groups} keyOf={(r) => r.id}
            renderCard={(r) => (
              <button type="button" onClick={() => setDetail(r)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left shadow-sm transition-colors hover:bg-[var(--theme-hover)]">
                <span className="block truncate text-[14px] font-medium">{r.name}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--theme-text-muted)]">{r.code} · {r.parent}</span>
                <span className="mt-2 flex"><StatusPill label={r.status} /></span>
              </button>
            )} />
        )}
      </BoardBody>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""} subtitle="Account details"
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (
          <div className="grid grid-cols-2 gap-3">
            <Info label="Code" value={detail.code} />
            <Info label="Type" value={detail.type} />
            <Info label="Parent" value={detail.parent} />
            <Info label="Status" value={detail.status} />
            <Info label="Account ID" value={detail.id} />
          </div>
        )}
      </Modal>

      <AccountForm modal={modal} onClose={() => setModal(null)}
        onSave={async (row) => {
          await simulateDelay();
          setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p]));
          setModal(null);
        }} />

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => { await simulateDelay(); setRows((p) => p.filter((r) => r.id !== toDelete?.id)); }}
        title="Delete account" confirmLabel="Delete" message={`Delete ${toDelete?.name}? This will remove it from the chart of accounts.`} />
    </Board>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="truncate text-[14px] font-medium">{value}</p>
    </div>
  );
}

function AccountForm({ modal, onClose, onSave }: {
  modal: { mode: "add" | "edit"; row?: LedgerAccount } | null; onClose: () => void; onSave: (r: LedgerAccount) => Promise<void>;
}) {
  const blank: LedgerAccount = { id: "", name: "", code: "", type: "Asset", parent: PARENTS[0], status: "Active" };
  const [form, setForm] = useState<LedgerAccount>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  const [saving, setSaving] = useState(false);
  if (key !== lastKey) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<LedgerAccount>) => setForm((f) => ({ ...f, ...patch }));
  const save = async () => { setSaving(true); await onSave({ ...form, id: form.id || `A-${form.code || Date.now()}` }); setSaving(false); };

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-xl"
      title={modal?.mode === "edit" ? "Edit Account" : "New Account"} subtitle="Define the ledger account and its category."
      footer={<><Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Saving…">{modal?.mode === "edit" ? "Save Changes" : "Create Account"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Account Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Tuition Fees" /></Field>
        <Field label="Account Code"><Input value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g. 4001" /></Field>
        <Field label="Type"><Select options={TYPES} value={form.type} onChange={(e) => set({ type: e.target.value as AccType })} /></Field>
        <Field label="Parent"><Select options={PARENTS} value={form.parent} onChange={(e) => set({ parent: e.target.value })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as LedgerAccount["status"] })} /></Field>
      </div>
    </Modal>
  );
}
