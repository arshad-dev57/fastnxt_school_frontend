"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, KeyRound, UserCheck, UserX, Trash2, Search, ShieldCheck, RefreshCw } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Th, Td, cn,
} from "@/components/ui";
import { type UserRow } from "@/lib/mock-data";
import { DEFAULT_ROLE_LIST, STAFF_LOGIN_ROLES } from "@/lib/branch-access";
import type { UserRole } from "@/lib/branch";
import { useBranch } from "@/lib/branch-context";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { usersApi, describeApiError } from "@/lib/auth/api-client";

const FILTER_ROLE_OPTIONS = DEFAULT_ROLE_LIST as UserRole[];
const COLS = "grid-cols-[minmax(170px,1.4fr)_minmax(180px,1.4fr)_minmax(120px,1fr)_130px_150px_100px_64px]";
const STEPS = 6;

type UserFormData = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserRow["status"];
  branchId: string;
  password: string;
  confirmPassword: string;
};

function toUserRow(u: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  branchId?: string | null;
  lastLogin?: string;
  status: UserRow["status"];
}): UserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role,
    branchId: u.branchId ?? null,
    lastLogin: u.lastLogin || "—",
    status: u.status,
  };
}

export default function ManageLoginPage() {
  const { currentBranchId, availableBranches } = useBranch();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: UserRow } | null>(null);
  const [reset, setReset] = useState<UserRow | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [sent, setSent] = useState(false);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list({ q, role, status });
      setRows(res.users.map(toUserRow));
    } catch (err) {
      const { message } = describeApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [q, role, status]);

  const filtered = useMemo(() => rows, [rows]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const branchName = (branchId?: string | null) => {
    if (!branchId) return "—";
    return availableBranches.find((b) => b.id === branchId)?.name || "—";
  };

  const handleToggleStatus = async (user: UserRow) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await usersApi.toggleStatus(user.id, nextStatus);
      setRows((p) => p.map((r) => (r.id === user.id ? { ...r, status: nextStatus } : r)));
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const handleDeleteUser = async () => {
    if (!toDelete) return;
    try {
      await usersApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const handleResetPassword = async () => {
    if (!reset) return;
    try {
      await usersApi.resetPassword(reset.id, resetPasswordInput || undefined);
      setSent(true);
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const handleSaveUser = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        role: data.role,
        status: data.status,
        branchId: data.branchId || null,
        password: data.password || undefined,
      };

      if (modal?.mode === "edit" && modal.row) {
        const res = await usersApi.update(modal.row.id, {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          status: payload.status,
          branchId: payload.branchId,
          isActive: data.status === "Active",
        });
        setRows((p) => p.map((r) => (r.id === res.user.id ? toUserRow(res.user) : r)));
      } else {
        const res = await usersApi.create(payload);
        setRows((p) => [toUserRow(res.user), ...p]);
      }
      setModal(null);
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rowMenu = (r: UserRow) => [
    { label: "Edit User", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Reset Password", Icon: KeyRound, onClick: () => { setReset(r); setResetPasswordInput(""); setSent(false); } },
    { label: r.status === "Active" ? "Deactivate" : "Activate", Icon: r.status === "Active" ? UserX : UserCheck, onClick: () => handleToggleStatus(r) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="Manage Login / Accounts" subtitle="Create staff login accounts and control access to the system."
        actions={
          <>
            <Link href="/users/roles" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <ShieldCheck className="h-[18px] w-[18px]" /> Roles & Permissions
            </Link>
            <SplitButton label="Add User" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name or email" className="w-full sm:w-72" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} options={FILTER_ROLE_OPTIONS} placeholder="All Roles" className="w-40" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
            <Btn variant="secondary" Icon={RefreshCw} onClick={fetchUsers}>Refresh</Btn>
          </div>
        </div>

        <BranchScopeBar count={filtered.length} noun="accounts" />

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        <Card pad={false}>
          {loading ? (
            <div className="p-8 text-center text-[var(--theme-text-muted)]">
              Loading user accounts from backend...
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                  <Th className="border-l border-[var(--theme-border)]">User</Th>
                  <Th className="border-l border-[var(--theme-border)]">Email</Th>
                  <Th className="border-l border-[var(--theme-border)]">Phone</Th>
                  <Th className="border-l border-[var(--theme-border)]">Role</Th>
                  <Th className="border-l border-[var(--theme-border)]">Last Login</Th>
                  <Th className="border-l border-[var(--theme-border)]">Status</Th>
                  <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                </div>
                {paged.map((r) => (
                  <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                    <Td className="border-l border-[var(--theme-border)]">
                      <div className="flex min-w-0 items-center gap-2.5"><Avatar name={r.name} /><span className="truncate font-medium">{r.name}</span></div>
                    </Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]"><span className="truncate">{r.email}</span></Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]"><span className="truncate">{r.phone || "—"}</span></Td>
                    <Td className="border-l border-[var(--theme-border)]"><Badge label={r.role} tone={r.role === "Super Admin" || r.role === "Owner" ? "purple" : "gray"} /></Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.lastLogin}</Td>
                    <Td className="border-l border-[var(--theme-border)]"><Badge label={r.status} /></Td>
                    <Td className="justify-center border-l border-[var(--theme-border)]"><RowMenu items={rowMenu(r)} /></Td>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-3 md:hidden">
                {paged.map((r) => (
                  <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-accent)" }}>
                    <div className="flex items-start gap-3">
                      <Avatar name={r.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-medium">{r.name}</p>
                        <p className="truncate text-[12px] text-[var(--theme-text-faint)]">{r.email}</p>
                        <p className="truncate text-[12px] text-[var(--theme-text-faint)]">{r.phone || "No phone"} · {branchName(r.branchId)}</p>
                      </div>
                      <RowMenu items={rowMenu(r)} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge label={r.role} tone={r.role === "Super Admin" || r.role === "Owner" ? "purple" : "gray"} />
                      <Badge label={r.status} />
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--theme-text-faint)]">Last login {r.lastLogin}</p>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && <EmptyState Icon={Search} title="No users found" message="Adjust the filters or add a new staff login account." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add User</Btn>} />}
              <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
            </>
          )}
        </Card>
      </div>

      <UserForm
        modal={modal}
        onClose={() => setModal(null)}
        isSubmitting={isSubmitting}
        onSave={handleSaveUser}
        defaultBranchId={currentBranchId !== "all" ? currentBranchId : availableBranches[0]?.id || ""}
        branches={availableBranches.map((b) => ({ id: b.id, name: b.name }))}
      />

      <Modal open={!!reset} onClose={() => { setReset(null); setSent(false); }} title="Reset Password" subtitle={reset?.name} width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => { setReset(null); setSent(false); }}>Cancel</Btn>
          <Btn variant="primary" Icon={KeyRound} onClick={handleResetPassword}>Send Reset Link / Update</Btn></>}>
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><UserCheck className="h-7 w-7" /></span>
            <p className="text-[15px] font-medium">Password updated / reset link sent</p>
            <p className="text-[13px] text-[var(--theme-text-muted)]">Password action processed for {reset?.email}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed text-[var(--theme-text-muted)]">
              Send a password reset link or update password for <span className="font-medium text-[var(--theme-text)]">{reset?.email}</span>.
            </p>
            <Field label="New Password (optional)"><Input type="password" value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} placeholder="Leave blank for default reset" /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDeleteUser}
        title="Delete user account" confirmLabel="Delete" message={`Remove the login account for ${toDelete?.name}? They will lose access immediately.`} />
    </>
  );
}

function UserForm({
  modal,
  onClose,
  onSave,
  isSubmitting,
  defaultBranchId,
  branches,
}: {
  modal: { mode: "add" | "edit"; row?: UserRow } | null;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  isSubmitting: boolean;
  defaultBranchId: string;
  branches: { id: string; name: string }[];
}) {
  const blank = (): UserFormData => ({
    name: "",
    email: "",
    phone: "",
    role: "Receptionist",
    status: "Active",
    branchId: defaultBranchId,
    password: "",
    confirmPassword: "",
  });

  const fromRow = (row: UserRow): UserFormData => ({
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    role: (row.role as UserRole) || "Receptionist",
    status: row.status,
    branchId: row.branchId || defaultBranchId,
    password: "",
    confirmPassword: "",
  });

  const [form, setForm] = useState<UserFormData>(modal?.row ? fromRow(modal.row) : blank());
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}-${defaultBranchId}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(modal?.row ? fromRow(modal.row) : blank());
  }

  const currentRole = modal?.row?.role as UserRole | undefined;
  const roleOptions = useMemo(() => {
    const base = [...STAFF_LOGIN_ROLES];
    if (currentRole && (currentRole === "Teacher" || currentRole === "Student") && !base.includes(currentRole)) {
      return [currentRole, ...base];
    }
    return base;
  }, [currentRole]);

  const set = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      alert("Full name and email are required.");
      return;
    }
    if (!form.phone.trim()) {
      alert("Phone number is required.");
      return;
    }
    if (!form.branchId) {
      alert("Please select a campus / branch.");
      return;
    }
    if (modal?.mode === "add") {
      if (!form.password || form.password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        alert("Password and confirm password do not match.");
        return;
      }
    }
    onSave(form);
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      width="max-w-2xl"
      title={modal?.mode === "edit" ? "Edit User Account" : "New Staff Login"}
      subtitle="Staff accounts only — teachers and students are added from Employees / Students"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : modal?.mode === "edit" ? "Save Changes" : "Create User"}
          </Btn>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Personal details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name *" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sara Ahmed" />
            </Field>
            <Field label="Email *">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@school.com" />
            </Field>
            <Field label="Phone *">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Access & campus</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role *">
              <Select
                options={roleOptions}
                value={form.role}
                onChange={(e) => set("role", e.target.value as UserRole)}
                disabled={currentRole === "Teacher" || currentRole === "Student"}
              />
            </Field>
            <Field label="Status">
              <Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set("status", e.target.value as UserRow["status"])} />
            </Field>
            <Field label="Campus / Branch *" className="sm:col-span-2">
              <div className="relative">
                <select
                  className="h-10 w-full appearance-none rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 pr-9 text-[14px] outline-none focus:border-[var(--theme-primary)]"
                  value={form.branchId}
                  onChange={(e) => set("branchId", e.target.value)}
                >
                  <option value="">Select campus</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </Field>
          </div>
          {modal?.mode === "add" && (
            <p className="mt-2 text-[12px] text-[var(--theme-text-muted)]">
              Teacher and Student logins are created from{" "}
              <Link href="/employees/new" className="underline underline-offset-2">Employees</Link>
              {" "}and{" "}
              <Link href="/students/new" className="underline underline-offset-2">Students</Link>
              {" "}— not here.
            </p>
          )}
        </div>

        {modal?.mode === "add" && (
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Login password</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Password *">
                <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 characters" />
              </Field>
              <Field label="Confirm Password *">
                <Input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter password" />
              </Field>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
