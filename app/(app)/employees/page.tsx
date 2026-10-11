"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, Briefcase, Plus, ArrowUpDown, Layers, Filter, FileSignature, FileText, Upload } from "lucide-react";
import {
  Avatar, Btn, ConfirmDialog, EmptyState, Field, Input, Modal, RowMenu, Select, Td, Th,
} from "@/components/ui";
import { Board, BoardBar, BoardBody, BoardHead, GroupHead, GroupTable, BarCell } from "@/components/board";
import {
  ColumnsDropdown, BoardToolbarBar, BoardInlineSearch, StatusPill, ToolDropdown, ViewTabs, statusColor,
  type BoardView,
} from "@/components/board-kit";
import { CalendarBoard, KanbanBoard, MobileItem } from "@/components/board-views";
import { TablePageSkeleton } from "@/components/skeleton";
import { DESIGNATIONS, DEPARTMENTS, EMPLOYMENT_TYPES, type EmployeeRow } from "@/lib/mock-data";
import { useBranch } from "@/lib/branch-context";
import { employeesApi, describeApiError, uploadsApi, type EmployeeItem, type EmployeeDocItem } from "@/lib/auth/api-client";

export type ExtendedEmployeeRow = EmployeeRow & {
  employeeId?: string;
  gender?: string;
  dob?: string;
  cnic?: string;
  address?: string;
  type?: string;
  photo?: string;
  documents?: EmployeeDocItem[];
};

const COL_META: { key: string; label: string; width: string }[] = [
  { key: "id", label: "Employee ID", width: "120px" },
  { key: "department", label: "Department", width: "140px" },
  { key: "designation", label: "Designation", width: "140px" },
  { key: "phone", label: "Phone", width: "140px" },
  { key: "email", label: "Email", width: "minmax(180px,1fr)" },
  { key: "status", label: "Status", width: "130px" },
  { key: "joining", label: "Joining Date", width: "140px" },
];
const PALETTE = ["var(--theme-primary)", "var(--theme-accent)", "var(--theme-success)", "var(--theme-warning)", "var(--theme-danger)", "var(--theme-info)", "var(--theme-accent-2)", "var(--theme-success-text)"];
const SORTS = ["Name", "Employee ID", "Department", "Joining Date"] as const;
const GROUP_BY = ["Department", "Status", "Designation"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }, { key: "calendar", label: "Calendar" }] as const;

type SortLabel = (typeof SORTS)[number];
type GroupLabel = (typeof GROUP_BY)[number];

