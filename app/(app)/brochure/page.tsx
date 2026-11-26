"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, BookOpen, ClipboardList, FileText, GraduationCap } from "lucide-react";
import { Badge, Btn, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { APL_CATEGORIES, looksLikeAplSchool, type AplAdmissionCategory } from "@/lib/apl-admission";
import {
  brochureKindLabel,
  brochureSheetById,
  brochureSheetsFor,
  type AplBrochureSheet,
} from "@/lib/apl-brochure";
import { AplPrintableAdmissionForm } from "@/components/admissions/apl-printable-admission-form";

export default function AplBrochurePage() {
  const { user } = useAuth();
  const isApl = looksLikeAplSchool(user?.school?.name, user?.school?.shortName);
  const [category, setCategory] = useState<AplAdmissionCategory | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const sheets = useMemo(() => (category ? brochureSheetsFor(category) : []), [category]);
  const selected = brochureSheetById(sheetId);
  const categoryMeta = APL_CATEGORIES.find((item) => item.id === category) || null;

  const printSheet = () => {
    void import("@/lib/print-element").then(({ printElement }) => {
      const isForm = selected?.kind === "form";
      const ok = printElement("[data-print-root='apl-brochure']", {
        title: selected ? `${selected.title}${isForm ? "" : " — Brochure"}` : "Brochure",
        pageCss: "@page { size: A4 portrait; margin: 10mm; }",
      });
      if (!ok) window.print();
    });
  };

  if (!isApl) {
    return (
      <div className="px-4 py-10 sm:px-6">
        <p className="text-[15px] text-[var(--theme-text-muted)]">
          Course brochure browser is available for A Plus Institute.
        </p>
        <Link href="/students" className="mt-3 inline-flex text-[14px] font-medium text-[var(--theme-primary)] hover:underline">
          Back to students
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="no-print">
        <PageHeader
          title="Course Brochure"
          subtitle="Print Law, IT or Nursing information sheets for students and parents."
          back={
            category || selected ? (
              <button
                type="button"
                aria-label="Back"
                onClick={() => {
                  if (selected) setSheetId(null);
                  else setCategory(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : undefined
          }
          actions={
            selected ? (
              <Btn variant="primary" Icon={Printer} onClick={printSheet}>
                {selected.kind === "form" ? "Print admission form" : "Print for student"}
              </Btn>
            ) : null
          }
        />
      </div>

      <div className="space-y-4 px-4 pt-4 sm:px-6">
        {!category && (
          <div className="no-print grid gap-3 sm:grid-cols-3">
            {APL_CATEGORIES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.id);
                  setSheetId(null);
                }}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-left transition-colors hover:bg-[var(--theme-hover)]"
              >
                <span className="text-[12px] font-semibold text-[var(--theme-text-faint)]">{index + 1}</span>
                <p className="mt-1 text-[18px] font-bold text-[var(--theme-text)]">{item.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-[var(--theme-text-muted)]">{item.description}</p>
              </button>
            ))}
          </div>
        )}

        {category && !selected && (
          <div className="no-print space-y-3">
            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
              <p className="text-[12px] uppercase tracking-wide text-[var(--theme-text-faint)]">Category</p>
              <p className="text-[18px] font-semibold">{categoryMeta?.title}</p>
              <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">{categoryMeta?.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => setSheetId(sheet.id)}
                  className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-left transition-colors hover:bg-[var(--theme-hover)]"
                >
                  <div className="flex items-center gap-2">
                    {sheet.kind === "form" ? <ClipboardList className="h-4 w-4 text-[var(--theme-text-muted)]" /> : null}
                    {sheet.kind === "overview" ? <BookOpen className="h-4 w-4 text-[var(--theme-text-muted)]" /> : null}
                    {sheet.kind === "admission" ? <FileText className="h-4 w-4 text-[var(--theme-text-muted)]" /> : null}
                    {sheet.kind === "course" ? <GraduationCap className="h-4 w-4 text-[var(--theme-text-muted)]" /> : null}
                    <Badge label={brochureKindLabel(sheet.kind)} tone={sheet.kind === "form" ? "green" : "blue"} />
                  </div>
                  <p className="mt-2 text-[16px] font-semibold">{sheet.title}</p>
                  <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">{sheet.subtitle}</p>
                  {sheet.duration ? <p className="mt-2 text-[12px] text-[var(--theme-text-faint)]">Duration: {sheet.duration}</p> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <>
            <div className="no-print flex flex-wrap items-center gap-2">
              <Badge label={brochureKindLabel(selected.kind)} tone={selected.kind === "form" ? "green" : "blue"} />
              {selected.duration ? <Badge label={selected.duration} tone="gray" /> : null}
              <span className="text-[13px] text-[var(--theme-text-muted)]">
                {selected.kind === "form"
                  ? "Blank admission form preview — print and give to the student to fill."
                  : "Preview below — print and hand to the student."}
              </span>
            </div>
            {selected.kind === "form" ? (
              <AplPrintableAdmissionForm
                category={selected.category}
                schoolName={user?.school?.name || "A Plus Institute"}
                schoolPhone={user?.school?.phone}
                schoolAddress={[user?.school?.city, user?.school?.country].filter(Boolean).join(", ")}
              />
            ) : (
              <BrochureDocument
                sheet={selected}
                schoolName={user?.school?.name || "A Plus Institute"}
                schoolPhone={user?.school?.phone}
                schoolAddress={[user?.school?.city, user?.school?.country].filter(Boolean).join(", ")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BrochureDocument({
  sheet,
  schoolName,
  schoolPhone,
  schoolAddress,
}: {
  sheet: AplBrochureSheet;
  schoolName: string;
  schoolPhone?: string | null;
  schoolAddress?: string | null;
}) {
  const printedOn = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div
      data-print-root="apl-brochure"
      className="print-area print-document mx-auto max-w-[210mm] rounded-xl bg-white p-6 text-black shadow-sm ring-1 ring-black/10 sm:p-8 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0"
    >
      <header className="mb-5 border-b-2 border-black pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">Prospectus / Brochure</p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight">{schoolName}</h1>
            {schoolAddress ? <p className="mt-1 text-[12px] text-neutral-700">{schoolAddress}</p> : null}
            {schoolPhone ? <p className="text-[12px] text-neutral-700">Phone: {schoolPhone}</p> : null}
          </div>
          <div className="text-right text-[11px] text-neutral-700">
            <p className="font-semibold uppercase tracking-wide text-black">{sheet.category.toUpperCase()}</p>
            <p>Printed: {printedOn}</p>
          </div>
        </div>
      </header>

      <div className="mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-600">{brochureKindLabel(sheet.kind)}</p>
        <h2 className="text-[20px] font-bold">{sheet.title}</h2>
        <p className="mt-1 text-[13px] text-neutral-700">{sheet.subtitle}</p>
        {sheet.duration ? <p className="mt-2 text-[13px]"><span className="font-semibold">Duration:</span> {sheet.duration}</p> : null}
      </div>

      <Section title="Eligibility">
        <Bullets items={sheet.eligibility} />
      </Section>
      <Section title="Key highlights">
        <Bullets items={sheet.highlights} />
      </Section>
      <Section title={sheet.kind === "admission" ? "Admission steps" : "What you will learn"}>
        <Bullets items={sheet.modules} />
      </Section>
      <Section title="Career pathways">
        <Bullets items={sheet.careers} />
      </Section>
      <Section title="Documents to bring">
        <Bullets items={sheet.documents} />
      </Section>
      {sheet.notes.length > 0 && (
        <Section title="Important notes">
          <Bullets items={sheet.notes} />
        </Section>
      )}

      <footer className="mt-8 border-t border-neutral-400 pt-4 text-[11px] text-neutral-600">
        <p>This sheet is for counselling and admission guidance. Final fees, seats and batch timings are confirmed by the campus office.</p>
        <p className="mt-2 font-medium text-black">{schoolName} · A Plus Institute brochure</p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-1.5 text-[13px] font-bold uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-[13px] leading-5 text-neutral-800">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
