"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Users2, Phone, Mail, GraduationCap, Wallet, Filter, ReceiptText } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Td, Th, cn, rs,
} from "@/components/ui";
import { FAMILY_ROWS, type FamilyRow } from "@/lib/mock-data";

const COLS = "grid-cols-[100px_minmax(150px,1.2fr)_120px_minmax(160px,1.3fr)_minmax(170px,1.3fr)_90px_100px_64px]";
const STEPS = 6;

export default function ManageFamiliesPage() {
  const [rows, setRows] = useState<FamilyRow[]>(FAMILY_ROWS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<FamilyRow | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: FamilyRow } | null>(null);
  const [toDelete, setToDelete] = useState<FamilyRow | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.guardian.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()) || r.phone.includes(q))
    .filter((r) => (status ? r.status === status : true)),
  [rows, q, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const rowMenu = (r: FamilyRow) => [
    { label: "View Family", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="Manage Families" subtitle="Group students under a single guardian and track family fee summaries."
        actions={
          <>
            <Link href="/fees/invoices" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] sm:inline-flex">
              <ReceiptText className="h-[18px] w-[18px]" /> Fee Invoices
            </Link>
            <SplitButton label="Add Family" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search guardian, ID or phone" className="w-full sm:w-72" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
            <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">Filter</Btn>
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
              <Th className="border-l border-[#E6E9EF]">Family ID</Th>
              <Th className="border-l border-[#E6E9EF]">Guardian</Th>
              <Th className="border-l border-[#E6E9EF]">Phone</Th>
              <Th className="border-l border-[#E6E9EF]">Email</Th>
              <Th className="border-l border-[#E6E9EF]">Address</Th>
              <Th className="border-l border-[#E6E9EF]">Students</Th>
              <Th className="border-l border-[#E6E9EF]">Status</Th>
              <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                <Td className="border-l border-[#E6E9EF] font-mono text-[13px] text-[#676879]">{r.id}</Td>
                <Td className="border-l border-[#E6E9EF]">
                  <div className="flex min-w-0 items-center gap-2.5"><Avatar name={r.guardian} /><span className="truncate font-medium">{r.guardian}</span></div>
                </Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.phone}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="truncate">{r.email}</span></Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="truncate">{r.address}</span></Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={`${r.students} student${r.students > 1 ? "s" : ""}`} tone="purple" /></Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #A25DDC" }}>
                <div className="flex items-start gap-3">
                  <Avatar name={r.guardian} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{r.guardian}</p>
                    <p className="text-[12px] text-[#9699A6]">{r.id} · {r.students} students</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 space-y-1 text-[13px] text-[#676879]">
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {r.phone}</p>
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.email}</span></p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge label={r.status} />
                  <Badge label={`Balance ${rs(r.balance)}`} tone={r.balance > 0 ? "red" : "green"} />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={Users2} title="No families found" message="Adjust the search or add a new family." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Family</Btn>} />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.guardian ?? ""} subtitle={view?.id} width="max-w-2xl"
        footer={<><Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
          <Btn variant="primary" Icon={Pencil} onClick={() => { setModal({ mode: "edit", row: view ?? undefined }); setView(null); }}>Edit</Btn></>}>
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E6E9EF] p-3">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#9699A6]">Guardian information</p>
                <div className="flex items-center gap-3"><Avatar name={view.guardian} size={40} /><div><p className="font-medium">{view.guardian}</p><Badge label={view.status} /></div></div>
              </div>
              <div className="rounded-lg border border-[#E6E9EF] p-3">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#9699A6]">Contact information</p>
                <p className="flex items-center gap-2 text-[13px] text-[#676879]"><Phone className="h-3.5 w-3.5" /> {view.phone}</p>
                <p className="mt-1 flex items-center gap-2 text-[13px] text-[#676879]"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{view.email}</span></p>
              </div>
            </div>

            <div className="rounded-lg border border-[#E6E9EF] p-3">
              <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#9699A6]"><GraduationCap className="h-4 w-4" /> Related students</p>
              <div className="space-y-2">
                {view.studentNames.map((n, i) => (
                  <div key={n} className="flex items-center gap-3 rounded-lg bg-[#F6F7FB] px-3 py-2">
                    <Avatar name={n} size={32} />
                    <span className="flex-1 truncate text-[14px] font-medium">{n}</span>
                    <Badge label={view.classList[i] ?? "—"} tone="blue" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E6E9EF] p-3">
              <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#9699A6]"><Wallet className="h-4 w-4" /> Fee summary</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-[#CCE5FF] p-3"><p className="text-[16px] font-bold text-[#0060B9]">{rs(view.billed)}</p><p className="text-[12px] text-[#0060B9]">Billed</p></div>
                <div className="rounded-lg bg-[#D6F5E3] p-3"><p className="text-[16px] font-bold text-[#037F4C]">{rs(view.paid)}</p><p className="text-[12px] text-[#037F4C]">Paid</p></div>
                <div className={cn("rounded-lg p-3", view.balance > 0 ? "bg-[#FDD9DF]" : "bg-[#D6F5E3]")}>
                  <p className={cn("text-[16px] font-bold", view.balance > 0 ? "text-[#C0233B]" : "text-[#037F4C]")}>{rs(view.balance)}</p>
                  <p className={cn("text-[12px]", view.balance > 0 ? "text-[#C0233B]" : "text-[#037F4C]")}>Balance</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-[#F6F7FB] p-3 text-[13px] text-[#676879]">
              <span className="font-medium text-[#323338]">Address:</span> {view.address}
            </div>
          </div>
        )}
      </Modal>

      <FamilyForm modal={modal} onClose={() => setModal(null)}
        onSave={(row) => { setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p])); setModal(null); }} />

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete family" confirmLabel="Delete" message={`Remove the family record for ${toDelete?.guardian}? Students will remain in the directory.`} />
    </>
  );
}

function FamilyForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: FamilyRow } | null; onClose: () => void; onSave: (r: FamilyRow) => void }) {
  const blank: FamilyRow = { id: "", guardian: "", phone: "", email: "", address: "", students: 1, status: "Active", studentNames: [], classList: [], billed: 0, paid: 0, balance: 0 };
  const [form, setForm] = useState<FamilyRow>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<FamilyRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Family" : "New Family"} subtitle="Guardian details and contact information"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave({ ...form, id: form.id || `FAM-${String(Date.now()).slice(-3)}` })}>{modal?.mode === "edit" ? "Save Changes" : "Create Family"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Guardian Name" className="sm:col-span-2"><Input value={form.guardian} onChange={(e) => set({ guardian: e.target.value })} placeholder="Full name" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <Field label="Number of Students"><Input type="number" value={form.students} onChange={(e) => set({ students: Number(e.target.value) })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as FamilyRow["status"] })} /></Field>
      </div>
    </Modal>
  );
}

