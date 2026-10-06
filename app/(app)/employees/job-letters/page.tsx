"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Eye, FileSignature, Briefcase, RefreshCw } from "lucide-react";
import {
  Badge, Btn, Card, EmptyState, Field, Modal, PageHeader, RowMenu, SearchBox, Select, Th, Td, cn,
} from "@/components/ui";
import { SCHOOL } from "@/lib/mock-data";
import { jobLettersApi, employeesApi, describeApiError, type JobLetterItem, type EmployeeItem } from "@/lib/auth/api-client";

const COLS = "grid-cols-[minmax(170px,1.3fr)_140px_140px_130px_120px_150px_64px]";

export default function JobLettersPage() {
  const [rows, setRows] = useState<JobLetterItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<JobLetterItem | null>(null);
  const [gen, setGen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchJobLetters = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jlRes, empRes] = await Promise.all([
        jobLettersApi.list({ q, status }),
        employeesApi.list(),
      ]);
      setRows(jlRes.jobLetters);
      setEmployees(empRes.employees);
    } catch (err) {
      const { message } = describeApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobLetters();
  }, [q, status]);

  const filtered = useMemo(() => rows, [rows]);

  const handleGenerate = async () => {
    if (!selectedEmpId) return;
    const emp = employees.find((e) => e.id === selectedEmpId || e.employeeId === selectedEmpId);
    if (!emp) return;

    setIsGenerating(true);
    try {
      const res = await jobLettersApi.create({
        employee: emp.name,
        designation: emp.designation,
        department: emp.department,
        date: new Date().toISOString().slice(0, 10),
        status: "Generated",
        employeeId: emp.employeeId || emp.id,
      });

      setRows((p) => [res.jobLetter, ...p]);
      setGen(false);
      setSelectedEmpId("");
      setPreview(res.jobLetter);
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPrinted = async (letterId: string) => {
    try {
      await jobLettersApi.updateStatus(letterId, "Printed");
      setRows((p) => p.map((x) => (x.id === letterId ? { ...x, status: "Printed" } : x)));
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  return (
    <>
      <div className="no-print">
        <PageHeader title="Job Letters" subtitle="Generate and print employment / appointment letters for staff."
          actions={
            <div className="flex gap-2">
              <Btn variant="secondary" Icon={RefreshCw} onClick={fetchJobLetters}>Refresh</Btn>
              <Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>
            </div>
          } />

        <div className="px-4 pb-24 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search employee or designation" className="w-full sm:w-72" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["Generated", "Pending", "Printed"]} placeholder="All Status" className="w-40" />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
              {error}
            </div>
          )}

          <Card pad={false}>
            {loading ? (
              <div className="p-8 text-center text-[var(--theme-text-muted)]">
                Loading job letters from backend...
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                    <Th className="border-l border-[var(--theme-border)]">Employee</Th>
                    <Th className="border-l border-[var(--theme-border)]">Designation</Th>
                    <Th className="border-l border-[var(--theme-border)]">Department</Th>
                    <Th className="border-l border-[var(--theme-border)]">Date</Th>
                    <Th className="border-l border-[var(--theme-border)]">Status</Th>
                    <Th className="border-l border-[var(--theme-border)]">Actions</Th>
                    <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Menu</span></Th>
                  </div>
                  {filtered.map((r) => (
                    <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                      <Td className="gap-2 border-l border-[var(--theme-border)] font-medium"><FileSignature className="h-4 w-4 text-[var(--theme-accent-strong)]" />{r.employee}</Td>
                      <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]"><span className="truncate">{r.designation}</span></Td>
                      <Td className="border-l border-[var(--theme-border)]"><Badge label={r.department} tone="purple" /></Td>
                      <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.date}</Td>
                      <Td className="border-l border-[var(--theme-border)]"><Badge label={r.status} /></Td>
                      <Td className="gap-2 border-l border-[var(--theme-border)]">
                        <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setPreview(r)}>Preview</Btn>
                        <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { setPreview(r); setTimeout(() => window.print(), 300); }}>Print</Btn>
                      </Td>
                      <Td className="justify-center border-l border-[var(--theme-border)]">
                        <RowMenu items={[
                          { label: "Preview", Icon: Eye, onClick: () => setPreview(r) },
                          { label: "Print", Icon: Printer, onClick: () => { setPreview(r); setTimeout(() => window.print(), 300); } },
                          { label: "Mark as Printed", Icon: Briefcase, onClick: () => handleMarkAsPrinted(r.id) },
                        ]} />
                      </Td>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 p-3 md:hidden">
                  {filtered.map((r) => (
                    <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-accent)" }}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{r.employee}</p>
                          <p className="text-[13px] text-[var(--theme-text-muted)]">{r.designation} · {r.department}</p>
                        </div>
                        <Badge label={r.status} />
                      </div>
                      <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">{r.date}</p>
                      <div className="mt-3 flex gap-2">
                        <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setPreview(r)}>Preview</Btn>
                        <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { setPreview(r); setTimeout(() => window.print(), 300); }}>Print</Btn>
                      </div>
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && <EmptyState Icon={FileSignature} title="No job letters" message="Generate an employment letter for a staff member." action={<Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>} />}
              </>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Job Letter Preview" subtitle={preview?.employee} width="max-w-3xl"
        footer={<><Btn variant="secondary" onClick={() => setPreview(null)}>Close</Btn>
          <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print Letter</Btn></>}>
        {preview && <JobLetterDoc letter={preview} />}
      </Modal>

      <Modal open={gen} onClose={() => setGen(false)} title="Generate Job Letter" subtitle="Select an employee from backend" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => setGen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleGenerate} disabled={!selectedEmpId || isGenerating}>{isGenerating ? "Generating..." : "Generate"}</Btn></>}>
        <Field label="Select Employee">
          <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} className="w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-[14px]">
            <option value="">-- Select Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.designation} · {e.department})</option>
            ))}
          </select>
        </Field>
        <p className="mt-3 text-[13px] text-[var(--theme-text-muted)]">The job letter will automatically extract designation, department and today&apos;s date from the employee&apos;s record.</p>
      </Modal>
    </>
  );
}

