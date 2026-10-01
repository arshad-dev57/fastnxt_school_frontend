"use client";

import { useMemo, useState } from "react";
import { Plus, Printer, Eye, FileSignature, Briefcase } from "lucide-react";
import {
  Badge, Btn, Card, EmptyState, Field, Modal, PageHeader, RowMenu, SearchBox, Select, Th, Td, cn,
} from "@/components/ui";
import { JOB_LETTERS, EMPLOYEE_ROWS, SCHOOL, type JobLetter } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(170px,1.3fr)_140px_140px_130px_120px_150px_64px]";

export default function JobLettersPage() {
  const [rows, setRows] = useState<JobLetter[]>(JOB_LETTERS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<JobLetter | null>(null);
  const [gen, setGen] = useState(false);
  const [employee, setEmployee] = useState("");

  const filtered = useMemo(() => rows
    .filter((r) => r.employee.toLowerCase().includes(q.toLowerCase()) || r.designation.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true)),
  [rows, q, status]);

  const generate = () => {
    if (!employee) return;
    const e = EMPLOYEE_ROWS.find((x) => x.name === employee);
    if (!e) return;
    const letter: JobLetter = {
      id: `JL-${Date.now()}`, employee: e.name, designation: e.designation, department: e.department,
      date: new Date().toISOString().slice(0, 10), status: "Generated",
    };
    setRows((p) => [letter, ...p]); setGen(false); setEmployee(""); setPreview(letter);
  };

  return (
    <>
      <div className="no-print">
        <PageHeader title="Job Letters" subtitle="Generate and print employment / appointment letters for staff."
          actions={<Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>} />

        <div className="px-4 pb-24 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search employee or designation" className="w-full sm:w-72" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["Generated", "Pending", "Printed"]} placeholder="All Status" className="w-40" />
          </div>

          <Card pad={false}>
            <div className="hidden md:block">
              <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                <Th className="border-l border-[#E6E9EF]">Employee</Th>
                <Th className="border-l border-[#E6E9EF]">Designation</Th>
                <Th className="border-l border-[#E6E9EF]">Department</Th>
                <Th className="border-l border-[#E6E9EF]">Date</Th>
                <Th className="border-l border-[#E6E9EF]">Status</Th>
                <Th className="border-l border-[#E6E9EF]">Actions</Th>
                <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Menu</span></Th>
              </div>
              {filtered.map((r) => (
                <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                  <Td className="gap-2 border-l border-[#E6E9EF] font-medium"><FileSignature className="h-4 w-4 text-[#5A34D6]" />{r.employee}</Td>
                  <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="truncate">{r.designation}</span></Td>
                  <Td className="border-l border-[#E6E9EF]"><Badge label={r.department} tone="purple" /></Td>
                  <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.date}</Td>
                  <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                  <Td className="gap-2 border-l border-[#E6E9EF]">
                    <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setPreview(r)}>Preview</Btn>
                    <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { setPreview(r); setTimeout(() => window.print(), 300); }}>Print</Btn>
                  </Td>
                  <Td className="justify-center border-l border-[#E6E9EF]">
                    <RowMenu items={[
                      { label: "Preview", Icon: Eye, onClick: () => setPreview(r) },
                      { label: "Print", Icon: Printer, onClick: () => { setPreview(r); setTimeout(() => window.print(), 300); } },
                      { label: "Mark as Printed", Icon: Briefcase, onClick: () => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: "Printed" } : x))) },
                    ]} />
                  </Td>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #6C47FF" }}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{r.employee}</p>
                      <p className="text-[13px] text-[#676879]">{r.designation} · {r.department}</p>
                    </div>
                    <Badge label={r.status} />
                  </div>
                  <p className="mt-2 text-[13px] text-[#676879]">{r.date}</p>
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setPreview(r)}>Preview</Btn>
                    <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { setPreview(r); setTimeout(() => window.print(), 300); }}>Print</Btn>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && <EmptyState Icon={FileSignature} title="No job letters" message="Generate an employment letter for a staff member." action={<Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>} />}
          </Card>
        </div>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Job Letter Preview" subtitle={preview?.employee} width="max-w-3xl"
        footer={<><Btn variant="secondary" onClick={() => setPreview(null)}>Close</Btn>
          <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print Letter</Btn></>}>
        {preview && <JobLetterDoc letter={preview} />}
      </Modal>

      <Modal open={gen} onClose={() => setGen(false)} title="Generate Job Letter" subtitle="Select an employee" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => setGen(false)}>Cancel</Btn><Btn variant="primary" onClick={generate} disabled={!employee}>Generate</Btn></>}>
        <Field label="Employee">
          <Select value={employee} onChange={(e) => setEmployee(e.target.value)} options={EMPLOYEE_ROWS.map((e) => e.name)} placeholder="Select employee" />
        </Field>
        <p className="mt-3 text-[13px] text-[#676879]">The letter will use the selected employee&apos;s designation, department and today&apos;s date.</p>
      </Modal>
    </>
  );
}

function JobLetterDoc({ letter }: { letter: JobLetter }) {
  return (
    <div className="print-area mx-auto max-w-[720px] bg-white p-6 text-[#323338] sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b-2 border-[#2563EB] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#6C47FF] text-[22px] font-extrabold text-white">B</span>
          <div>
            <h1 className="text-[20px] font-bold leading-tight">{SCHOOL.name}</h1>
            <p className="text-[12px] text-[#676879]">{SCHOOL.address}</p>
            <p className="text-[12px] text-[#676879]">{SCHOOL.phone} · {SCHOOL.email}</p>
          </div>
        </div>
        <div className="hidden text-right text-[12px] text-[#676879] sm:block">
          <p>Ref</p>
          <p className="font-mono font-semibold text-[#323338]">{letter.id}</p>
        </div>
      </div>

      <p className="mt-6 text-right text-[13px]"><span className="text-[#676879]">Date:</span> {letter.date}</p>
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
      <p className="text-[13px] text-[#676879]">Principal, {SCHOOL.shortName}</p>

      <div className="mt-8 flex items-start justify-between gap-6 border-t border-dashed border-[#C5C7D0] pt-3 text-[12px] text-[#9699A6]">
        <span>Employee Signature: ______________________</span>
        <span>{SCHOOL.website}</span>
      </div>
    </div>
  );
}
