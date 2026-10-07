"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Route as RouteIcon, Plus, Pencil, Trash2, Bus } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs, Btn, Modal, Field, Input, Select, ConfirmDialog } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import { vehiclesApi, transportRoutesApi, type TransportRouteItem, type VehicleItem } from "@/lib/auth/api-client";

const COLORS: Record<string, string> = {
  Active: "var(--theme-success)",
  Inactive: "var(--theme-danger)",
};

export default function TransportRoutesPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(TransportRouteItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Pick<VehicleItem, "id" | "number" | "type" | "driver" | "capacity">[]>([]);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: TransportRouteItem } | null>(null);
  const [toDelete, setToDelete] = useState<TransportRouteItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [routesRes, vehiclesRes] = await Promise.all([
        transportRoutesApi.list({ branchId: branchScope }),
        vehiclesApi.listForSelect(branchScope),
      ]);
      setRows((routesRes.routes || []).map((r) => ({ ...r, branchId: r.branchId || "" })));
      setVehicles(vehiclesRes.vehicles || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transport routes");
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
      await transportRoutesApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete route");
    } finally {
      setDeleting(false);
    }
  };

  // Helper: display vehicle info for a route row
  const vehicleLabel = (row: TransportRouteItem) => {
    if (!row.vehicleId) return "—";
    const v = vehicles.find((v) => v.id === row.vehicleId);
    return v ? `${v.number} (${v.type})` : row.vehicleId;
  };

  return (
    <>
      <BranchBoard<TransportRouteItem & { branchId: string }>
        title="Transport Routes"
        subtitle="Route coverage, assigned fleet vehicles, distances, passenger capacity and monthly transport fee."
        Icon={RouteIcon}
        nameLabel="Route"
        countNoun="routes"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status || "Active"}
        groupColorOf={(k) => COLORS[k] || "var(--theme-info)"}
        nameOf={(r) => r.name}
        subtitleOf={(r) => `${r.stops} stops · ${r.distance || "0 km"}`}
        searchTextOf={(r) => `${r.name} ${r.distance}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link
              href="/transport"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              ← Fleet
            </Link>
            <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>
              Add Route
            </Btn>
          </div>
        }
        menu={(r) => [
          { label: "Edit Route", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete Route", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          { key: "name", label: "Route Name", width: "minmax(200px,1.5fr)", cell: (r) => r.name },
          { key: "vehicle", label: "Assigned Vehicle", width: "180px", cell: (r) => (
            <span className="flex items-center gap-1">
              {r.vehicleId ? <Bus size={13} className="text-[var(--theme-primary)]" /> : null}
              {vehicleLabel(r)}
            </span>
          )},
          { key: "stops", label: "Stops", width: "90px", cell: (r) => `${r.stops} stops` },
          { key: "distance", label: "Distance", width: "110px", cell: (r) => r.distance || "—" },
          { key: "students", label: "Passengers", width: "110px", cell: (r) => `${r.students}` },
          { key: "monthlyFee", label: "Monthly Fee", width: "140px", cell: (r) => rs(r.monthlyFee) },
          { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status || "Active"} /> },
        ]}
        detailFields={(r) => [
          { label: "Route Name", value: r.name },
          { label: "Assigned Vehicle", value: vehicleLabel(r) },
          { label: "Number of Stops", value: `${r.stops} stops` },
          { label: "Total Distance", value: r.distance || "Not specified" },
          { label: "Assigned Students", value: `${r.students} passengers` },
          { label: "Monthly Transport Fee", value: rs(r.monthlyFee) },
          { label: "Status", value: r.status },
        ]}
        mobileRows={(r) => [
          { label: "Vehicle", value: vehicleLabel(r) },
          { label: "Stops", value: `${r.stops} stops` },
          { label: "Passengers", value: r.students },
          { label: "Monthly Fee", value: rs(r.monthlyFee) },
          { label: "Status", value: <StatusPill label={r.status || "Active"} /> },
        ]}
        emptyTitle="No transport routes"
        emptyMessage="No transport routes match the current campus scope."
      />

      <RouteFormModal
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
        vehicles={vehicles}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Transport Route"
        message={`Remove route "${toDelete?.name}"?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function RouteFormModal({ modal, onClose, onSave, currentBranchId, vehicles }: any) {
  const blank = {
    name: "",
    stops: "5",
    distance: "15 km",
    students: "0",
    monthlyFee: "4500",
    vehicleId: "",
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
            name: modal.row.name || "",
            stops: String(modal.row.stops || 1),
            distance: modal.row.distance || "",
            students: String(modal.row.students || 0),
            monthlyFee: String(modal.row.monthlyFee || 0),
            vehicleId: modal.row.vehicleId || "",
            status: modal.row.status || "Active",
          }
        : blank
    );
    setErr(null);
  }

  const submit = async () => {
    if (!form.name.trim()) return setErr("Route name is required.");
    setSubmitting(true);
    setErr(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      let res;
      const payload = {
        ...form,
        stops: Number(form.stops) || 1,
        students: Number(form.students) || 0,
        monthlyFee: Number(form.monthlyFee) || 0,
        vehicleId: form.vehicleId || null,
        branchId: branchScope,
      };
      if (modal?.mode === "edit") {
        res = await transportRoutesApi.update(modal.row.id, payload);
      } else {
        res = await transportRoutesApi.create(payload);
      }
      onSave(res.route);
    } catch (e: any) {
      setErr(e.message || "Failed to save route.");
    } finally {
      setSubmitting(false);
    }
  };

  // Build vehicle options for the select
  const vehicleOptions = [
    { value: "", label: "— No vehicle assigned —" },
    ...(vehicles || []).map((v: any) => ({
      value: v.id,
      label: `${v.number} · ${v.type} · Driver: ${v.driver} (${v.capacity} seats)`,
    })),
  ];

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      title={modal?.mode === "edit" ? "Edit Transport Route" : "Add Transport Route"}
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
        <Field label="Route Name *" className="col-span-2">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Route 1 — Johar Town & Model Town"
          />
        </Field>

        {/* Fleet vehicle picker */}
        <Field label="Assign Fleet Vehicle" className="col-span-2">
          <select
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            className="w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm"
          >
            {vehicleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {vehicles?.length === 0 && (
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
              No active vehicles found. Add fleet vehicles first.
            </p>
          )}
        </Field>

        <Field label="Number of Stops">
          <Input
            type="number"
            value={form.stops}
            onChange={(e) => setForm({ ...form, stops: e.target.value })}
            placeholder="5"
          />
        </Field>
        <Field label="Distance">
          <Input
            value={form.distance}
            onChange={(e) => setForm({ ...form, distance: e.target.value })}
            placeholder="e.g. 18 km"
          />
        </Field>
        <Field label="Passengers / Students">
          <Input
            type="number"
            value={form.students}
            onChange={(e) => setForm({ ...form, students: e.target.value })}
            placeholder="25"
          />
        </Field>
        <Field label="Monthly Fee (PKR)">
          <Input
            type="number"
            value={form.monthlyFee}
            onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
            placeholder="4500"
          />
        </Field>
        <Field label="Status" className="col-span-2">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["Active", "Inactive"]}
          />
        </Field>
      </div>
    </Modal>
  );
}
