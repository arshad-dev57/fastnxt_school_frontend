"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, KeyRound, UserCheck, UserX, Trash2, Search, ShieldCheck } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Th, Td, cn,
} from "@/components/ui";
import { USER_ROWS, USER_ROLES, type UserRow } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(170px,1.4fr)_minmax(200px,1.6fr)_130px_150px_100px_64px]";
const STEPS = 6;

export default function ManageLoginPage() {
  const [rows, setRows] = useState<UserRow[]>(USER_ROWS);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: UserRow } | null>(null);
  const [reset, setReset] = useState<UserRow | null>(null);
  const [sent, setSent] = useState(false);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (role ? r.role === role : true))
    .filter((r) => (status ? r.status === status : true)),
  [rows, q, role, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const toggleStatus = (id: string) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r)));

  const rowMenu = (r: UserRow) => [
    { label: "Edit User", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Reset Password", Icon: KeyRound, onClick: () => setReset(r) },
    { label: r.status === "Active" ? "Deactivate" : "Activate", Icon: r.status === "Active" ? UserX : UserCheck, onClick: () => toggleStatus(r.id) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="Manage Login / Accounts" subtitle="Create user accounts and control access to the system."
        actions={
          <>
            <Link href="/users/roles" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] sm:inline-flex">
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
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
              <Th className="border-l border-[#E6E9EF]">User</Th>
              <Th className="border-l border-[#E6E9EF]">Email</Th>
              <Th className="border-l border-[#E6E9EF]">Role</Th>
              <Th className="border-l border-[#E6E9EF]">Last Login</Th>
              <Th className="border-l border-[#E6E9EF]">Status</Th>
              <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                <Td className="border-l border-[#E6E9EF]">
                  <div className="flex min-w-0 items-center gap-2.5"><Avatar name={r.name} /><span className="truncate font-medium">{r.name}</span></div>
                </Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="truncate">{r.email}</span></Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.role} tone={r.role === "Super Admin" ? "purple" : r.role === "Administrator" ? "blue" : "gray"} /></Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.lastLogin}</Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #6C47FF" }}>
                <div className="flex items-start gap-3">
                  <Avatar name={r.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{r.name}</p>
                    <p className="truncate text-[12px] text-[#9699A6]">{r.email}</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge label={r.role} tone={r.role === "Super Admin" ? "purple" : r.role === "Administrator" ? "blue" : "gray"} />
                  <Badge label={r.status} />
                </div>
                <p className="mt-2 text-[12px] text-[#9699A6]">Last login {r.lastLogin}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={Search} title="No users found" message="Adjust the filters or add a new user account." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add User</Btn>} />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <UserForm modal={modal} onClose={() => setModal(null)}
        onSave={(row) => { setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p])); setModal(null); }} />

      <Modal open={!!reset} onClose={() => { setReset(null); setSent(false); }} title="Reset Password" subtitle={reset?.name} width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => { setReset(null); setSent(false); }}>Cancel</Btn>
          <Btn variant="primary" Icon={KeyRound} onClick={() => setSent(true)}>Send Reset Link</Btn></>}>
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><UserCheck className="h-7 w-7" /></span>
            <p className="text-[15px] font-medium">Password reset link sent</p>
            <p className="text-[13px] text-[#676879]">A reset link has been emailed to {reset?.email}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed text-[#676879]">
              Send a password reset link to <span className="font-medium text-[#323338]">{reset?.email}</span>. The user will
              be prompted to set a new password.
            </p>
            <Field label="New Password (optional)"><Input type="text" placeholder="Leave blank for email link" /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete user account" confirmLabel="Delete" message={`Remove the login account for ${toDelete?.name}? They will lose access immediately.`} />
    </>
  );
}

function UserForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: UserRow } | null; onClose: () => void; onSave: (r: UserRow) => void }) {
  const blank: UserRow = { id: "", name: "", email: "", role: "Teacher", lastLogin: "—", status: "Active" };
  const [form, setForm] = useState<UserRow>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<UserRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit User" : "New User Account"} subtitle="Login credentials and role assignment"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave({ ...form, id: form.id || `USR-${String(Date.now()).slice(-3)}` })}>{modal?.mode === "edit" ? "Save Changes" : "Create User"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Email" className="sm:col-span-2"><Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Role"><Select options={USER_ROLES} value={form.role} onChange={(e) => set({ role: e.target.value as UserRow["role"] })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as UserRow["status"] })} /></Field>
        <Field label="Password" className="sm:col-span-2"><Input type="password" placeholder="Set an initial password" /></Field>
      </div>
    </Modal>
  );
}
