"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, ArrowUpDown, Eye, Pencil, Trash2, Briefcase, UserPlus, FileSignature } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, Th, Td, cn,
} from "@/components/ui";
import { EMPLOYEE_ROWS, DESIGNATIONS, DEPARTMENTS, type EmployeeRow } from "@/lib/mock-data";

const COLS = "grid-cols-[110px_minmax(160px,1.3fr)_130px_120px_120px_minmax(170px,1.2fr)_110px_100px_64px]";
const STEPS = 8;

export default function AllEmployeesPage() {
  const [rows, setRows] = useState<EmployeeRow[]>(EMPLOYEE_ROWS);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<EmployeeRow | null>(null);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [toDelete, setToDelete] = useState<EmployeeRow | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()) || r.designation.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (dept ? r.department === dept : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))),
  [rows, q, dept, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const rowMenu = (r: EmployeeRow) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setEditing(r) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="All Employees" subtitle="Directory of teaching and non-teaching staff."
        actions={
          <>
            <Link href="/employees/job-letters" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] lg:inline-flex"><FileSignature className="h-[18px] w-[18px]" /> Job Letters</Link>
            <Link href="/employees/new" className="inline-flex items-center gap-2 rounded bg-[#2563EB] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[#1D4ED8]"><UserPlus className="h-[18px] w-[18px]" /> Add Employee</Link>
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, ID or designation" className="w-full sm:w-72" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} options={DEPARTMENTS} placeholder="All Departments" className="w-44" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-32" />
            <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
            <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">More Filters</Btn>
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
              <Th className="border-l border-[#E6E9EF]">Employee ID</Th>
              <Th className="border-l border-[#E6E9EF]">Employee</Th>
              <Th className="border-l border-[#E6E9EF]">Designation</Th>
              <Th className="border-l border-[#E6E9EF]">Department</Th>
              <Th className="border-l border-[#E6E9EF]">Phone</Th>
              <Th className="border-l border-[#E6E9EF]">Email</Th>
              <Th className="border-l border-[#E6E9EF]">Joining</Th>
              <Th className="border-l border-[#E6E9EF]">Status</Th>
              <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                <Td className="border-l border-[#E6E9EF] font-mono text-[13px] text-[#676879]">{r.id}</Td>
                <Td className="border-l border-[#E6E9EF]">
                  <div className="flex min-w-0 items-center gap-2.5"><Avatar name={r.name} /><span className="truncate font-medium">{r.name}</span></div>
                </Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="truncate">{r.designation}</span></Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.department} tone="purple" /></Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.phone}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="truncate">{r.email}</span></Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.joining}</Td>
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
                    <p className="text-[13px] text-[#676879]">{r.designation} · {r.department}</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <Info label="ID" value={r.id} />
                  <Info label="Phone" value={r.phone} />
                  <Info label="Email" value={r.email} />
                  <Info label="Joining" value={r.joining} />
                </div>
                <div className="mt-3"><Badge label={r.status} /></div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={Briefcase} title="No employees found" message="Adjust the filters or add a new employee." />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} subtitle={view?.designation} width="max-w-xl"
        footer={<><Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
          <Btn variant="primary" Icon={Pencil} onClick={() => { setEditing(view); setView(null); }}>Edit</Btn></>}>
        {view && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-[#F6F7FB] p-4">
              <Avatar name={view.name} size={56} />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold">{view.name}</p>
                <p className="text-[13px] text-[#676879]">{view.designation} · {view.department}</p>
                <div className="mt-1"><Badge label={view.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Employee ID" value={view.id} />
              <Info label="Joining Date" value={view.joining} />
              <Info label="Phone" value={view.phone} />
              <Info label="Email" value={view.email} />
            </div>
          </div>
        )}
      </Modal>

      <EditEmployeeForm employee={editing} onClose={() => setEditing(null)}
        onSave={(e) => { setRows((p) => p.map((r) => (r.id === e.id ? e : r))); setEditing(null); }} />

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete employee" confirmLabel="Delete" message={`Remove ${toDelete?.name} from the employee directory?`} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#E6E9EF] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#9699A6]">{label}</p>
      <p className="truncate text-[14px] font-medium">{value}</p>
    </div>
  );
}

function EditEmployeeForm({ employee, onClose, onSave }: { employee: EmployeeRow | null; onClose: () => void; onSave: (e: EmployeeRow) => void }) {
  const blank: EmployeeRow = { id: "", name: "", designation: DESIGNATIONS[0], department: DEPARTMENTS[0], phone: "", email: "", joining: "", status: "Active" };
  const [form, setForm] = useState<EmployeeRow>(employee ?? blank);
  const [lastId, setLastId] = useState(employee?.id ?? "");
  if ((employee?.id ?? "") !== lastId) { setLastId(employee?.id ?? ""); setForm(employee ?? blank); }
  const set = (patch: Partial<EmployeeRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!employee} onClose={onClose} width="max-w-xl" title="Edit Employee" subtitle={employee?.id}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => onSave(form)}>Save Changes</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Designation"><Select options={DESIGNATIONS} value={form.designation} onChange={(e) => set({ designation: e.target.value })} /></Field>
        <Field label="Department"><Select options={DEPARTMENTS} value={form.department} onChange={(e) => set({ department: e.target.value })} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Joining Date"><Input type="date" value={form.joining} onChange={(e) => set({ joining: e.target.value })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as EmployeeRow["status"] })} /></Field>
      </div>
    </Modal>
  );
}
