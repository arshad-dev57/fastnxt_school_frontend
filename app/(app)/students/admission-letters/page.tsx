"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Printer, Eye, FileText, Mail, Search, RefreshCw, Trash2 } from "lucide-react";
import {
  Badge, Btn, Card, EmptyState, Field, Modal, PageHeader, RowMenu, SearchBox, Select, Th, Td, cn, ConfirmDialog,
} from "@/components/ui";
import {
  studentsApi,
  schoolApi,
  type AdmissionLetterItem,
  type StudentItem,
  type SchoolProfile,
} from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const COLS = "grid-cols-[minmax(170px,1.3fr)_150px_120px_120px_120px_150px_64px]";

export default function AdmissionLettersPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<AdmissionLetterItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<AdmissionLetterItem | null>(null);
  const [gen, setGen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toDelete, setToDelete] = useState<AdmissionLetterItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [lettersRes, studentsRes, schoolRes] = await Promise.all([
        studentsApi.listAdmissionLetters({ branchId: branchScope }),
        studentsApi.list({ branchId: branchScope }),
        schoolApi.getProfile().catch(() => null),
      ]);
      setRows(lettersRes.letters || []);
      setStudents(studentsRes.students || []);
      if (schoolRes?.school) setSchool(schoolRes.school);
    } catch (err: unknown) {
      console.error("Failed to load admission letters:", err);
      setError(err instanceof Error ? err.message : "Failed to load admission letters.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => rows
    .filter((r) => r.student.toLowerCase().includes(q.toLowerCase()) || r.admissionNo.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (status ? r.status === status : true)),
  [rows, q, status]);

  const doPrint = () => window.print();

  const handleGenerate = async () => {
    if (!selectedStudentName) return;
    const s = students.find((x) => x.name === selectedStudentName);
    if (!s) return;

    try {
      setGenerating(true);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await studentsApi.generateAdmissionLetter({
        student: s.name,
        studentId: s.id,
        admissionNo: s.admissionNo || `ADM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        cls: s.cls,
        section: s.section,
        date: new Date().toISOString().slice(0, 10),
        branchId: branchScope,
      });

      setRows((p) => [res.letter, ...p]);
      setGen(false);
      setSelectedStudentName("");
      setPreview(res.letter);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate admission letter.");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPrinted = async (letter: AdmissionLetterItem) => {
    try {
      const res = await studentsApi.updateAdmissionLetterStatus(letter.id, "Printed");
      setRows((p) => p.map((x) => (x.id === letter.id ? res.letter : x)));
    } catch (err: unknown) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await studentsApi.deleteAdmissionLetter(toDelete.id);
      setRows((p) => p.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete admission letter.");
    }
  };

  const studentOptions = students.map((s) => s.name);

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Admission Letters"
          subtitle="Generate, preview and print student admission letters."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                title="Refresh"
                aria-label="Refresh admission letters"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>
                Generate Letter
              </Btn>
            </div>
          }
        />

        <div className="px-4 pb-24 sm:px-6">
          {error && (
            <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 py-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search student or admission no" className="w-full sm:w-72" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["Generated", "Pending", "Printed"]} placeholder="All Status" className="w-40" />
          </div>

          <Card pad={false}>
            {loading && rows.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--theme-primary)]" />
                Loading admission letters…
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                Icon={FileText}
                title="No admission letters"
                message="Generate an admission letter for any registered student."
                action={
                  <Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>
                    Generate Letter
                  </Btn>
                }
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                    <Th className="border-l border-[var(--theme-border)]">Student</Th>
                    <Th className="border-l border-[var(--theme-border)]">Admission No</Th>
                    <Th className="border-l border-[var(--theme-border)]">Class</Th>
                    <Th className="border-l border-[var(--theme-border)]">Section</Th>
                    <Th className="border-l border-[var(--theme-border)]">Date</Th>
                    <Th className="border-l border-[var(--theme-border)]">Status</Th>
                    <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                  </div>
                  {filtered.map((r) => (
                    <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                      <Td className="gap-2 border-l border-[var(--theme-border)] font-medium">
                        <FileText className="h-4 w-4 text-[var(--theme-accent-strong)]" />
                        {r.student}
                      </Td>
                      <Td className="border-l border-[var(--theme-border)] font-mono text-[13px] text-[var(--theme-text-muted)]">{r.admissionNo}</Td>
                      <Td className="border-l border-[var(--theme-border)]">{r.cls}</Td>
                      <Td className="border-l border-[var(--theme-border)]"><Badge label={r.section} tone="gray" /></Td>
                      <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.date}</Td>
                      <Td className="border-l border-[var(--theme-border)]">
                        <Badge label={r.status} tone={r.status === "Printed" ? "green" : "blue"} />
                      </Td>
                      <Td className="justify-center border-l border-[var(--theme-border)]">
                        <RowMenu items={[
                          { label: "Preview", Icon: Eye, onClick: () => setPreview(r) },
                          { label: "Print", Icon: Printer, onClick: () => { setPreview(r); setTimeout(doPrint, 300); } },
                          { label: "Mark as Printed", Icon: Mail, onClick: () => handleMarkPrinted(r) },
                          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                        ]} />
                      </Td>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 p-3 md:hidden">
                  {filtered.map((r) => (
                    <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-info)" }}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[15px]">{r.student}</p>
                          <p className="text-[12px] text-[var(--theme-text-muted)] font-mono">{r.admissionNo} · {r.cls}-{r.section}</p>
                        </div>
                        <RowMenu items={[
                          { label: "Preview", Icon: Eye, onClick: () => setPreview(r) },
                          { label: "Print", Icon: Printer, onClick: () => { setPreview(r); setTimeout(doPrint, 300); } },
                          { label: "Mark as Printed", Icon: Mail, onClick: () => handleMarkPrinted(r) },
                          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                        ]} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[13px] text-[var(--theme-text-muted)]">
                        <span>{r.date}</span>
                        <Badge label={r.status} tone={r.status === "Printed" ? "green" : "blue"} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* LETTER PREVIEW & PRINT MODAL */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Admission Letter Preview" subtitle={preview?.admissionNo} width="max-w-3xl"
        footer={<><Btn variant="secondary" onClick={() => setPreview(null)}>Close</Btn>
          <Btn variant="primary" Icon={Printer} onClick={doPrint}>Print Letter</Btn></>}>
        {preview && <AdmissionLetterDoc letter={preview} school={school} />}
      </Modal>

      {/* GENERATE LETTER MODAL */}
      <Modal
        open={gen}
        onClose={() => setGen(false)}
        title="Generate Admission Letter"
        subtitle="Select a student from database to generate a letter"
        width="max-w-md"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setGen(false)} disabled={generating}>Cancel</Btn>
            <Btn variant="primary" onClick={handleGenerate} disabled={!selectedStudentName || generating} loading={generating} loadingLabel="Generating…">
              Generate Letter
            </Btn>
          </>
        }
      >
        <Field label="Select Student *">
          <Select
            value={selectedStudentName}
            onChange={(e) => setSelectedStudentName(e.target.value)}
            options={studentOptions}
            placeholder={students.length > 0 ? "Select student" : "No students registered yet"}
            disabled={students.length === 0}
          />
        </Field>
        {students.length === 0 && (
          <p className="mt-2 text-xs text-amber-500">
            You must add at least one student first before generating an admission letter.
          </p>
        )}
        <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
          <Search className="h-4 w-4" /> The letter will be generated dynamically with today&apos;s date and school branding.
        </p>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete admission letter"
        confirmLabel="Delete"
        message={`Delete admission letter for "${toDelete?.student}" (${toDelete?.admissionNo})?`}
      />
    </>
  );
}

function AdmissionLetterDoc({
  letter,
  school,
}: {
  letter: AdmissionLetterItem;
  school: SchoolProfile | null;
}) {
  const schoolName = school?.name || "BisonsEduCore360 Academy";
  const schoolAddress = school?.address || "Main Campus, Education City";
  const schoolPhone = school?.phone || "0300-1234567";
  const schoolEmail = school?.email || "info@bisonseducore.edu";

  const info: [string, string][] = [
    ["Student Name", letter.student],
    ["Admission Number", letter.admissionNo],
    ["Class / Section", `${letter.cls} - ${letter.section}`],
    ["Academic Session", "2025-2026"],
    ["Admission Date", letter.date],
    ["Status", letter.status],
  ];

  return (
    <div className="print-area mx-auto max-w-[720px] bg-[var(--theme-surface)] p-6 text-[var(--theme-text)] sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b-2 border-[var(--theme-primary)] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-[22px] font-extrabold text-white">
            {schoolName.charAt(0)}
          </span>
          <div>
            <h1 className="text-[20px] font-bold leading-tight">{schoolName}</h1>
            <p className="text-[12px] text-[var(--theme-text-muted)]">{schoolAddress}</p>
            <p className="text-[12px] text-[var(--theme-text-muted)]">{schoolPhone} · {schoolEmail}</p>
          </div>
        </div>
        <div className="hidden text-right text-[12px] text-[var(--theme-text-muted)] sm:block">
          <p>Institution Letter</p>
          <p className="font-semibold text-[var(--theme-text)]">OFFICIAL</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[13px]"><span className="text-[var(--theme-text-muted)]">Ref:</span> <span className="font-mono">{letter.admissionNo}</span></p>
        <p className="text-[13px]"><span className="text-[var(--theme-text-muted)]">Date:</span> {letter.date}</p>
      </div>

      <h2 className="mt-6 text-center text-[17px] font-bold underline">ADMISSION LETTER</h2>

      <p className="mt-6 text-[14px] leading-relaxed">Dear Parent / Guardian,</p>
      <p className="mt-2 text-[14px] leading-relaxed">
        We are pleased to inform you that your child <span className="font-semibold">{letter.student}</span> has been
        granted admission to <span className="font-semibold">{schoolName}</span> in <span className="font-semibold">{letter.cls} (Section {letter.section})</span>.
        Please find the admission details below.
      </p>

      <table className="mt-5 w-full border-collapse text-[13px]">
        <tbody>
          {info.map(([k, v]) => (
            <tr key={k} className="border-b border-[var(--theme-border)]">
              <td className="w-1/2 bg-[var(--theme-sidebar)] px-3 py-2 font-medium">{k}</td>
              <td className="px-3 py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 text-[14px] leading-relaxed">
        Kindly report to the school office on or before the first day of the academic session to complete the remaining
        formalities and documentation. We look forward to welcoming your child to our school community.
      </p>
      <p className="mt-6 text-[14px]">Yours sincerely,</p>
      <p className="mt-10 text-[14px] font-semibold">Principal / Administration</p>
      <p className="text-[13px] text-[var(--theme-text-muted)]">{schoolName}</p>

      <p className="mt-8 border-t border-dashed border-[var(--theme-border-strong)] pt-3 text-center text-[11px] text-[var(--theme-text-faint)]">
        This is a computer-generated document from {schoolName}
      </p>
    </div>
  );
}