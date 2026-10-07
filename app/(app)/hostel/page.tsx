"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { BedDouble, Plus, Pencil, Trash2, Users } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs, Btn, Modal, Field, Input, Select, ConfirmDialog, Textarea } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import { hostelRoomsApi, type HostelRoomItem } from "@/lib/auth/api-client";

const COLORS: Record<string, string> = {
  Occupied: "var(--theme-warning)",
  Available: "var(--theme-success)",
  Blocked: "var(--theme-danger)",
};

export default function HostelPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<(HostelRoomItem & { branchId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: HostelRoomItem } | null>(null);
  const [toDelete, setToDelete] = useState<HostelRoomItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await hostelRoomsApi.list({ branchId: branchScope });
      setRows((res.rooms || []).map((r) => ({ ...r, branchId: r.branchId || "" })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load hostel rooms");
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
      await hostelRoomsApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete room");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BranchBoard<HostelRoomItem & { branchId: string }>
        title="Hostel & Boarding"
        subtitle="Rooms, beds, occupancy breakdown and wardens for campus hostels."
        Icon={BedDouble}
        nameLabel="Room"
        countNoun="rooms"
        loading={loading}
        rows={rows}
        groupBy={(r) => r.status || "Available"}
        groupColorOf={(k) => COLORS[k] || "var(--theme-info)"}
        nameOf={(r) => `${r.hostel} · Room ${r.room}`}
        subtitleOf={(r) => `${r.type} · Occupancy: ${r.occupied}/${r.beds} beds · Warden: ${r.warden || "Unassigned"}`}
        searchTextOf={(r) => `${r.hostel} ${r.room} ${r.type} ${r.warden} ${(r.residents || []).join(" ")}`}
        primaryAction={
          <Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>
            Add Room
          </Btn>
        }
        menu={(r) => [
          { label: "Edit Room & Occupancy", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
          { label: "Delete Room", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        columns={[
          {
            key: "room",
            label: "Hostel & Room",
            width: "minmax(180px,1.2fr)",
            cell: (r) => (
              <div>
                <div className="font-semibold text-[var(--theme-text)]">{r.hostel}</div>
                <div className="text-[12px] text-[var(--theme-text-muted)]">Room {r.room}</div>
              </div>
            ),
          },
          { key: "type", label: "Room Type", width: "110px", cell: (r) => r.type },
          {
            key: "occupancy",
            label: "Bed Occupancy",
            width: "150px",
            cell: (r) => {
              const pct = Math.min(100, Math.round((r.occupied / (r.beds || 1)) * 100));
              return (
                <div>
                  <div className="flex items-center justify-between text-[12px] font-medium">
                    <span>{r.occupied}/{r.beds} Beds</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--theme-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--theme-primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            },
          },
          { key: "warden", label: "Warden", width: "minmax(140px,1fr)", cell: (r) => r.warden || "Unassigned" },
          { key: "fee", label: "Monthly Fee", width: "140px", cell: (r) => rs(r.monthlyFee) },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status || "Available"} /> },
        ]}
        detailFields={(r) => [
          { label: "Hostel Building", value: r.hostel },
          { label: "Room Number", value: r.room },
          { label: "Room Type", value: r.type },
          { label: "Bed Capacity", value: `${r.beds} beds total` },
          { label: "Current Occupancy", value: `${r.occupied} of ${r.beds} beds occupied` },
          { label: "Warden Name", value: r.warden || "Not assigned" },
          { label: "Monthly Rent / Fee", value: rs(r.monthlyFee) },
          { label: "Room Status", value: r.status },
          {
            label: "Allocated Residents / Students",
            value: Array.isArray(r.residents) && r.residents.length > 0
              ? r.residents.join(", ")
              : "No residents currently assigned",
          },
        ]}
        mobileRows={(r) => [
          { label: "Type", value: r.type },
          { label: "Occupancy", value: `${r.occupied}/${r.beds} beds` },
          { label: "Fee", value: rs(r.monthlyFee) },
          { label: "Status", value: <StatusPill label={r.status || "Available"} /> },
        ]}
        emptyTitle="No hostel rooms"
        emptyMessage="No hostel room records match the current campus scope."
      />

      <HostelRoomFormModal
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
        title="Delete Hostel Room"
        message={`Remove ${toDelete?.hostel} Room ${toDelete?.room}?`}
        confirmLabel="Delete"
      />
    </>
  );
}

function HostelRoomFormModal({ modal, onClose, onSave, currentBranchId }: any) {
  const blank = {
    hostel: "Boys Hostel A",
    room: "",
    type: "Double",
    beds: "2",
    occupied: "0",
    warden: "",
    monthlyFee: "12000",
    status: "Available",
    residentsText: "",
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
            hostel: modal.row.hostel || "Boys Hostel A",
            room: modal.row.room || "",
            type: modal.row.type || "Double",
            beds: String(modal.row.beds || 2),
            occupied: String(modal.row.occupied || 0),
            warden: modal.row.warden || "",
            monthlyFee: String(modal.row.monthlyFee || 0),
            status: modal.row.status || "Available",
            residentsText: Array.isArray(modal.row.residents) ? modal.row.residents.join(", ") : "",
          }
        : blank
    );
    setErr(null);
  }

  const submit = async () => {
    if (!form.hostel.trim()) return setErr("Hostel building name is required.");
    if (!form.room.trim()) return setErr("Room number is required.");
    setSubmitting(true);
    setErr(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const residents = form.residentsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const bedsNum = Number(form.beds) || 2;
      const occupiedNum = Number(form.occupied) || 0;

      let computedStatus = form.status;
      if (occupiedNum >= bedsNum) {
        computedStatus = "Occupied";
      } else if (occupiedNum > 0 && form.status !== "Blocked") {
        computedStatus = "Available";
      }

      const payload = {
        ...form,
        beds: bedsNum,
        occupied: occupiedNum,
        monthlyFee: Number(form.monthlyFee) || 0,
        status: computedStatus,
        residents,
        branchId: branchScope,
      };

      let res;
      if (modal?.mode === "edit") {
        res = await hostelRoomsApi.update(modal.row.id, payload);
      } else {
        res = await hostelRoomsApi.create(payload);
      }
      onSave(res.room);
    } catch (e: any) {
      setErr(e.message || "Failed to save hostel room.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      title={modal?.mode === "edit" ? "Edit Room & Occupancy" : "Add Hostel Room"}
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
        <Field label="Hostel Building / Wing *">
          <Input
            value={form.hostel}
            onChange={(e) => setForm({ ...form, hostel: e.target.value })}
            placeholder="e.g. Boys Hostel A"
          />
        </Field>
        <Field label="Room Number *">
          <Input
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            placeholder="e.g. 101"
          />
        </Field>
        <Field label="Room Type">
          <Select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={["Single", "Double", "Triple", "Quad", "Dormitory"]}
          />
        </Field>
        <Field label="Total Bed Capacity">
          <Input
            type="number"
            value={form.beds}
            onChange={(e) => setForm({ ...form, beds: e.target.value })}
            placeholder="2"
          />
        </Field>
        <Field label="Occupied Beds">
          <Input
            type="number"
            value={form.occupied}
            onChange={(e) => setForm({ ...form, occupied: e.target.value })}
            placeholder="1"
          />
        </Field>
        <Field label="Monthly Fee (PKR)">
          <Input
            type="number"
            value={form.monthlyFee}
            onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
            placeholder="12000"
          />
        </Field>
        <Field label="Warden Name">
          <Input
            value={form.warden}
            onChange={(e) => setForm({ ...form, warden: e.target.value })}
            placeholder="e.g. Prof. Tariq"
          />
        </Field>
        <Field label="Room Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["Available", "Occupied", "Blocked"]}
          />
        </Field>
        <Field
          label="Allocated Residents / Student Names"
          hint="Comma-separated student names or IDs residing in this room."
          className="col-span-2"
        >
          <Textarea
            value={form.residentsText}
            onChange={(e) => setForm({ ...form, residentsText: e.target.value })}
            placeholder="e.g. Hamza Khan (STD-1001), Bilal Raza (STD-1002)"
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
}