export default function AllEmployeesPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<ExtendedEmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<SortLabel>("Name");
  const [sortAsc, setSortAsc] = useState(true);
  const [group, setGroup] = useState<GroupLabel>("Department");
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<BoardView>("table");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [detail, setDetail] = useState<ExtendedEmployeeRow | null>(null);
  const [editing, setEditing] = useState<ExtendedEmployeeRow | null>(null);
  const [toDelete, setToDelete] = useState<ExtendedEmployeeRow | null>(null);

  // New doc form inside detail modal
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("CNIC / National ID");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [addingDoc, setAddingDoc] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeesApi.list({
        q,
        dept,
        designation,
        status,
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });

      const items: ExtendedEmployeeRow[] = res.employees.map((e) => ({
        id: e.employeeId || e.id,
        name: e.name,
        designation: e.designation,
        department: e.department,
        phone: e.phone || "—",
        email: e.email || "—",
        joining: e.joining,
        status: (e.status as EmployeeRow["status"]) || "Active",
        employeeId: e.employeeId,
        gender: e.gender,
        dob: e.dob,
        cnic: e.cnic,
        address: e.address,
        type: e.type,
        photo: e.photo || "",
        documents: e.documents || [],
      }));

      setRows(items);
    } catch (err) {
      const { message } = describeApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [q, dept, designation, status, currentBranchId]);

  const filtered = useMemo(() => rows
    .sort((a, b) => {
      const key = sort === "Name" ? "name" : sort === "Employee ID" ? "id" : sort === "Department" ? "department" : "joining";
      const c = String(a[key as keyof ExtendedEmployeeRow] || "").localeCompare(String(b[key as keyof ExtendedEmployeeRow] || ""));
      return sortAsc ? c : -c;
    }), [rows, sort, sortAsc]);

  const groups = useMemo(() => {
    const map = new Map<string, ExtendedEmployeeRow[]>();
    for (const r of filtered) {
      const k = group === "Status" ? r.status : group === "Department" ? r.department : r.designation;
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return [...map.keys()].sort().map((k, i) => ({
      key: k, label: k, items: map.get(k)!,
      color: group === "Status" ? statusColor(k) : PALETTE[i % PALETTE.length],
    }));
  }, [filtered, group]);

  const visibleCols = COL_META.filter((c) => !hidden.includes(c.key));
  const tmpl = `44px minmax(180px,1.3fr) ${visibleCols.map((c) => c.width).join(" ")} 64px`;
  const latestMonth = useMemo(() => filtered.map((r) => r.joining).filter(Boolean).sort().slice(-1)[0]?.slice(0, 7), [filtered]);

  const handleDeleteEmployee = async () => {
    if (!toDelete) return;
    try {
      await employeesApi.delete(toDelete.id);
      setRows((p) => p.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const handleSaveEdit = async (data: ExtendedEmployeeRow) => {
    try {
      const res = await employeesApi.update(data.id, {
        name: data.name,
        designation: data.designation,
        department: data.department,
        phone: data.phone,
        email: data.email,
        joining: data.joining,
        status: data.status,
      });

      setRows((p) => p.map((r) => (r.id === data.id ? {
        ...r,
        name: res.employee.name,
        designation: res.employee.designation,
        department: res.employee.department,
        phone: res.employee.phone || "—",
        email: res.employee.email || "—",
        joining: res.employee.joining,
        status: (res.employee.status as EmployeeRow["status"]) || "Active",
      } : r)));
      setEditing(null);
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  const handleAddDocumentToDetail = async (file?: File | null) => {
    if (!detail || !docName.trim()) return;
    if (!file) {
      alert("Choose a file to upload to Cloudinary.");
      return;
    }
    setAddingDoc(true);
    try {
      const uploaded = await uploadsApi.upload(file, { purpose: "employee-doc", folder: "employees/docs" });
      const res = await employeesApi.addDocument(detail.id, {
        name: docName.trim() || uploaded.upload.name,
        type: docType,
        url: uploaded.upload.url,
      });
      const updatedDocs = res.employee.documents;
      setDetail((prev) => prev ? { ...prev, documents: updatedDocs } : null);
      setRows((p) => p.map((r) => (r.id === detail.id ? { ...r, documents: updatedDocs } : r)));
      setDocName("");
      setDocFile(null);
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setAddingDoc(false);
    }
  };

  const rowMenu = (r: ExtendedEmployeeRow) => [
    { label: "View", Icon: Eye, onClick: () => setDetail(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setEditing(r) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  if (loading) return <TablePageSkeleton rows={5} cols={6} />;

  return (
    <Board>
      <BoardBar>
        <BoardHead
          title="All Employees"
          subtitle="Directory of teaching and non-teaching staff connected to backend API."
          Icon={Briefcase}
          actions={
            <>
              <Link href="/employees/job-letters" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex">
                <FileSignature className="h-[18px] w-[18px]" /> Job Letters
              </Link>
              <Link href="/employees/new" className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
                <Plus className="ic-plus h-[18px] w-[18px]" /> New Employee
              </Link>
            </>
          }
        />
        <ViewTabs views={VIEWS} value={view} onChange={setView} />
        <BoardToolbarBar>
          <Link href="/employees/new" className="ic-plus-btn mr-1 inline-flex h-9 shrink-0 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
            <Plus className="ic-plus h-[18px] w-[18px]" /><span className="hidden sm:inline">New item</span>
          </Link>
          <BoardInlineSearch value={q} onChange={setQ} placeholder="Search employees" />
          <ToolDropdown Icon={Filter} label="Department" options={DEPARTMENTS} value={dept} onChange={setDept} allLabel="All Departments" />
          <ToolDropdown Icon={Filter} label="Designation" options={DESIGNATIONS} value={designation} onChange={setDesignation} allLabel="All Designations" />
          <ToolDropdown Icon={ArrowUpDown} label="Sort" options={SORTS} value={sort} onChange={(v) => { setSort((v || "Name") as SortLabel); setSortAsc(true); }} allLabel="Name" />
          <ColumnsDropdown columns={COL_META} hidden={hidden} onToggle={(k) => setHidden((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />
          <ToolDropdown Icon={Layers} label="Group by" options={GROUP_BY} value={group} onChange={(v) => setGroup((v || "Department") as GroupLabel)} allLabel="Department" />
          <ToolDropdown Icon={Filter} label="Status" options={["Active", "Inactive"]} value={status} onChange={setStatus} allLabel="All Status" />
        </BoardToolbarBar>
      </BoardBar>

      <BoardBody>
        {error && (
          <div className="m-4 rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        {view === "table" && (
          groups.length === 0 ? (
            <EmptyState Icon={Briefcase} title="No employees found" message="Adjust the filters or add a new employee." />
          ) : (
            <div className="space-y-8 md:min-w-[1040px]">
              {groups.map((g) => {
                const open = !collapsed[g.key];
                return (
                  <section key={g.key}>
                    <GroupHead title={g.label} color={g.color} count={g.items.length} open={open}
                      onToggle={() => setCollapsed((p) => ({ ...p, [g.key]: open }))} />
                    {open && (
                      <>
                        <div className="hidden md:block">
                          <GroupTable>
                            <div className="grid border-b border-[var(--theme-border)] bg-[var(--theme-surface)]" style={{ gridTemplateColumns: tmpl }}>
                              <BarCell color={g.color} />
                              <Th>Employee</Th>
                              {visibleCols.map((c) => <Th key={c.key} className="border-l border-[var(--theme-border)]">{c.label}</Th>)}
                              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                            </div>
                            {g.items.map((r) => (
                              <div key={r.id} onClick={() => setDetail(r)}
                                className="row grid cursor-pointer border-b border-[var(--theme-border)] text-[15px] transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]"
                                style={{ gridTemplateColumns: tmpl }}>
                                <BarCell color={g.color} className="py-2.5"><Avatar name={r.name} src={r.photo} size={30} /></BarCell>
                                <Td className="min-w-0"><span className="truncate font-medium">{r.name}</span></Td>
                                {visibleCols.map((c) => (
                                  <Td key={c.key} className="min-w-0 border-l border-[var(--theme-border)]">
                                    {c.key === "status"
                                      ? <StatusPill label={r.status} />
                                      : <span className="truncate text-[var(--theme-text-muted)]">{String(r[c.key as keyof ExtendedEmployeeRow] || "")}</span>}
                                  </Td>
                                ))}
                                <Td className="justify-center border-l border-[var(--theme-border)]">
                                  <span onClick={(e) => e.stopPropagation()}><RowMenu items={rowMenu(r)} /></span>
                                </Td>
                              </div>
                            ))}
                          </GroupTable>
                        </div>
                        <div className="space-y-3 md:hidden">
                          {g.items.map((r) => (
                            <MobileItem key={r.id} name={r.name} subtitle={`${r.id} · ${r.designation}`}
                              actions={<RowMenu items={rowMenu(r)} />}
                              rows={[
                                { label: "Status", value: <StatusPill label={r.status} /> },
                                { label: "Department", value: r.department },
                                { label: "Phone", value: r.phone },
                                { label: "Joining", value: r.joining },
                              ]} />
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                );
              })}
            </div>
          )
        )}

        {view === "kanban" && (
          <KanbanBoard
            columns={groups.map((g) => ({ key: g.key, label: g.label, color: g.color, items: g.items }))}
            keyOf={(r) => r.id}
            renderCard={(r) => (
              <button type="button" onClick={() => setDetail(r)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left shadow-sm transition-colors hover:bg-[var(--theme-hover)]">
                <span className="flex items-start gap-2">
                  <Avatar name={r.name} src={r.photo} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{r.name}</span>
                    <span className="block truncate text-[12px] text-[var(--theme-text-muted)]">{r.designation} · {r.id}</span>
                  </span>
                </span>
                <span className="mt-2 flex items-center gap-2">
                  <StatusPill label={r.status} />
                  <span className="truncate text-[12px] text-[var(--theme-text-faint)]">{r.department}</span>
                </span>
              </button>
            )}
          />
        )}

        {view === "calendar" && (
          <CalendarBoard items={filtered} getDate={(r) => r.joining} initialMonth={latestMonth}
            renderChip={(r) => (
              <button type="button" onClick={() => setDetail(r)} title={`${r.name} · ${r.designation}`}
                className="flex w-full items-center gap-1.5 rounded bg-[var(--theme-hover)] px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-[var(--theme-border)]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusColor(r.status) }} />
                <span className="truncate">{r.name}</span>
              </button>
            )}
          />
        )}
      </BoardBody>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""} subtitle="Employee details and documents" width="max-w-xl"
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.name} src={detail.photo} size={52} />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold">{detail.name}</p>
                <p className="truncate text-[13px] text-[var(--theme-text-muted)]">{detail.designation} · {detail.department}</p>
                <div className="mt-1"><StatusPill label={detail.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Employee ID" value={detail.id} />
              <Info label="CNIC / ID" value={detail.cnic || "—"} />
              <Info label="Joining Date" value={detail.joining} />
              <Info label="Employment Type" value={detail.type || "Permanent"} />
              <Info label="Department" value={detail.department} />
              <Info label="Designation" value={detail.designation} />
              <Info label="Phone" value={detail.phone} />
              <Info label="Email" value={detail.email} />
            </div>

            <div className="border-t border-[var(--theme-border)] pt-3">
              <p className="text-[14px] font-semibold mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[var(--theme-accent-strong)]" /> Attached Documents ({detail.documents?.length || 0})
              </p>

              {(!detail.documents || detail.documents.length === 0) ? (
                <p className="text-[13px] text-[var(--theme-text-muted)] italic">No documents attached.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded border border-[var(--theme-border)] p-2 text-[13px]">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-[11px] text-[var(--theme-text-muted)]">{doc.type} · {doc.uploadDate}</p>
                      </div>
                      {doc.url ? (
                        <a
                          href={uploadsApi.downloadHref({
                            url: doc.url,
                            filename: doc.name || "document",
                            resourceType: doc.url.includes("/raw/") ? "raw" : "image",
                          })}
                          className="shrink-0 text-[12px] font-medium text-[var(--theme-primary-soft-text)] hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-[12px] text-[var(--theme-text-muted)]">No file</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name..." className="min-w-[140px] flex-1 text-[13px]" />
                  <Select value={docType} onChange={(e) => setDocType(e.target.value)} options={["CNIC / National ID", "Degree / Certificate", "Employment Contract", "Experience Letter", "Other"]} className="w-40 text-[13px]" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex h-9 flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-[var(--theme-border-strong)] px-3 text-[12px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="truncate">{docFile ? docFile.name : "Choose file (Cloudinary)"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        e.target.value = "";
                        setDocFile(f);
                        if (f && !docName.trim()) setDocName(f.name);
                      }}
                    />
                  </label>
                  <Btn size="sm" variant="primary" Icon={Upload} onClick={() => handleAddDocumentToDetail(docFile)} disabled={addingDoc || !docFile}>
                    {addingDoc ? "..." : "Upload"}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <EditEmployeeForm employee={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={handleDeleteEmployee}
        title="Delete employee" confirmLabel="Delete" message={`Remove ${toDelete?.name} from the employee directory?`} />
    </Board>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="truncate text-[14px] font-medium">{value}</p>
    </div>
  );
}

function EditEmployeeForm({ employee, onClose, onSave }: { employee: ExtendedEmployeeRow | null; onClose: () => void; onSave: (e: ExtendedEmployeeRow) => void }) {
  const blank: ExtendedEmployeeRow = { id: "", name: "", designation: DESIGNATIONS[0], department: DEPARTMENTS[0], phone: "", email: "", joining: "", status: "Active" };
  const [form, setForm] = useState<ExtendedEmployeeRow>(employee ?? blank);
  const [lastId, setLastId] = useState(employee?.id ?? "");
  const [saving, setSaving] = useState(false);
  if ((employee?.id ?? "") !== lastId) { setLastId(employee?.id ?? ""); setForm(employee ?? blank); }
  const set = (patch: Partial<ExtendedEmployeeRow>) => setForm((f) => ({ ...f, ...patch }));
  const save = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <Modal open={!!employee} onClose={onClose} width="max-w-xl" title="Edit Employee" subtitle={employee?.id}
      footer={<><Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Saving…">Save Changes</Btn></>}>
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
