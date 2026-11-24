"use client";

import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeft, Pencil, IdCard, Receipt, GraduationCap, Wallet, ClipboardCheck, FileText, User,
} from "lucide-react";
import { Avatar, Badge, PageHeader, rs } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { BoardPageSkeleton } from "@/components/skeleton";
import {
  attendanceApi,
  examsApi,
  feesApi,
  studentsApi,
  type ExamResultItem,
  type FeeInvoiceItem,
  type FeePaymentItem,
  type StudentAttendanceItem,
  type StudentItem,
} from "@/lib/auth/api-client";
import { studentProgram, studentTrackLabel } from "@/lib/student-directory";

export default function StudentRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<StudentItem | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>([]);
  const [payments, setPayments] = useState<FeePaymentItem[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendanceItem[]>([]);
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { student: row } = await studentsApi.get(id);
        if (cancelled) return;
        setStudent(row);
        const [invoiceRes, paymentRes, attendanceRes, resultRes] = await Promise.all([
          feesApi.listInvoices({ q: row.studentId || row.admissionNo || row.name }).catch(() => ({ invoices: [] })),
          feesApi.listPayments({ studentId: row.id, pageSize: 50 }).catch(() => ({ payments: [], meta: { page: 1, pageSize: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
          attendanceApi.listStudents({ studentId: row.id }).catch(() => ({ attendance: [] })),
          examsApi.listResults({ studentId: row.id }).catch(() => ({ results: [] })),
        ]);
        if (cancelled) return;
        setInvoices((invoiceRes.invoices || []).filter((inv) => !inv.studentId || inv.studentId === row.id));
        setPayments(paymentRes.payments || []);
        setAttendance(attendanceRes.attendance || []);
        setResults(resultRes.results || []);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this student.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const feeTotals = useMemo(() => {
    const billed = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const paid = invoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0);
    const balance = invoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
    return { billed, paid, balance };
  }, [invoices]);

  const attendanceCounts = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    attendance.forEach((row) => {
      if (row.status in counts) counts[row.status as keyof typeof counts] += 1;
    });
    return counts;
  }, [attendance]);

  if (loading) return <BoardPageSkeleton rows={6} cols={4} />;

  if (error || !student) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <p className="text-[15px] text-[var(--theme-danger)]">{error || "Student not found."}</p>
        <Link href="/students" className="mt-3 inline-flex text-[14px] font-medium text-[var(--theme-primary)] hover:underline">
          Back to students
        </Link>
      </div>
    );
  }

  const extras = student.admissionExtras;
  const track = studentTrackLabel(student);
  const program = studentProgram(student);
  const qualifications = extras?.qualifications || [];
  const documents = [
    ...(student.documents || []),
    ...((extras?.documentsChecklist || []).map((name) => ({ id: name, name, type: "Checklist", url: "", uploadDate: "" }))),
  ];

  return (
    <div className="pb-16">
      <PageHeader
        title={student.name}
        subtitle={[student.studentId, program || `${student.cls}-${student.section}`, track].filter(Boolean).join(" · ")}
        back={
          <Link href="/students" className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]" aria-label="Back to students">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        }
        actions={
          <>
            <Link href={`/students/${student.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <Link href="/students/id-cards" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <IdCard className="h-4 w-4" /> ID Card
            </Link>
            <Link href={`/fees/receipts?q=${encodeURIComponent(student.admissionNo || student.studentId || student.name)}`} className="hidden h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)] sm:inline-flex">
              <Receipt className="h-4 w-4" /> Fee receipts
            </Link>
          </>
        }
      />

      <div className="space-y-5 px-4 pt-4 sm:px-6">
        <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={student.name} src={student.photo} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={student.status} />
                {track ? <Badge label={track} tone="blue" /> : null}
                {program ? <Badge label={program} tone="gray" /> : null}
              </div>
              <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">
                {student.cls}-{student.section} · Session {student.session || "—"} · Admitted {student.admissionDate || "—"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Billed" value={rs(feeTotals.billed)} />
              <Stat label="Paid" value={rs(feeTotals.paid)} />
              <Stat label="Balance" value={rs(feeTotals.balance)} />
            </div>
          </div>
        </section>

        <Section title="Personal details" Icon={User}>
          <Grid>
            <Info label="Student ID" value={student.studentId} />
            <Info label="Admission No" value={student.admissionNo || "—"} />
            <Info label="Gender" value={student.gender || "—"} />
            <Info label="Date of birth" value={student.dob || "—"} />
            <Info label="Blood group" value={student.blood || "—"} />
            <Info label="Phone" value={student.phone || "—"} />
            <Info label="Email" value={student.email || "—"} />
            <Info label="CNIC" value={extras?.cnic || "—"} />
            <Info label="Father" value={student.father || "—"} />
            <Info label="Mother" value={student.mother || "—"} />
            <Info label="Guardian" value={student.guardian || "—"} />
            <Info label="Guardian CNIC" value={extras?.guardianCnic || "—"} />
            <Info label="Alternate phone" value={extras?.altPhone || "—"} />
            <Info label="Previous school" value={student.prevSchool || "—"} />
            <div className="sm:col-span-2"><Info label="Address" value={student.address || "—"} /></div>
            {student.medical ? <div className="sm:col-span-2"><Info label="Medical" value={student.medical} /></div> : null}
            {student.notes ? <div className="sm:col-span-2"><Info label="Notes" value={student.notes} /></div> : null}
          </Grid>
        </Section>

        <Section title="Admission" Icon={GraduationCap}>
          <Grid>
            <Info label="Program" value={track || "Standard"} />
            <Info label="Course" value={program || student.course || "—"} />
            <Info label="Class" value={student.cls || "—"} />
            <Info label="Section" value={student.section || "—"} />
            <Info label="Form no" value={extras?.formNo || "—"} />
            {extras?.lawDuration ? <Info label="Law duration" value={extras.lawDuration} /> : null}
            {extras?.nursingDuration ? <Info label="Nursing duration" value={extras.nursingDuration} /> : null}
            {extras?.latRollNo ? <Info label="LAT roll no" value={extras.latRollNo} /> : null}
            {extras?.latScore ? <Info label="LAT score" value={extras.latScore} /> : null}
            {extras?.latYear ? <Info label="LAT year" value={extras.latYear} /> : null}
            {extras?.lawNote ? <div className="sm:col-span-2"><Info label="Law note" value={extras.lawNote} /></div> : null}
            {extras?.nursingNote ? <div className="sm:col-span-2"><Info label="Nursing note" value={extras.nursingNote} /></div> : null}
          </Grid>
          {qualifications.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">
                    <th className="py-2 pr-3 font-medium">Qualification</th>
                    <th className="py-2 pr-3 font-medium">Board</th>
                    <th className="py-2 pr-3 font-medium">Year</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 pr-3 font-medium">Obtained</th>
                    <th className="py-2 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {qualifications.map((row) => (
                    <tr key={row.level} className="border-b border-[var(--theme-border)] last:border-0">
                      <td className="py-2 pr-3">{row.level || "—"}</td>
                      <td className="py-2 pr-3">{row.board || "—"}</td>
                      <td className="py-2 pr-3">{row.year || "—"}</td>
                      <td className="py-2 pr-3">{row.totalMarks || "—"}</td>
                      <td className="py-2 pr-3">{row.obtainedMarks || "—"}</td>
                      <td className="py-2">{row.percentage || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {extras?.fees && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] uppercase tracking-wide text-[var(--theme-text-faint)]">Admission fee snapshot</p>
              <Grid>
                <Info label="Admission fee" value={extras.fees.admissionFee || "—"} />
                <Info label="Course fee" value={extras.fees.courseFee || "—"} />
                <Info label="Monthly fee" value={extras.fees.monthlyFee || "—"} />
                <Info label="Discount" value={extras.fees.discount || "—"} />
                <Info label="Receipt no" value={extras.fees.receiptNo || "—"} />
                <Info label="Payment date" value={extras.fees.paymentDate || "—"} />
              </Grid>
            </div>
          )}
        </Section>

        <Section title="Fees" Icon={Wallet} action={<Link href={`/fees/invoices?q=${encodeURIComponent(student.studentId || student.name)}`} className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Open invoices</Link>}>
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Stat label="Invoices" value={String(invoices.length)} />
            <Stat label="Receipts" value={String(payments.length)} />
            <Stat label="Outstanding" value={rs(feeTotals.balance)} />
          </div>
          {invoices.length === 0 ? (
            <Empty>No fee invoices are linked to this student yet.</Empty>
          ) : (
            <Rows
              headers={["Invoice", "Period", "Total", "Paid", "Balance", "Status"]}
              rows={invoices.map((inv) => [
                inv.invoiceNo,
                inv.period,
                rs(inv.total),
                rs(inv.paid),
                rs(inv.balance),
                inv.status,
              ])}
            />
          )}
          {payments.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] uppercase tracking-wide text-[var(--theme-text-faint)]">Recent receipts</p>
              <Rows
                headers={["Receipt", "Date", "Amount", "Method"]}
                rows={payments.slice(0, 8).map((pay) => [
                  pay.receiptNo,
                  pay.paidAt?.slice(0, 10) || "—",
                  rs(pay.amount),
                  pay.method || "—",
                ])}
              />
            </div>
          )}
        </Section>

        <Section title="Performance" Icon={ClipboardCheck}>
          {results.length === 0 ? (
            <Empty>No exam results are recorded for this student yet.</Empty>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="rounded-lg border border-[var(--theme-border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{result.exam}</p>
                    <p className="text-[13px] text-[var(--theme-text-muted)]">
                      {result.percentage}% · {result.grade} · Position {result.position || "—"}
                    </p>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {result.subjects.map((subject) => (
                      <div key={subject.subject} className="flex items-center justify-between rounded border border-[var(--theme-border)] px-3 py-2 text-[13px]">
                        <span>{subject.subject}</span>
                        <span className="text-[var(--theme-text-muted)]">{subject.obtained}/{subject.total} · {subject.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Attendance" Icon={ClipboardCheck}>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Present" value={String(attendanceCounts.Present)} />
            <Stat label="Absent" value={String(attendanceCounts.Absent)} />
            <Stat label="Late" value={String(attendanceCounts.Late)} />
            <Stat label="Leave" value={String(attendanceCounts.Leave)} />
          </div>
          {attendance.length === 0 ? (
            <Empty>No attendance marks are saved for this student yet.</Empty>
          ) : (
            <Rows
              headers={["Date", "Status", "Remark"]}
              rows={[...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map((row) => [
                row.date,
                row.status,
                row.remark || "—",
              ])}
            />
          )}
        </Section>

        <Section title="Documents" Icon={FileText}>
          {documents.length === 0 ? (
            <Empty>No documents are attached to this admission.</Empty>
          ) : (
            <ul className="divide-y divide-[var(--theme-border)]">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                  <span>
                    <span className="font-medium">{doc.name}</span>
                    {doc.type ? <span className="ml-2 text-[12px] text-[var(--theme-text-muted)]">{doc.type}</span> : null}
                  </span>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline">Open</a>
                  ) : (
                    <span className="text-[12px] text-[var(--theme-text-faint)]">Listed</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, Icon, action, children }: { title: string; Icon: typeof User; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--theme-text-muted)]" />
        <h2 className="text-[16px] font-semibold">{title}</h2>
        <div className="flex-1" />
        {action}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="break-words text-[14px] font-medium">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="text-[16px] font-semibold">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-[var(--theme-text-muted)]">{children}</p>;
}

function Rows({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--theme-border)] text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">
            {headers.map((header) => <th key={header} className="py-2 pr-3 font-medium">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--theme-border)] last:border-0">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="py-2 pr-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
