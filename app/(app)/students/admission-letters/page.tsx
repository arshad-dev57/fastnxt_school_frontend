"use client";

import { useMemo, useState } from "react";
import { Plus, Printer, Eye, FileText, Mail, Search } from "lucide-react";
import {
  Badge, Btn, Card, EmptyState, Field, Modal, PageHeader, RowMenu, SearchBox, Select, Th, Td, cn,
} from "@/components/ui";
import { ADMISSION_LETTERS, STUDENT_ROWS, SCHOOL, type AdmissionLetter } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(170px,1.3fr)_150px_120px_120px_120px_150px_64px]";

export default function AdmissionLettersPage() {
  const [rows, setRows] = useState<AdmissionLetter[]>(ADMISSION_LETTERS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<AdmissionLetter | null>(null);
  const [gen, setGen] = useState(false);
  const [student, setStudent] = useState("");

  const filtered = useMemo(() => rows
    .filter((r) => r.student.toLowerCase().includes(q.toLowerCase()) || r.admissionNo.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true)),
  [rows, q, status]);

  const doPrint = () => window.print();

  const generate = () => {
    if (!student) return;
    const s = STUDENT_ROWS.find((x) => x.name === student);
    if (!s) return;
    const letter: AdmissionLetter = {
      id: `AL-${Date.now()}`,
      student: s.name, admissionNo: `ADM-2026-${String(Date.now()).slice(-4)}`,
      cls: s.cls, section: s.section, date: new Date().toISOString().slice(0, 10), status: "Generated",
    };
    setRows((p) => [letter, ...p]);
    setGen(false); setStudent(""); setPreview(letter);
  };

  return (
    <>
      <div className="no-print">
        <PageHeader title="Admission Letters" subtitle="Generate, preview and print student admission letters."
          actions={<Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>} />

        <div className="px-4 pb-24 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search student or admission no" className="w-full sm:w-72" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["Generated", "Pending", "Printed"]} placeholder="All Status" className="w-40" />
          </div>

          <Card pad={false}>
            <div className="hidden md:block">
              <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                <Th className="border-l border-[#E6E9EF]">Student</Th>
                <Th className="border-l border-[#E6E9EF]">Admission No</Th>
                <Th className="border-l border-[#E6E9EF]">Class</Th>
                <Th className="border-l border-[#E6E9EF]">Section</Th>
                <Th className="border-l border-[#E6E9EF]">Date</Th>
                <Th className="border-l border-[#E6E9EF]">Status</Th>
                <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
              </div>
              {filtered.map((r) => (
                <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                  <Td className="gap-2 border-l border-[#E6E9EF] font-medium"><FileText className="h-4 w-4 text-[#5A34D6]" />{r.student}</Td>
                  <Td className="border-l border-[#E6E9EF] font-mono text-[13px] text-[#676879]">{r.admissionNo}</Td>
                  <Td className="border-l border-[#E6E9EF]">{r.cls}</Td>
                  <Td className="border-l border-[#E6E9EF]"><Badge label={r.section} tone="gray" /></Td>
                  <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.date}</Td>
                  <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                  <Td className="justify-center border-l border-[#E6E9EF]">
                    <RowMenu items={[
                      { label: "Preview", Icon: Eye, onClick: () => setPreview(r) },
                      { label: "Print", Icon: Printer, onClick: () => { setPreview(r); setTimeout(doPrint, 300); } },
                      { label: "Mark as Printed", Icon: Mail, onClick: () => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: "Printed" } : x))) },
                    ]} />
                  </Td>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #579BFC" }}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{r.student}</p>
                      <p className="font-mono text-[12px] text-[#9699A6]">{r.admissionNo}</p>
                    </div>
                    <Badge label={r.status} />
                  </div>
                  <p className="mt-2 text-[13px] text-[#676879]">{r.cls}-{r.section} · {r.date}</p>
                  <div className="mt-3 flex gap-2">
                    <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setPreview(r)}>Preview</Btn>
                    <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { setPreview(r); setTimeout(doPrint, 300); }}>Print</Btn>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && <EmptyState Icon={FileText} title="No admission letters" message="Generate a letter for a newly admitted student." action={<Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>} />}
          </Card>
        </div>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Admission Letter Preview" subtitle={preview?.admissionNo} width="max-w-3xl"
        footer={<><Btn variant="secondary" onClick={() => setPreview(null)}>Close</Btn>
          <Btn variant="primary" Icon={Printer} onClick={doPrint}>Print Letter</Btn></>}>
        {preview && <AdmissionLetterDoc letter={preview} />}
      </Modal>

      <Modal open={gen} onClose={() => setGen(false)} title="Generate Admission Letter" subtitle="Select a student to generate a letter for" width="max-w-md"
        footer={<><Btn variant="secondary" onClick={() => setGen(false)}>Cancel</Btn><Btn variant="primary" onClick={generate} disabled={!student}>Generate</Btn></>}>
        <Field label="Student">
          <Select value={student} onChange={(e) => setStudent(e.target.value)} options={STUDENT_ROWS.map((s) => s.name)} placeholder="Select student" />
        </Field>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-[#676879]"><Search className="h-4 w-4" /> The letter will be created with today&apos;s date and can be printed immediately.</p>
      </Modal>
    </>
  );
}

function AdmissionLetterDoc({ letter }: { letter: AdmissionLetter }) {
  const info: [string, string][] = [
    ["Student Name", letter.student],
    ["Admission Number", letter.admissionNo],
    ["Class / Section", `${letter.cls} - ${letter.section}`],
    ["Academic Session", SCHOOL.session],
    ["Admission Date", letter.date],
    ["Status", letter.status],
  ];
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
          <p>Institute No</p>
          <p className="font-semibold text-[#323338]">{SCHOOL.instituteNo}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[13px]"><span className="text-[#676879]">Ref:</span> <span className="font-mono">{letter.admissionNo}</span></p>
        <p className="text-[13px]"><span className="text-[#676879]">Date:</span> {letter.date}</p>
      </div>

      <h2 className="mt-6 text-center text-[17px] font-bold underline">ADMISSION LETTER</h2>

      <p className="mt-6 text-[14px] leading-relaxed">Dear Parent / Guardian,</p>
      <p className="mt-2 text-[14px] leading-relaxed">
        We are pleased to inform you that your child <span className="font-semibold">{letter.student}</span> has been
        granted admission to <span className="font-semibold">{SCHOOL.name}</span> for the academic session {SCHOOL.session}.
        Please find the admission details below.
      </p>

      <table className="mt-5 w-full border-collapse text-[13px]">
        <tbody>
          {info.map(([k, v]) => (
            <tr key={k} className="border-b border-[#E6E9EF]">
              <td className="w-1/2 bg-[#F6F7FB] px-3 py-2 font-medium">{k}</td>
              <td className="px-3 py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 text-[14px] leading-relaxed">
        Kindly report to the school office on or before the first day of the session to complete the remaining
        formalities and fee submission. We look forward to welcoming your child to our learning community.
      </p>
      <p className="mt-6 text-[14px]">Yours sincerely,</p>
      <p className="mt-10 text-[14px] font-semibold">{SCHOOL.principal}</p>
      <p className="text-[13px] text-[#676879]">Principal, {SCHOOL.shortName}</p>

      <p className="mt-8 border-t border-dashed border-[#C5C7D0] pt-3 text-center text-[11px] text-[#9699A6]">
        This is a computer-generated letter · {SCHOOL.website}
      </p>
    </div>
  );
}