function JobLetterDoc({ letter }: { letter: JobLetterItem }) {
  return (
    <div className="print-area mx-auto max-w-[720px] bg-[var(--theme-surface)] p-6 text-[var(--theme-text)] sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b-2 border-[var(--theme-primary)] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-[22px] font-extrabold text-white">B</span>
          <div>
            <h1 className="text-[20px] font-bold leading-tight">{SCHOOL.name}</h1>
            <p className="text-[12px] text-[var(--theme-text-muted)]">{SCHOOL.address}</p>
            <p className="text-[12px] text-[var(--theme-text-muted)]">{SCHOOL.phone} · {SCHOOL.email}</p>
          </div>
        </div>
        <div className="hidden text-right text-[12px] text-[var(--theme-text-muted)] sm:block">
          <p>Ref</p>
          <p className="font-mono font-semibold text-[var(--theme-text)]">{letter.id}</p>
        </div>
      </div>

      <p className="mt-6 text-right text-[13px]"><span className="text-[var(--theme-text-muted)]">Date:</span> {letter.date}</p>
      <h2 className="mt-4 text-center text-[17px] font-bold underline">JOB OFFER / APPOINTMENT LETTER</h2>

      <p className="mt-6 text-[14px]">Dear <span className="font-semibold">{letter.employee}</span>,</p>
      <p className="mt-2 text-[14px] leading-relaxed">
        We are pleased to offer you the position of <span className="font-semibold">{letter.designation}</span> in the
        <span className="font-semibold"> {letter.department}</span> department at {SCHOOL.name}. Your appointment is
        effective from the date of joining mentioned in your employment record.
      </p>

      <ul className="mt-4 list-disc space-y-1 pl-6 text-[14px] leading-relaxed">
        <li>The position is offered subject to satisfactory completion of required formalities.</li>
        <li>You will be entitled to the salary and benefits as per school policy.</li>
        <li>Working hours and leave policy are governed by the institution&apos;s rules &amp; regulations.</li>
        <li>This letter is confidential and for your records only.</li>
      </ul>

      <p className="mt-4 text-[14px] leading-relaxed">
        We look forward to your valuable contribution to our institution. Please sign and return a copy of this letter
        as a token of your acceptance.
      </p>

      <p className="mt-6 text-[14px]">Sincerely,</p>
      <p className="mt-10 text-[14px] font-semibold">{SCHOOL.principal}</p>
      <p className="text-[13px] text-[var(--theme-text-muted)]">Principal, {SCHOOL.shortName}</p>

      <div className="mt-8 flex items-start justify-between gap-6 border-t border-dashed border-[var(--theme-border-strong)] pt-3 text-[12px] text-[var(--theme-text-faint)]">
        <span>Employee Signature: ______________________</span>
        <span>{SCHOOL.website}</span>
      </div>
    </div>
  );
}
