"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, KeyRound, UserCheck, UserX, Trash2, Search, ShieldCheck, RefreshCw } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Th, Td, cn,
} from "@/components/ui";
import { USER_ROLES, type UserRow } from "@/lib/mock-data";
import { useBranch } from "@/lib/branch-context";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { usersApi, describeApiError } from "@/lib/auth/api-client";

const COLS = "grid-cols-[minmax(170px,1.4fr)_minmax(200px,1.6fr)_130px_150px_100px_64px]";
const STEPS = 6;

export default function ManageLoginPage() {
  const { currentBranchId } = useBranch();
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
      const apiUsers: UserRow[] = res.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRow["role"],
        lastLogin: u.lastLogin || "—",
        status: u.status,
      }));
      setRows(apiUsers);
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

  const handleSaveUser = async (data: { name: string; email: string; role: UserRow["role"]; status: UserRow["status"]; password?: string }) => {
    setIsSubmitting(true);
    try {
      if (modal?.mode === "edit" && modal.row) {
        const res = await usersApi.update(modal.row.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          isActive: data.status === "Active",
        });
        setRows((p) => p.map((r) => (r.id === res.user.id ? {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as UserRow["role"],
          lastLogin: res.user.lastLogin || "—",
          status: res.user.status,
        } : r)));
      } else {
        const res = await usersApi.create({
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          password: data.password,
        });
        const newUser: UserRow = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as UserRow["role"],
          lastLogin: res.user.lastLogin || "—",
          status: res.user.status,
        };
        setRows((p) => [newUser, ...p]);
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
      <PageHeader title="Manage Login / Accounts" subtitle="Create user accounts and control access to the system."
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
            <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} options={USER_ROLES} placeholder="All Roles" className="w-40" />
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
                    <Td className="border-l border-[var(--theme-border)]"><Badge label={r.role} tone={r.role === "Super Admin" ? "purple" : r.role === "Administrator" ? "blue" : "gray"} /></Td>
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
                      </div>
                      <RowMenu items={rowMenu(r)} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge label={r.role} tone={r.role === "Super Admin" ? "purple" : r.role === "Administrator" ? "blue" : "gray"} />
                      <Badge label={r.status} />
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--theme-text-faint)]">Last login {r.lastLogin}</p>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && <EmptyState Icon={Search} title="No users found" message="Adjust the filters or add a new user account." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add User</Btn>} />}
              <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
            </>
          )}
        </Card>
      </div>

      <UserForm modal={modal} onClose={() => setModal(null)} isSubmitting={isSubmitting} onSave={handleSaveUser} />

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

function UserForm({ modal, onClose, onSave, isSubmitting }: { modal: { mode: "add" | "edit"; row?: UserRow } | null; onClose: () => void; onSave: (data: { name: string; email: string; role: UserRow["role"]; status: UserRow["status"]; password?: string }) => void; isSubmitting: boolean }) {
  const blank = { name: "", email: "", role: "Teacher" as UserRow["role"], status: "Active" as UserRow["status"], password: "" };
  const [form, setForm] = useState(modal?.row ? { name: modal.row.name, email: modal.row.email, role: modal.row.role, status: modal.row.status, password: "" } : blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(modal?.row ? { name: modal.row.name, email: modal.row.email, role: modal.row.role, status: modal.row.status, password: "" } : blank);
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      alert("Name and email are required.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit User" : "New User Account"} subtitle="Login credentials and role assignment"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={isSubmitting}>{modal?.mode === "edit" ? "Save Changes" : "Create User"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Email" className="sm:col-span-2"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
        <Field label="Role"><Select options={USER_ROLES} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRow["role"] }))} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserRow["status"] }))} /></Field>
        {modal?.mode === "add" && (
          <Field label="Password" className="sm:col-span-2"><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Set initial password (default: Password123)" /></Field>
        )}
      </div>
    </Modal>
  );
}
