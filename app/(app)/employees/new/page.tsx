"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, CheckCircle2, User, Briefcase, FileText, Plus, Trash2, ImagePlus } from "lucide-react";
import { Avatar, Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, type IconType } from "@/components/ui";
import { DESIGNATIONS, DEPARTMENTS, EMPLOYMENT_TYPES, GENDERS } from "@/lib/mock-data";
import { employeesApi, describeApiError, type EmployeeDocItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const DOC_TYPES = ["CNIC / National ID", "Degree / Certificate", "Employment Contract", "Experience Letter", "Other"];

export default function AddEmployeePage() {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [f, setF] = useState({
    name: "", gender: "Male", dob: "", cnic: "", phone: "", email: "", address: "", photo: "",
    employeeId: `EMP-${String(Date.now()).slice(-4)}`, designation: DESIGNATIONS[0], department: DEPARTMENTS[0],
    joining: new Date().toISOString().slice(0, 10), type: "Permanent", status: "Active",
  });

  const [documents, setDocuments] = useState<Array<{ name: string; type: string; url?: string }>>([
    { name: "CNIC Card Copy", type: "CNIC / National ID" },
  ]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState(DOC_TYPES[0]);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  const addDocument = () => {
    if (!newDocName.trim()) return;
    setDocuments((prev) => [...prev, { name: newDocName.trim(), type: newDocType }]);
    setNewDocName("");
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!f.name.trim()) {
      alert("Employee full name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const docPayload: EmployeeDocItem[] = documents.map((d, i) => ({
        id: `DOC-${Date.now()}-${i}`,
        name: d.name,
        type: d.type,
        url: d.url || "",
        uploadDate: new Date().toISOString().slice(0, 10),
      }));

      await employeesApi.create({
        name: f.name,
        gender: f.gender,
        dob: f.dob,
        cnic: f.cnic,
        phone: f.phone,
        email: f.email,
        address: f.address,
        photo: f.photo,
        employeeId: f.employeeId,
        designation: f.designation,
        department: f.department,
        joining: f.joining,
        type: f.type,
        status: f.status,
        documents: docPayload,
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });

      setDone(true);
    } catch (err) {
      const { message } = describeApiError(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const back = (
    <Link href="/employees" className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]" aria-label="Back">
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );

  return (
    <>
      <PageHeader title="Add New Employee" subtitle="Register a new staff member with personal, employment, and attached document details." back={back}
        actions={<Btn variant="primary" Icon={Save} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {error && (
            <div className="rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
              {error}
            </div>
          )}

          <Section icon={User} title="Personal Details" subtitle="Identity and contact of the employee">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name *" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Employee full name" /></Field>
              <Field label="Gender"><Select options={GENDERS} value={f.gender} onChange={(e) => set({ gender: e.target.value })} /></Field>
              <Field label="Date of Birth"><Input type="date" value={f.dob} onChange={(e) => set({ dob: e.target.value })} /></Field>
              <Field label="CNIC / National ID"><Input value={f.cnic} onChange={(e) => set({ cnic: e.target.value })} placeholder="35202-XXXXXXX-X" /></Field>
              <Field label="Phone"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Email" className="sm:col-span-2"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="employee@bisons.edu" /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, street, area, city" /></Field>
              <Field label="Photo" className="sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Avatar name={f.name || "New Employee"} size={44} />
                  <label className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-[var(--theme-border-strong)] px-3 text-[13px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]">
                    <ImagePlus className="h-4 w-4" /> {f.photo ? f.photo : "Upload photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => set({ photo: e.target.files?.[0]?.name ?? "" })} />
                  </label>
                </div>
              </Field>
            </div>
          </Section>

          <Section icon={Briefcase} title="Employment Details" subtitle="Role, department and joining details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee ID"><Input value={f.employeeId} onChange={(e) => set({ employeeId: e.target.value })} placeholder="EMP-XXX" /></Field>
              <Field label="Designation"><Select options={DESIGNATIONS} value={f.designation} onChange={(e) => set({ designation: e.target.value })} /></Field>
              <Field label="Department"><Select options={DEPARTMENTS} value={f.department} onChange={(e) => set({ department: e.target.value })} /></Field>
              <Field label="Joining Date"><Input type="date" value={f.joining} onChange={(e) => set({ joining: e.target.value })} /></Field>
              <Field label="Employment Type"><Select options={EMPLOYMENT_TYPES} value={f.type} onChange={(e) => set({ type: e.target.value })} /></Field>
              <Field label="Status"><Select options={["Active", "Inactive"]} value={f.status} onChange={(e) => set({ status: e.target.value })} /></Field>
            </div>
          </Section>

          <Section icon={FileText} title="Employee Documents" subtitle="Attach degrees, certificates, CNIC copies, and employment contract">
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
                <Field label="Document Name" className="flex-1 min-w-[180px]">
                  <Input value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="e.g. Master Degree Certificate" />
                </Field>
                <Field label="Type" className="w-48">
                  <Select options={DOC_TYPES} value={newDocType} onChange={(e) => setNewDocType(e.target.value)} />
                </Field>
                <Btn type="button" variant="secondary" Icon={Plus} onClick={addDocument}>Add Document</Btn>
              </div>

              {documents.length === 0 ? (
                <p className="text-[13px] text-[var(--theme-text-muted)] italic">No documents attached yet.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)] rounded-lg border border-[var(--theme-border)]">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-[14px]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-[12px] text-[var(--theme-text-muted)]">{doc.type}</p>
                        </div>
                      </div>
                      <Btn size="sm" variant="ghost" Icon={Trash2} onClick={() => removeDocument(idx)} className="text-[var(--theme-danger)]">Remove</Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Employee summary" Icon={User} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-4">
              <Avatar name={f.name || "New Employee"} size={64} />
              <p className="text-[16px] font-semibold">{f.name || "New Employee"}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">{f.designation} · {f.department}</p>
            </div>
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Employee ID" value={f.employeeId || "—"} />
              <Row label="Type" value={f.type} />
              <Row label="Joining" value={f.joining || "—"} />
              <Row label="Phone" value={f.phone || "—"} />
              <Row label="Documents" value={`${documents.length} attached`} />
              <Row label="Status" value={f.status} />
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Employee"}</Btn>
            <Btn variant="secondary" onClick={() => router.push("/employees")}>Cancel</Btn>
          </div>
        </div>
      </div>

      <Modal open={done} onClose={() => { setDone(false); router.push("/employees"); }} title="Employee added" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => { setDone(false); router.push("/employees"); }}>View All Employees</Btn>
          <Btn variant="primary" onClick={() => {
            setDone(false);
            setF({
              name: "", gender: "Male", dob: "", cnic: "", phone: "", email: "", address: "", photo: "",
              employeeId: `EMP-${String(Date.now()).slice(-4)}`, designation: DESIGNATIONS[0], department: DEPARTMENTS[0],
              joining: new Date().toISOString().slice(0, 10), type: "Permanent", status: "Active",
            });
            setDocuments([]);
          }}>Add Another</Btn></>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">{f.name || "New employee"} has been saved to database.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">{f.designation} · {f.department} · {documents.length} document(s)</p>
        </div>
      </Modal>
    </>
  );
}

function Section({ icon, title, subtitle, children }: { icon: IconType; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card pad={false}>
      <CardHead title={title} subtitle={subtitle} Icon={icon} />
      <div className="p-4">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--theme-text-muted)]">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
