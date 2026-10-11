"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Printer, Eye, FileSignature, Briefcase, RefreshCw, Mail } from "lucide-react";
import {
  Badge, Btn, Card, EmptyState, Field, Modal, PageHeader, RowMenu, SearchBox, Select, Th, Td, cn,
} from "@/components/ui";
import {
  jobLettersApi,
  employeesApi,
  lettersApi,
  describeApiError,
  DEFAULT_JOB_LETTER_TEMPLATE,
  type JobLetterItem,
  type EmployeeItem,
  type LetterTemplate,
  type LetterSchoolInfo,
} from "@/lib/auth/api-client";
import { OfficialLetterDocument, letterHtmlForEmail } from "@/components/letters/official-letter";

const COLS = "grid-cols-[minmax(170px,1.3fr)_140px_140px_130px_120px_150px_64px]";

export default function JobLettersPage() {
  const [rows, setRows] = useState<JobLetterItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<LetterTemplate>(DEFAULT_JOB_LETTER_TEMPLATE);
  const [letterSchool, setLetterSchool] = useState<LetterSchoolInfo | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<JobLetterItem | null>(null);
  const [gen, setGen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailing, setEmailing] = useState(false);

  const fetchJobLetters = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jlRes, empRes, tmplRes] = await Promise.all([
        jobLettersApi.list({ q, status }),
        employeesApi.list(),
        lettersApi.getJobTemplate().catch(() => null),
      ]);
      setRows(jlRes.jobLetters);
      setEmployees(empRes.employees);
      if (tmplRes?.template) setTemplate({ ...DEFAULT_JOB_LETTER_TEMPLATE, ...tmplRes.template });
      if (tmplRes?.school) setLetterSchool(tmplRes.school);
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

  const openPreview = (r: JobLetterItem) => {
    const emp = employees.find((e) => e.name === r.employee || e.employeeId === r.employeeId);
    setEmailTo(emp?.email || "");
    setPreview(r);
  };

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
      setEmailTo(emp.email || "");
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
        <PageHeader
          title="Job Letters"
          subtitle="Generate, customize, print and email employment / appointment letters."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/settings/job-letter" className="inline-flex h-10 items-center rounded border border-[var(--theme-border)] px-3 text-[13px] hover:bg-[var(--theme-hover)]">
                Customize layout
              </Link>
              <Btn variant="secondary" Icon={RefreshCw} onClick={fetchJobLetters}>Refresh</Btn>
              <Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>
            </div>
          }
        />

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
              <div className="p-8 text-center text-[var(--theme-text-muted)]">Loading job letters…</div>
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
                        <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => openPreview(r)}>Preview</Btn>
                        <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { openPreview(r); setTimeout(() => window.print(), 300); }}>Print</Btn>
                      </Td>
                      <Td className="justify-center border-l border-[var(--theme-border)]">
                        <RowMenu items={[
                          { label: "Preview", Icon: Eye, onClick: () => openPreview(r) },
                          { label: "Email letter", Icon: Mail, onClick: () => openPreview(r) },
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
                        <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => openPreview(r)}>Preview</Btn>
                        <Btn size="sm" variant="primary" Icon={Printer} onClick={() => { openPreview(r); setTimeout(() => window.print(), 300); }}>Print</Btn>
                      </div>
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <EmptyState
                    Icon={FileSignature}
                    title="No job letters"
                    message="Generate an employment letter for a staff member."
                    action={<Btn variant="primary" Icon={Plus} onClick={() => setGen(true)}>Generate Letter</Btn>}
                  />
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Job Letter Preview"
        subtitle={preview?.employee}
        width="max-w-3xl"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setPreview(null)}>Close</Btn>
            <Btn
              variant="secondary"
              Icon={Mail}
              disabled={emailing || !emailTo.trim()}
              loading={emailing}
              loadingLabel="Sending…"
              onClick={async () => {
                if (!preview || !emailTo.trim()) return;
                setEmailing(true);
                try {
                  const res = await lettersApi.sendEmail({
                    to: emailTo.trim(),
                    title: `${template.title} — ${preview.employee}`,
                    template: "job_letter",
                    messageHtml: letterHtmlForEmail({
                      title: template.title,
                      paragraphs: [
                        template.salutation.replace(/\{employeeName\}/g, preview.employee),
                        template.bodyIntro
                          .replace(/\{employeeName\}/g, preview.employee)
                          .replace(/\{designation\}/g, preview.designation)
                          .replace(/\{department\}/g, preview.department)
                          .replace(/\{schoolName\}/g, letterSchool?.name || "School"),
                        template.bodyClosing,
                      ],
                      details: [
                        ["Employee", preview.employee],
                        ["Designation", preview.designation],
                        ["Department", preview.department],
                        ["Date", preview.date],
                      ],
                    }),
                  });
                  alert(res.delivered ? "Email sent successfully." : `Email not delivered (${res.reason || "check Resend config"}).`);
                } catch (err) {
                  alert(describeApiError(err).message);
                } finally {
                  setEmailing(false);
                }
              }}
            >
              Send email
            </Btn>
            <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print Letter</Btn>
          </>
        }
      >
        {preview && (
          <div className="space-y-3">
            <div className="no-print flex flex-wrap items-end gap-2 rounded-lg border border-[var(--theme-border)] p-3">
              <Field label="Email to employee" className="min-w-[220px] flex-1">
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="employee@email.com"
                  className="h-10 w-full rounded border border-[var(--theme-border)] bg-transparent px-3 text-[13px]"
                />
              </Field>
            </div>
            <OfficialLetterDocument
              template={template}
              school={letterSchool}
              refNo={preview.id}
              date={preview.date}
              vars={{
                employeeName: preview.employee,
                designation: preview.designation,
                department: preview.department,
              }}
              detailRows={[
                ["Employee", preview.employee],
                ["Designation", preview.designation],
                ["Department", preview.department],
                ["Letter date", preview.date],
                ["Status", preview.status],
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={gen}
        onClose={() => setGen(false)}
        title="Generate Job Letter"
        subtitle="Select an employee from backend"
        width="max-w-md"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setGen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleGenerate} disabled={!selectedEmpId || isGenerating}>
              {isGenerating ? "Generating..." : "Generate"}
            </Btn>
          </>
        }
      >
        <Field label="Select Employee">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-[14px]"
          >
            <option value="">-- Select Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.designation} · {e.department})</option>
            ))}
          </select>
        </Field>
      </Modal>
    </>
  );
}
