"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Boxes, Server, Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import {
  accountsApi,
  describeApiError,
  inventoryApi,
  type CashBankAccountItem,
  type InventoryItem,
} from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog, rs } from "@/components/ui";

const COLORS: Record<string, string> = {
  "In Stock": "var(--theme-success)",
  "Low Stock": "var(--theme-warning)",
  "Out of Stock": "var(--theme-danger)",
};
const PAY_METHODS = ["Cash", "Bank", "Cheque", "Online"] as const;

function cashBankLabel(a: CashBankAccountItem) {
  const num = a.number && a.number !== "—" ? a.number : "";
  return num ? `${a.name} (${num})` : a.name;
}

export default function InventoryPage() {
  const { currentBranchId, availableBranches } = useBranch();
  const [rows, setRows] = useState<(InventoryItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: InventoryItem } | null>(null);
  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await inventoryApi.list({ branchId: branchScope });
      setRows((res.items || []).map((r) => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    accountsApi
      .listBankAccounts()
      .then((res) => setCashBankAccounts((res.accounts || []).filter((a) => a.isActive !== false)))
      .catch(() => setCashBankAccounts([]));
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await inventoryApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(describeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-3 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
          {error}
          <button type="button" className="ml-2 underline" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      <BranchBoard<InventoryItem & { branchId: string }>
        title="Inventory & Stock"
        subtitle="Consumables, stock levels, reorder alerts — purchases post to Inventory Stock in accounting."
        Icon={Boxes}
        nameLabel="Item"
        countNoun="items"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.item}
        subtitleOf={(r) => `${r.category} · ${r.supplier || "No supplier"}`}
        searchTextOf={(r) => `${r.item} ${r.category} ${r.supplier} ${r.voucherNo || ""}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>
              Add Item
            </Btn>
            <Link
              href="/assets"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <Server className="h-[18px] w-[18px]" /> Assets
            </Link>
          </div>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Adjust Stock", Icon: ArrowUpDown, onClick: () => setAdjustModal(r) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "category", label: "Category", width: "140px", cell: (r) => r.category },
          { key: "qty", label: "Qty", width: "110px", cell: (r) => `${r.qty} ${r.unit}` },
          { key: "reorder", label: "Reorder At", width: "110px", cell: (r) => r.reorder },
          { key: "supplier", label: "Supplier", width: "minmax(140px,1fr)", cell: (r) => r.supplier || "—" },
          { key: "value", label: "Value", width: "130px", cell: (r) => (r.value ? rs(r.value) : "—") },
          {
            key: "voucher",
            label: "Voucher",
            width: "110px",
            cell: (r) =>
              r.voucherNo ? (
                <Link href="/accounts/payment-vouchers" className="text-[var(--theme-primary)] underline-offset-2 hover:underline">
                  {r.voucherNo}
                </Link>
              ) : (
                "—"
              ),
          },
          { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Item", value: r.item },
          { label: "Category", value: r.category },
          { label: "Quantity", value: `${r.qty} ${r.unit}` },
          { label: "Reorder Level", value: r.reorder },
          { label: "Supplier", value: r.supplier || "—" },
          { label: "Value", value: r.value ? rs(r.value) : "—" },
          { label: "Payment Voucher", value: r.voucherNo || "—" },
          { label: "Status", value: r.status },
        ]}
        mobileRows={(r) => [
          { label: "Category", value: r.category },
          { label: "Qty", value: `${r.qty} ${r.unit}` },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No inventory items"
        emptyMessage="Add stock for this campus. Purchases with a value will post to Inventory Stock in accounts."
      />

      <InventoryForm
        modal={modal}
        onClose={() => setModal(null)}
        onSave={(saved: InventoryItem) => {
          setRows((p) =>
            modal?.mode === "edit"
              ? p.map((r) => (r.id === saved.id ? { ...saved, branchId: saved.branchId || "" } : r))
              : [{ ...saved, branchId: saved.branchId || "" }, ...p]
          );
          setModal(null);
        }}
        currentBranchId={currentBranchId}
        branches={availableBranches}
        cashBankAccounts={cashBankAccounts}
      />

      <AdjustStockModal
        item={adjustModal}
        onClose={() => setAdjustModal(null)}
        onSave={(saved: InventoryItem) => {
          setRows((p) => p.map((r) => (r.id === saved.id ? { ...saved, branchId: saved.branchId || "" } : r)));
          setAdjustModal(null);
        }}
        cashBankAccounts={cashBankAccounts}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Remove the inventory item "${toDelete?.item}"?`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
      />
    </>
  );
}

function InventoryForm({
  modal,
  onClose,
  onSave,
  currentBranchId,
  branches,
  cashBankAccounts,
}: {
  modal: { mode: "add" | "edit"; row?: InventoryItem } | null;
  onClose: () => void;
  onSave: (saved: InventoryItem) => void;
  currentBranchId: string;
  branches: { id: string; name: string }[];
  cashBankAccounts: CashBankAccountItem[];
}) {
  const blank = {
    item: "",
    category: "",
    qty: 0,
    unit: "pc",
    reorder: 0,
    supplier: "",
    value: 0,
    branchId: currentBranchId !== "all" ? currentBranchId : branches[0]?.id || "",
    postToAccounts: true,
    method: "Cash",
    cashBankAccountId: "",
  };
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const key = `${modal?.mode}-${modal?.row?.id}-${currentBranchId}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setForm(
      modal?.row
        ? {
            item: modal.row.item,
            category: modal.row.category,
            qty: modal.row.qty || 0,
            unit: modal.row.unit || "pc",
            reorder: modal.row.reorder || 0,
            supplier: modal.row.supplier || "",
            value: modal.row.value || 0,
            branchId: modal.row.branchId || (currentBranchId !== "all" ? currentBranchId : branches[0]?.id || ""),
            postToAccounts: false,
            method: "Cash",
            cashBankAccountId: "",
          }
        : blank
    );
    setErr(null);
  }

  const cashBankOptions = useMemo(() => {
    if (form.method === "Cash") return cashBankAccounts.filter((a) => a.kind === "Cash");
    const banks = cashBankAccounts.filter((a) => a.kind === "Bank");
    return banks.length > 0 ? banks : cashBankAccounts;
  }, [cashBankAccounts, form.method]);

  useEffect(() => {
    if (!modal || modal.mode === "edit") return;
    if (cashBankOptions.length === 0) {
      setForm((f) => ({ ...f, cashBankAccountId: "" }));
      return;
    }
    if (!cashBankOptions.some((a) => a.id === form.cashBankAccountId)) {
      setForm((f) => ({ ...f, cashBankAccountId: cashBankOptions[0].id }));
    }
  }, [modal, cashBankOptions, form.cashBankAccountId]);

  const showAccounting = modal?.mode === "add" && form.postToAccounts && Number(form.value) > 0;

  const submit = async () => {
    if (!form.item.trim()) return setErr("Item name is required.");
    if (!form.category.trim()) return setErr("Category is required.");
    if (!form.branchId) return setErr("Select a campus/branch.");
    setSubmitting(true);
    setErr(null);
    try {
      const payload = {
        item: form.item.trim(),
        category: form.category.trim(),
        qty: Number(form.qty) || 0,
        unit: form.unit.trim() || "pc",
        reorder: Number(form.reorder) || 0,
        supplier: form.supplier.trim(),
        value: Number(form.value) || 0,
        branchId: form.branchId,
        postToAccounts: modal?.mode === "add" ? form.postToAccounts : false,
        method: form.method,
        cashBankAccountId: form.cashBankAccountId || undefined,
      };
      let res;
      if (modal?.mode === "edit" && modal.row) {
        res = await inventoryApi.update(modal.row.id, payload);
      } else {
        res = await inventoryApi.create(payload);
      }
      onSave(res.item);
    } catch (e: unknown) {
      setErr(describeApiError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      title={modal?.mode === "edit" ? "Edit Item" : "New Inventory Item"}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>
            Save
          </Btn>
        </>
      }
    >
      {err && <div className="mb-4 text-sm text-red-500">{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Item Name" className="col-span-2">
          <Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
        </Field>
        <Field label="Category">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Stationery, Lab, IT..."
          />
        </Field>
        <Field label="Supplier">
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </Field>
        <Field label="Quantity">
          <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
        </Field>
        <Field label="Unit">
          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pc, box, ream..." />
        </Field>
        <Field label="Reorder Level">
          <Input
            type="number"
            value={form.reorder}
            onChange={(e) => setForm({ ...form, reorder: Number(e.target.value) })}
          />
        </Field>
        <Field label="Value (Rs)">
          <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        </Field>
        {(currentBranchId === "all" || modal?.mode === "edit") && (
          <Field label="Campus" className="col-span-2">
            <select
              className="h-10 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-sm"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {modal?.mode === "add" && (
          <>
            <Field label="Post to accounts" className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.postToAccounts}
                  onChange={(e) => setForm({ ...form, postToAccounts: e.target.checked })}
                />
                Create Payment voucher (Debit Inventory Stock / Credit Cash-Bank)
              </label>
            </Field>
            {showAccounting && (
              <>
                <Field label="Pay method">
                  <Select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    options={[...PAY_METHODS]}
                  />
                </Field>
                <Field label={form.method === "Cash" ? "Cash account" : "Bank account"}>
                  <select
                    className="h-10 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-sm"
                    value={form.cashBankAccountId}
                    onChange={(e) => setForm({ ...form, cashBankAccountId: e.target.value })}
                  >
                    {cashBankOptions.length === 0 && <option value="">Default ledger account</option>}
                    {cashBankOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {cashBankLabel(a)}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function AdjustStockModal({
  item,
  onClose,
  onSave,
  cashBankAccounts,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (saved: InventoryItem) => void;
  cashBankAccounts: CashBankAccountItem[];
}) {
  const [delta, setDelta] = useState(0);
  const [amount, setAmount] = useState(0);
  const [postToAccounts, setPostToAccounts] = useState(true);
  const [method, setMethod] = useState("Cash");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lastId = useRef(item?.id);
  if (lastId.current !== item?.id) {
    lastId.current = item?.id;
    setDelta(0);
    setAmount(0);
    setPostToAccounts(true);
    setMethod("Cash");
    setCashBankAccountId("");
    setErr(null);
  }

  const cashBankOptions = useMemo(() => {
    if (method === "Cash") return cashBankAccounts.filter((a) => a.kind === "Cash");
    const banks = cashBankAccounts.filter((a) => a.kind === "Bank");
    return banks.length > 0 ? banks : cashBankAccounts;
  }, [cashBankAccounts, method]);

  useEffect(() => {
    if (!item || delta <= 0) return;
    if (cashBankOptions.length === 0) {
      setCashBankAccountId("");
      return;
    }
    if (!cashBankOptions.some((a) => a.id === cashBankAccountId)) {
      setCashBankAccountId(cashBankOptions[0].id);
    }
  }, [item, delta, cashBankOptions, cashBankAccountId]);

  const submit = async () => {
    if (!item) return;
    if (delta === 0) return setErr("Delta must be non-zero.");
    setSubmitting(true);
    setErr(null);
    try {
      const res = await inventoryApi.adjustStock(item.id, {
        delta,
        amount: amount > 0 ? amount : undefined,
        postToAccounts,
        method,
        cashBankAccountId: cashBankAccountId || undefined,
      });
      onSave(res.item);
    } catch (e: unknown) {
      setErr(describeApiError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={`Adjust Stock — ${item?.item ?? ""}`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit} disabled={submitting} loading={submitting}>
            Apply
          </Btn>
        </>
      }
    >
      {err && <div className="mb-4 text-sm text-red-500">{err}</div>}
      <p className="mb-3 text-sm text-[var(--theme-text-muted)]">
        Current stock:{" "}
        <strong>
          {item?.qty ?? 0} {item?.unit}
        </strong>{" "}
        · Value: <strong>{item?.value ? rs(item.value) : "—"}</strong>. Positive delta adds stock; negative consumes
        it.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Delta (+ add / − consume)">
          <Input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
        </Field>
        <Field label="Value delta (Rs, optional)">
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </Field>
        <Field label="Post to accounts" className="col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={postToAccounts} onChange={(e) => setPostToAccounts(e.target.checked)} />
            {delta >= 0
              ? "Purchase voucher → Inventory Stock"
              : "Consumption journal → Stationery / Inventory Stock"}
          </label>
        </Field>
        {postToAccounts && delta > 0 && (
          <>
            <Field label="Pay method">
              <Select value={method} onChange={(e) => setMethod(e.target.value)} options={[...PAY_METHODS]} />
            </Field>
            <Field label={method === "Cash" ? "Cash account" : "Bank account"}>
              <select
                className="h-10 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-sm"
                value={cashBankAccountId}
                onChange={(e) => setCashBankAccountId(e.target.value)}
              >
                {cashBankOptions.length === 0 && <option value="">Default ledger account</option>}
                {cashBankOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {cashBankLabel(a)}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>
      {item && delta !== 0 && (
        <p className="mt-3 text-sm">
          New stock:{" "}
          <strong>
            {Math.max(0, (item.qty ?? 0) + delta)} {item.unit}
          </strong>
        </p>
      )}
    </Modal>
  );
}
