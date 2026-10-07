"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bus, Route as RouteIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { vehiclesApi, type VehicleItem } from "@/lib/auth/api-client";
import { Btn, Modal, Field, Input, Select, ConfirmDialog } from "@/components/ui";

const COLORS: Record<string, string> = {
  Active: "var(--theme-success)",
  Maintenance: "var(--theme-warning)",
  Inactive: "var(--theme-danger)",
};

export default function TransportPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(VehicleItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: VehicleItem } | null>(null);
  const [toDelete, setToDelete] = useState<VehicleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await vehiclesApi.list({ branchId: branchScope });
      setRows((res.vehicles || []).map((r) => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load fleet vehicles");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await vehiclesApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete vehicle");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BranchBoard<VehicleItem & { branchId: string }>
        title="Transport — Fleet"
        subtitle="Vehicles, drivers, routes and fitness status for the campus."
        Icon={Bus}
        nameLabel="Vehicle"
        countNoun="vehicles"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status || "Active"}
        groupColorOf={(k) => COLORS[k] || "var(--theme-info)"}
        nameOf={(r) => `${r.number} · ${r.type}`}
        subtitleOf={(r) => `${r.driver} · ${r.route || "Unassigned"}`}
        searchTextOf={(r) => `${r.number} ${r.type} ${r.driver} ${r.route} ${r.driverPhone}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link
              href="/transport/routes"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <RouteIcon className="h-[16px] w-[16px]" /> Routes
            </Link>
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>
              Add Vehicle
            </Btn>
          </div>
        }
        menu={(r) => [
          { label: "Edit Vehicle", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete Vehicle", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          {
            key: "number",
            label: "Vehicle / Reg No",
            width: "150px",
            cell: (r) => (
              <div>
                <div className="font-semibold text-[var(--theme-text)]">{r.number}</div>
                <div className="text-[12px] text-[var(--theme-text-muted)]">{r.type}</div>
              </div>
            ),
          },
          {
            key: "driver",
            label: "Driver",
            width: "minmax(150px,1fr)",
            cell: (r) => (
              <div>
                <div className="font-medium text-[var(--theme-text)]">{r.driver}</div>
                {r.driverPhone && <div className="text-[12px] text-[var(--theme-text-muted)]">{r.driverPhone}</div>}
              </div>
            ),
          },
          { key: "route", label: "Assigned Route", width: "minmax(160px,1.2fr)", cell: (r) => r.route || "Unassigned" },
          { key: "capacity", label: "Capacity", width: "100px", cell: (r) => `${r.capacity} seats` },
          { key: "fitness", label: "Fitness Expiry", width: "140px", cell: (r) => r.fitness || "N/A" },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status || "Active"} /> },
        ]}
        detailFields={(r) => [
          { label: "Vehicle Number", value: r.number },
          { label: "Vehicle Type", value: r.type },
          { label: "Driver Name", value: r.driver },
          { label: "Driver Phone", value: r.driverPhone || "Not provided" },
          { label: "Assigned Route", value: r.route || "Unassigned" },
          { label: "Capacity", value: `${r.capacity} passengers` },
          { label: "Fitness Certificate Expiry", value: r.fitness || "Not set" },
          { label: "Status", value: r.status },
        ]}
        mobileRows={(r) => [
          { label: "Driver", value: r.driver },
          { label: "Capacity", value: `${r.capacity} seats` },
          { label: "Fitness", value: r.fitness || "—" },
          { label: "Status", value: <StatusPill label={r.status || "Active"} /> },
        ]}
        emptyTitle="No fleet vehicles"
        emptyMessage="No vehicle records match the current campus scope."
      />

      <VehicleFormModal
        modal={modal}
        onClose={() => setModal(null)}
        onSave={(saved: any) => {
          setRows((p) =>
            modal?.mode === "edit"
              ? p.map((r) => (r.id === saved.id ? { ...saved, branchId: saved.branchId || "" } : r))
              : [{ ...saved, branchId: saved.branchId || "" }, ...p]
          );
          setModal(null);
        }}
        currentBranchId={currentBranchId}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Remove vehicle "${toDelete?.number}" from fleet?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function VehicleFormModal({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = {
    number: "",
    type: "Bus",
    capacity: "30",
    driver: "",
    driverPhone: "",
    route: "",
    fitness: "",
    status: "Active",
  };
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const key = `${modal?.mode}-${modal?.row?.id}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setForm(
      modal?.row
        ? {
            number: modal.row.number || "",
            type: modal.row.type || "Bus",
            capacity: String(modal.row.capacity || 30),
            driver: modal.row.driver || "",
            driverPhone: modal.row.driverPhone || "",
            route: modal.row.route || "",
            fitness: modal.row.fitness || "",
            status: modal.row.status || "Active",
          }
        : blank
    );
    setErr(null);
  }

  const submit = async () => {
    if (!form.number.trim()) return setErr("Vehicle registration number is required.");
    if (!form.driver.trim()) return setErr("Driver name is required.");
    setSubmitting(true);
    setErr(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      let res;
      const payload = { ...form, capacity: Number(form.capacity) || 30, branchId: branchScope };
      if (modal?.mode === "edit") {
        res = await vehiclesApi.update(modal.row.id, payload);
      } else {
        res = await vehiclesApi.create(payload);
      }
      onSave(res.vehicle);
    } catch (e: any) {
      setErr(e.message || "Failed to save vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      title={modal?.mode === "edit" ? "Edit Vehicle" : "Add Vehicle to Fleet"}
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
        <Field label="Registration Number *">
          <Input
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            placeholder="e.g. LEA-1234"
          />
        </Field>
        <Field label="Vehicle Type">
          <Select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={["Bus", "Coaster", "Van", "Minibus", "Other"]}
          />
        </Field>
        <Field label="Driver Name *">
          <Input
            value={form.driver}
            onChange={(e) => setForm({ ...form, driver: e.target.value })}
            placeholder="e.g. Mohammad Ali"
          />
        </Field>
        <Field label="Driver Phone">
          <Input
            value={form.driverPhone}
            onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
            placeholder="e.g. 0300-1234567"
          />
        </Field>
        <Field label="Assigned Route">
          <Input
            value={form.route}
            onChange={(e) => setForm({ ...form, route: e.target.value })}
            placeholder="e.g. Route 1 — Johar Town"
          />
        </Field>
        <Field label="Passenger Capacity">
          <Input
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="30"
          />
        </Field>
        <Field label="Fitness Expiry Date">
          <Input
            type="date"
            value={form.fitness}
            onChange={(e) => setForm({ ...form, fitness: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["Active", "Maintenance", "Inactive"]}
          />
        </Field>
      </div>
    </Modal>
  );
}
