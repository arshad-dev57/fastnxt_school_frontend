"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Server, Boxes, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import {
  accountsApi,
  assetsApi,
  describeApiError,
  type AssetItem,
  type CashBankAccountItem,
} from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog, rs } from "@/components/ui";

const COLORS: Record<string, string> = {
  "In Use": "var(--theme-success)",
  "In Store": "var(--theme-info)",
  Repair: "var(--theme-warning)",
  Disposed: "var(--theme-pending)",
};
const PAY_METHODS = ["Cash", "Bank", "Cheque", "Online"] as const;
const STATUSES = ["In Use", "In Store", "Repair", "Disposed"] as const;

function cashBankLabel(a: CashBankAccountItem) {
  const num = a.number && a.number !== "—" ? a.number : "";
  return num ? `${a.name} (${num})` : a.name;
}

export default function AssetsPage() {
  const { currentBranchId, availableBranches } = useBranch();
  const [rows, setRows] = useState<(AssetItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: AssetItem } | null>(null);
  const [toDelete, setToDelete] = useState<AssetItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await assetsApi.list({ branchId: branchScope });
      setRows((res.assets || []).map((r) => ({ ...r, branchId: r.branchId || "" })));
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
      await assetsApi.delete(toDelete.id);
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

      <BranchBoard<AssetItem & { branchId: string }>
        title="Asset Register"
        subtitle="Capital assets with tags, locations and warranty — purchases post to Fixed Assets in accounting."
        Icon={Server}
        nameLabel="Asset"
        countNoun="assets"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.name}
        subtitleOf={(r) => `${r.tag} · ${r.category}`}
        searchTextOf={(r) => `${r.name} ${r.tag} ${r.category} ${r.location} ${r.assignee} ${r.voucherNo || ""}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>
              Add Asset
            </Btn>
            <Link
              href="/inventory"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <Boxes className="h-[18px] w-[18px]" /> Inventory
            </Link>
          </div>
        }
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "tag", label: "Asset No.", width: "120px", cell: (r) => r.tag },
          { key: "location", label: "Location", width: "minmax(140px,1fr)", cell: (r) => r.location || "—" },
          { key: "assignee", label: "Assigned To", width: "minmax(140px,1fr)", cell: (r) => r.assignee || "—" },
          { key: "cost", label: "Cost", width: "140px", cell: (r) => rs(r.cost) },
          { key: "warranty", label: "Warranty", width: "120px", cell: (r) => r.warranty || "—" },
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
          { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Asset", value: r.name },
          { label: "Asset No.", value: r.tag },
          { label: "Category", value: r.category },
          { label: "Purchased", value: r.purchaseDate || "—" },
          { label: "Cost", value: rs(r.cost) },
          { label: "Location", value: r.location || "—" },
          { label: "Assigned To", value: r.assignee || "—" },
          { label: "Warranty", value: r.warranty || "—" },
          { label: "Payment Voucher", value: r.voucherNo || "—" },
          { label: "Status", value: r.status },
          { label: "Notes", value: r.notes || "—" },
        ]}
        mobileRows={(r) => [
          { label: "Tag", value: r.tag },
          { label: "Location", value: r.location || "—" },
          { label: "Cost", value: rs(r.cost) },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No assets"
        emptyMessage="Register capital assets for this campus. Purchases with a cost post to Fixed Assets in accounts."
      />

      <AssetForm
        modal={modal}
        onClose={() => setModal(null)}
        onSave={(saved: AssetItem) => {
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

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Remove the asset "${toDelete?.name}" (${toDelete?.tag})?`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
      />
    </>
  );
}

function AssetForm({
  modal,
  onClose,
  onSave,
  currentBranchId,
  branches,
  cashBankAccounts,
}: {
  modal: { mode: "add" | "edit"; row?: AssetItem } | null;
  onClose: () => void;
  onSave: (saved: AssetItem) => void;
  currentBranchId: string;
  branches: { id: string; name: string }[];
  cashBankAccounts: CashBankAccountItem[];
}) {
  const blank = {
    name: "",
    category: "",
    tag: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    cost: 0,
    location: "",
    assignee: "",
    warranty: "",
    status: "In Use",
    notes: "",
    supplier: "",
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
            name: modal.row.name,
            category: modal.row.category,
            tag: modal.row.tag,
            purchaseDate: modal.row.purchaseDate || "",
            cost: modal.row.cost || 0,
            location: modal.row.location || "",
            assignee: modal.row.assignee || "",
            warranty: modal.row.warranty || "",
            status: modal.row.status || "In Use",
            notes: modal.row.notes || "",
            supplier: "",
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

  const showAccounting = modal?.mode === "add" && form.postToAccounts && Number(form.cost) > 0;

  const submit = async () => {
    if (!form.name.trim()) return setErr("Asset name is required.");
    if (!form.category.trim()) return setErr("Category is required.");
    if (!form.branchId) return setErr("Select a campus/branch.");
    setSubmitting(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        tag: form.tag.trim() || undefined,
        purchaseDate: form.purchaseDate || undefined,
        cost: Number(form.cost) || 0,
        location: form.location.trim(),
        assignee: form.assignee.trim(),
        warranty: form.warranty.trim(),
        status: form.status,
        notes: form.notes.trim(),
        branchId: form.branchId,
        postToAccounts: modal?.mode === "add" ? form.postToAccounts : false,
        method: form.method,
        cashBankAccountId: form.cashBankAccountId || undefined,
        supplier: form.supplier.trim() || undefined,
      };
      let res;
      if (modal?.mode === "edit" && modal.row) {
        res = await assetsApi.update(modal.row.id, payload);
      } else {
        res = await assetsApi.create(payload);
      }
      onSave(res.asset);
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
      title={modal?.mode === "edit" ? "Edit Asset" : "New Asset"}
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
        <Field label="Asset Name" className="col-span-2">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Category">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="IT, Vehicle, Furniture..."
          />
        </Field>
        <Field label="Asset Tag">
          <Input
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            placeholder="Auto-generated if empty"
          />
        </Field>
        <Field label="Purchase Date">
          <Input
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
        </Field>
        <Field label="Cost (Rs)">
          <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="Assigned To">
          <Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
        </Field>
        <Field label="Warranty">
          <Input
            value={form.warranty}
            onChange={(e) => setForm({ ...form, warranty: e.target.value })}
            placeholder="e.g. 2027-06-14 or Expired"
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[...STATUSES]}
          />
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
            <Field label="Supplier / Vendor" className="col-span-2">
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Shown on the payment voucher party"
              />
            </Field>
            <Field label="Post to accounts" className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.postToAccounts}
                  onChange={(e) => setForm({ ...form, postToAccounts: e.target.checked })}
                />
                Create Payment voucher (Debit Fixed Assets / Credit Cash-Bank)
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
        <Field label="Notes" className="col-span-2">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
