"use client";

import { useState, useEffect } from "react";
import { Archive, Building2, CheckCircle2, MapPin, Pencil, Plus, Power, Settings2, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { Badge, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, cn, ConfirmDialog } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { branchApi, describeApiError, type Branch } from "@/lib/auth/api-client";

const blankBranch = (): Partial<Branch> => ({
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  status: "ACTIVE",
});

export default function BranchesPage() {
  const { signedIn } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Branch> | null>(null);
  const [saved, setSaved] = useState(false);
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  const activeCount = branches.filter((branch) => branch.status === "ACTIVE").length;

  // Fetch branches on mount
  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }

    branchApi.list()
      .then((res) => {
        setBranches(res.branches);
        setLoading(false);
      })
      .catch((err) => {
        setError(describeApiError(err).message);
        setLoading(false);
      });
  }, [signedIn]);

  const handleSave = async () => {
    if (!editing?.name || !editing?.code) return;
    setSaving(true);
    setError(null);

    try {
      if (editing.id) {
        // Update existing branch
        const res = await branchApi.update(editing.id, editing);
        setBranches((items) => items.map((b) => b.id === editing.id ? res.branch : b));
      } else {
        // Create new branch
        const res = await branchApi.create({
          name: editing.name,
          code: editing.code,
          address: editing.address,
          city: editing.city,
          phone: editing.phone,
          status: editing.status || "ACTIVE",
        });
        setBranches((items) => [...items, res.branch]);
      }
      setEditing(null);
      setSaved(true);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (branch: Branch) => {
    const newStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setSaving(true);
    setError(null);

    try {
      const res = await branchApi.updateStatus(branch.id, newStatus);
      setBranches((items) => items.map((b) => b.id === branch.id ? res.branch : b));
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    setError(null);

    try {
      await branchApi.delete(toDelete.id);
      setBranches((items) => items.filter((b) => b.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--theme-text-muted)]" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4 text-center">
        <Building2 className="h-16 w-16 text-[var(--theme-text-muted)]" />
        <p className="text-[15px] font-medium">Please sign in to manage branches.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Branches & Campuses"
        subtitle="Manage campus operations, local settings and branch-level access."
        actions={<Btn variant="primary" Icon={Plus} onClick={() => setEditing(blankBranch())}>Add Branch</Btn>}
      />

      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-danger-soft)] bg-[var(--theme-danger-soft)] p-3 text-[13px] text-[var(--theme-danger-text)] sm:mx-6">
          {error}
        </div>
      )}

      <div className="space-y-5 px-4 pb-24 pt-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Active campuses" value={activeCount} detail="Available for day-to-day operations" />
          <Metric label="Inactive campuses" value={branches.filter((branch) => branch.status === "INACTIVE").length} detail="Not currently in use" />
          <Metric label="Total campuses" value={branches.length} detail="All registered branches" />
        </div>

        <Card pad={false}>
          <CardHead title="Campus directory" subtitle="Each campus owns its operational records and document numbering." Icon={Building2} />
          <div className="divide-y divide-[var(--theme-border)]">
            {branches.map((branch) => (
              <div key={branch.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${branch.isMain ? "bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]" : "bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]"}`}>
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{branch.name}</p>
                    {branch.isMain && <Badge label="Main" tone="blue" />}
                    <Badge label={branch.status} tone={branch.status === "ACTIVE" ? "green" : "gray"} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[13px] text-[var(--theme-text-muted)]">
                    <MapPin className="h-3.5 w-3.5" />
                    {branch.city || "No city"} · {branch.code}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Btn size="sm" variant="ghost" Icon={Pencil} onClick={() => setEditing(branch)}>
                    Edit
                  </Btn>
                  {branch.status === "ACTIVE" ? (
                    <Btn size="sm" variant="ghost" Icon={Power} onClick={() => handleStatusToggle(branch)}>
                      Deactivate
                    </Btn>
                  ) : (
                    <Btn size="sm" variant="ghost" Icon={CheckCircle2} onClick={() => handleStatusToggle(branch)}>
                      Activate
                    </Btn>
                  )}
                  {!branch.isMain && (
                    <Btn size="sm" variant="ghost" Icon={Trash2} onClick={() => setToDelete(branch)}>
                      Delete
                    </Btn>
                  )}
                </div>
              </div>
            ))}
            {branches.length === 0 && (
              <div className="p-8 text-center text-[var(--theme-text-muted)]">
                <Building2 className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>No branches found. Add your first campus to get started.</p>
              </div>
            )}
          </div>
        </Card>

        <Card pad={false}>
          <CardHead title="Branch isolation" subtitle="Frontend context is ready for API enforcement." Icon={Settings2} />
          <div className="grid gap-3 p-4 text-[13px] text-[var(--theme-text-muted)] sm:grid-cols-3">
            <p>
              <strong className="text-[var(--theme-text)]">Operational scope</strong>
              <br />
              Students, fees, staff, classes and transactions must carry a branch ID.
            </p>
            <p>
              <strong className="text-[var(--theme-text)]">Access scope</strong>
              <br />
              Roles combine module permissions with one, multiple or all campus assignments.
            </p>
            <p>
              <strong className="text-[var(--theme-text)]">Safe history</strong>
              <br />
              Transfers preserve historical campus records; archive rather than delete financial or academic data.
            </p>
          </div>
        </Card>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit campus" : "Add campus"}
        subtitle="Campus profile and operational defaults"
        width="max-w-2xl"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save campus"}
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Branch Name">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Branch Code">
              <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="City">
              <Input value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select
                options={["ACTIVE", "INACTIVE"]}
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as "ACTIVE" | "INACTIVE" })}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal open={saved} onClose={() => setSaved(false)} title="Campus saved" width="max-w-md" footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <p className="py-2 text-[14px] text-[var(--theme-text-muted)]">The campus configuration has been updated successfully.</p>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete campus"
        message={`Are you sure you want to delete "${toDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Card>
      <p className="text-[12px] font-medium text-[var(--theme-text-muted)]">{label}</p>
      <p className="mt-1 text-[22px] font-bold">{value}</p>
      <p className="mt-1 text-[12px] text-[var(--theme-text-faint)]">{detail}</p>
    </Card>
  );
}
