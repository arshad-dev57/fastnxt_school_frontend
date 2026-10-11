"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, ArrowUpDown, Layers, Filter, Wallet, RefreshCw } from "lucide-react";
import { Btn, ConfirmDialog, EmptyState, Field, Input, Modal, RowMenu, Select, Td, Th, rs } from "@/components/ui";
import { Board, BoardBar, BoardBody, BoardHead, GroupHead, GroupTable, BarCell } from "@/components/board";
import {
  ColumnsDropdown,
  BoardToolbarBar,
  BoardInlineSearch,
  StatusPill,
  ToolDropdown,
  ViewTabs,
  type BoardView,
} from "@/components/board-kit";
import { KanbanBoard, MobileItem } from "@/components/board-views";
import { BoardPageSkeleton } from "@/components/skeleton";
import { accountsApi, type AccountItem, type AccType } from "@/lib/auth/api-client";

const ACC_GROUPS: { key: AccType; label: string; color: string }[] = [
  { key: "Asset", label: "Assets", color: "var(--theme-primary)" },
  { key: "Liability", label: "Liabilities", color: "var(--theme-warning)" },
  { key: "Equity", label: "Equity / Fund", color: "var(--theme-accent)" },
  { key: "Income", label: "Income", color: "var(--theme-success)" },
  { key: "Expense", label: "Expenses", color: "var(--theme-danger)" },
];

const COL_META = [
  { key: "code", label: "Code", width: "100px" },
  { key: "type", label: "Type", width: "110px" },
  { key: "parent", label: "Parent", width: "minmax(140px,1fr)" },
  { key: "balance", label: "Balance", width: "130px" },
  { key: "status", label: "Status", width: "110px" },
];
const TYPES: AccType[] = ["Asset", "Liability", "Equity", "Income", "Expense"];
const PARENTS = [
  "Current Assets",
  "Non-current Assets",
  "Current Liabilities",
  "School Fund",
  "Fee Income",
  "Other Income",
  "Operating Expenses",
];
const SORTS = ["Name", "Code", "Type", "Balance"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;
type SortLabel = (typeof SORTS)[number];

export default function ChartOfAccountsPage() {
  const [rows, setRows] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<SortLabel>("Name");
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<BoardView>("table");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: AccountItem } | null>(null);
  const [detail, setDetail] = useState<AccountItem | null>(null);
  const [toDelete, setToDelete] = useState<AccountItem | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountsApi.listAccounts();
      setRows(res.accounts || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load chart of accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => `${r.name} ${r.code} ${r.parent}`.toLowerCase().includes(q.toLowerCase()))
        .filter((r) => (type ? r.type === type : true))
        .filter((r) => (status ? r.status === status : true))
        .sort((a, b) => {
          if (sort === "Balance") return (b.balance || 0) - (a.balance || 0);
          const key = sort === "Name" ? "name" : sort === "Code" ? "code" : "type";
          return String(a[key as keyof AccountItem]).localeCompare(String(b[key as keyof AccountItem]));
        }),
    [rows, q, type, status, sort]
  );

  const groups = useMemo(
    () =>
      ACC_GROUPS.map((g) => ({
        key: g.key,
        label: g.label,
        color: g.color,
        items: filtered.filter((r) => r.type === g.key),
      })).filter((g) => g.items.length > 0),
    [filtered]
  );

  const visibleCols = COL_META.filter((c) => !hidden.includes(c.key));
  const tmpl = `44px minmax(180px,1.4fr) ${visibleCols.map((c) => c.width).join(" ")} 64px`;

  if (loading && rows.length === 0) return <BoardPageSkeleton rows={5} cols={6} />;

  const rowMenu = (r: AccountItem) => [
    { label: "View", Icon: Eye, onClick: () => setDetail(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    ...(!r.isSystem ? [{ label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) }] : []),
  ];

  return (
    <Board>
      <BoardBar>
        <BoardHead
          title="Chart of Accounts"
          subtitle="Manage school financial accounts, balances and categories."
          Icon={Wallet}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAccounts}
                className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setModal({ mode: "add" })}
                className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
              >
                <Plus className="ic-plus h-[18px] w-[18px]" /> New Account
              </button>
            </div>
          }
        />
        <ViewTabs views={VIEWS} value={view} onChange={setView} />
        <BoardToolbarBar>
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="ic-plus-btn mr-1 inline-flex h-9 shrink-0 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
          >
            <Plus className="ic-plus h-[18px] w-[18px]" />
            <span className="hidden sm:inline">New Account</span>
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
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        {view === "table" &&
          (groups.length === 0 ? (
            <EmptyState Icon={Wallet} title="No accounts found" message="Adjust your search or add a new account." />
          ) : (
            <div className="space-y-8 md:min-w-[860px]">
              {groups.map((g) => {
                const open = !collapsed[g.key];
                return (
                  <section key={g.key}>
                    <GroupHead
                      title={g.label}
                      color={g.color}
                      count={g.items.length}
                      open={open}
                      onToggle={() => setCollapsed((p) => ({ ...p, [g.key]: open }))}
                    />
                    {open && (
                      <>
                        <div className="hidden md:block">
                          <GroupTable>
                            <div className="grid border-b border-[var(--theme-border)] bg-[var(--theme-surface)]" style={{ gridTemplateColumns: tmpl }}>
                              <BarCell color={g.color} />
                              <Th>Account Name</Th>
                              {visibleCols.map((c) => (
                                <Th key={c.key} className={c.key === "balance" ? "border-l border-[var(--theme-border)] text-right" : "border-l border-[var(--theme-border)]"}>
                                  {c.label}
                                </Th>
                              ))}
                              <Th className="border-l border-[var(--theme-border)]">
                                <span className="sr-only">Actions</span>
                              </Th>
                            </div>
                            {g.items.map((r) => (
                              <div
                                key={r.id}
                                onClick={() => setDetail(r)}
                                className="row grid cursor-pointer border-b border-[var(--theme-border)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]"
                                style={{ gridTemplateColumns: tmpl }}
                              >
                                <BarCell color={g.color} className="py-2.5" />
                                <Td className="min-w-0 font-medium">
                                  <span className="truncate">{r.name}</span>
                                  {r.isSystem && (
                                    <span className="ml-2 rounded bg-[var(--theme-hover)] px-1.5 py-0.5 text-[11px] font-normal text-[var(--theme-text-muted)]">
                                      System
                                    </span>
                                  )}
                                </Td>
                                {visibleCols.map((c) => (
                                  <Td
                                    key={c.key}
                                    className={
                                      c.key === "balance"
                                        ? "min-w-0 border-l border-[var(--theme-border)] text-right font-semibold tabular-nums"
                                        : "min-w-0 border-l border-[var(--theme-border)]"
                                    }
                                  >
                                    {c.key === "status" ? (
                                      <StatusPill label={r.status} />
                                    ) : c.key === "balance" ? (
                                      rs(r.balance || 0)
                                    ) : (
                                      <span className="truncate text-[var(--theme-text-muted)]">
                                        {String(r[c.key as keyof AccountItem] ?? "")}
                                      </span>
                                    )}
                                  </Td>
                                ))}
                                <Td className="justify-center border-l border-[var(--theme-border)]">
                                  <span onClick={(e) => e.stopPropagation()}>
                                    <RowMenu items={rowMenu(r)} />
                                  </span>
                                </Td>
                              </div>
                            ))}
                          </GroupTable>
                        </div>
                        <div className="space-y-3 md:hidden">
                          {g.items.map((r) => (
                            <MobileItem
                              key={r.id}
                              name={r.name}
                              subtitle={`${r.code} · ${r.type}`}
                              actions={<RowMenu items={rowMenu(r)} />}
                              rows={[
                                { label: "Parent", value: r.parent },
                                { label: "Balance", value: rs(r.balance || 0) },
                                { label: "Status", value: <StatusPill label={r.status} /> },
                              ]}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          ))}

        {view === "kanban" && (
          <KanbanBoard
            columns={groups}
            keyOf={(r) => r.id}
            renderCard={(r) => (
              <button
                type="button"
                onClick={() => setDetail(r)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left shadow-sm transition-colors hover:bg-[var(--theme-hover)]"
              >
                <span className="block truncate text-[14px] font-medium">{r.name}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--theme-text-muted)]">
                  {r.code} · {r.parent}
                </span>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold tabular-nums">{rs(r.balance || 0)}</span>
                  <StatusPill label={r.status} />
                </div>
              </button>
            )}
          />
        )}
      </BoardBody>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        subtitle="Account details"
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}
      >
        {detail && (
          <div className="grid grid-cols-2 gap-3">
            <Info label="Code" value={detail.code} />
            <Info label="Type" value={detail.type} />
            <Info label="Parent" value={detail.parent || "—"} />
            <Info label="Status" value={detail.status} />
            <Info label="Opening Balance" value={rs(detail.openingBalance || 0)} />
            <Info label="Current Balance" value={rs(detail.balance || 0)} />
            <Info label="System Account" value={detail.isSystem ? "Yes" : "No"} />
            <Info label="Account ID" value={detail.id} />
          </div>
        )}
      </Modal>

      <AccountForm
        modal={modal}
        onClose={() => setModal(null)}
        onSave={async (input) => {
          if (modal?.mode === "edit" && modal.row) {
            await accountsApi.updateAccount(modal.row.id, input);
          } else {
            await accountsApi.createAccount(input);
          }
          await fetchAccounts();
          setModal(null);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await accountsApi.deleteAccount(toDelete.id);
            await fetchAccounts();
          } catch (err: any) {
            alert(err?.message || "Cannot delete account.");
          }
        }}
        title="Delete account"
        confirmLabel="Delete"
        message={`Delete ${toDelete?.name}? This will remove it from the chart of accounts.`}
      />
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

function AccountForm({
  modal,
  onClose,
  onSave,
}: {
  modal: { mode: "add" | "edit"; row?: AccountItem } | null;
  onClose: () => void;
  onSave: (input: any) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<AccType>("Asset");
  const [parent, setParent] = useState(PARENTS[0]);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (modal?.row) {
      setName(modal.row.name);
      setCode(modal.row.code);
      setType(modal.row.type);
      setParent(modal.row.parent || PARENTS[0]);
      setStatus(modal.row.status);
      setOpeningBalance(String(modal.row.openingBalance || 0));
    } else {
      setName("");
      setCode("");
      setType("Asset");
      setParent(PARENTS[0]);
      setStatus("Active");
      setOpeningBalance("0");
    }
    setErr(null);
  }, [modal]);

  const save = async () => {
    if (!name.trim() || !code.trim()) {
      setErr("Name and Code are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        name: name.trim(),
        code: code.trim(),
        type,
        parent,
        status,
        openingBalance: Number(openingBalance) || 0,
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to save account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      width="max-w-xl"
      title={modal?.mode === "edit" ? "Edit Account" : "New Account"}
      subtitle="Define the ledger account and its category."
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Saving…">
            {modal?.mode === "edit" ? "Save Changes" : "Create Account"}
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
        <Field label="Account Name" className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tuition Fees" />
        </Field>
        <Field label="Account Code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 4001" />
        </Field>
        <Field label="Type">
          <Select options={TYPES} value={type} onChange={(e) => setType(e.target.value as AccType)} />
        </Field>
        <Field label="Parent">
          <Select options={PARENTS} value={parent} onChange={(e) => setParent(e.target.value)} />
        </Field>
        <Field label="Opening Balance (Rs)">
          <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select options={["Active", "Inactive"]} value={status} onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")} />
        </Field>
      </div>
    </Modal>
  );
}
