"use client";

import {
  APL_CATEGORIES,
  LAW_TRACKS,
  NURSING_TRACKS,
  type AplAdmissionCategory,
} from "@/lib/apl-admission";

type Props = {
  category: AplAdmissionCategory;
  schoolName: string;
  schoolPhone?: string | null;
  schoolAddress?: string | null;
};

function Blank({ wide }: { wide?: boolean }) {
  return <span className={`inline-block border-b border-black ${wide ? "min-w-[70%] flex-1" : "min-w-[140px] flex-1"}`}>&nbsp;</span>;
}

function Field({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div className={`flex items-end gap-2 text-[12px] ${wide ? "sm:col-span-2" : ""}`}>
      <span className="shrink-0 font-semibold">{label}</span>
      <Blank wide={wide} />
    </div>
  );
}

function Box({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-2 text-[12px]">
      <span className="inline-block h-3.5 w-3.5 shrink-0 border border-black" />
      <span>{label}</span>
    </label>
  );
}

export function AplPrintableAdmissionForm({ category, schoolName, schoolPhone, schoolAddress }: Props) {
  const preset = APL_CATEGORIES.find((item) => item.id === category) || APL_CATEGORIES[0];
  const programs =
    category === "law"
      ? LAW_TRACKS.map((track) => track.courseName)
      : category === "nursing"
        ? NURSING_TRACKS.map((track) => track.courseName)
        : preset.programs;
  const docs = preset.documents;

  return (
    <div
      data-print-root="apl-brochure"
      className="print-area print-document mx-auto max-w-[210mm] overflow-hidden rounded-xl border-2 border-[#1e4b8f] bg-white text-black shadow-sm ring-1 ring-black/10 print:max-w-none print:rounded-none print:shadow-none print:ring-0"
    >
      <div className="flex items-stretch border-b-2 border-[#1e4b8f]">
        <div className="flex flex-1 flex-col justify-center bg-[#1e4b8f] px-4 py-3 text-white">
          <div className="text-[18px] font-bold tracking-wide">{schoolName}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-blue-100">{preset.formTitle}</div>
          {(schoolAddress || schoolPhone) ? (
            <div className="mt-1 text-[11px] text-blue-100">
              {[schoolAddress, schoolPhone ? `Phone: ${schoolPhone}` : ""].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>
        <div className="flex w-36 flex-col justify-center gap-2 border-l-2 border-[#1e4b8f] bg-slate-50 px-3 py-2 text-[11px]">
          <div className="flex items-end gap-1"><span className="font-semibold">Form No.</span><Blank /></div>
          <div className="flex items-end gap-1"><span className="font-semibold">Date</span><Blank /></div>
          <div className="flex items-end gap-1"><span className="font-semibold">Student ID</span><Blank /></div>
        </div>
        <div className="flex w-24 shrink-0 items-center justify-center border-l-2 border-[#1e4b8f] bg-white text-center text-[10px] font-semibold uppercase text-slate-500">
          Photo
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <section className="space-y-2">
          <h3 className="border-b border-[#1e4b8f] pb-1 text-[12px] font-bold uppercase tracking-wide text-[#1e4b8f]">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field label="Student Name" />
            <Field label="Father / Guardian" />
            <Field label="CNIC / B-Form" />
            <Field label="Guardian CNIC" />
            <Field label="Phone Number" />
            <Field label="WhatsApp Number" />
            <Field label="Alternate Contact" />
            <Field label="E-mail" />
            <Field label="Date of Birth" />
            <Field label="Complete Address" wide />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="border-b border-[#1e4b8f] pb-1 text-[12px] font-bold uppercase tracking-wide text-[#1e4b8f]">
            {category === "law" ? "Law Program" : category === "nursing" ? "Nursing Program" : "IT Course"}
          </h3>
          <div className={`grid gap-2 ${category === "it" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            {programs.map((program) => (
              <Box key={program} label={program} />
            ))}
          </div>
          {category === "law" ? (
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <Field label="LAT Roll No." />
              <Field label="LAT Score" />
              <Field label="LAT Year" />
            </div>
          ) : null}
          {category !== "it" ? (
            <div className="mt-2">
              <Field label="Note" wide />
            </div>
          ) : (
            <div className="mt-2">
              <Field label="Selected course / other" wide />
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="border-b border-[#1e4b8f] pb-1 text-[12px] font-bold uppercase tracking-wide text-[#1e4b8f]">
            Educational Qualification
          </h3>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#1e4b8f] text-left text-white">
                <th className="border border-[#1e4b8f] px-2 py-1.5">Qualification</th>
                <th className="border border-[#1e4b8f] px-2 py-1.5">Board / University</th>
                <th className="border border-[#1e4b8f] px-2 py-1.5">Year</th>
                <th className="border border-[#1e4b8f] px-2 py-1.5">Total</th>
                <th className="border border-[#1e4b8f] px-2 py-1.5">Obtained</th>
                <th className="border border-[#1e4b8f] px-2 py-1.5">%</th>
              </tr>
            </thead>
            <tbody>
              {preset.qualificationLevels.map((level) => (
                <tr key={level}>
                  <td className="border border-slate-400 px-2 py-2 font-medium">{level}</td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-2">
          <h3 className="border-b border-[#1e4b8f] pb-1 text-[12px] font-bold uppercase tracking-wide text-[#1e4b8f]">
            Fee Details
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field label="Admission / Registration Fee" />
            <Field label="Semester / Course Fee" />
            <Field label="Monthly Fee" />
            <Field label="Discount / Scholarship" />
            <Field label="Receipt No." />
            <Field label="Payment Date" />
            <Field label="Remarks" wide />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="border-b border-[#1e4b8f] pb-1 text-[12px] font-bold uppercase tracking-wide text-[#1e4b8f]">
            Documents Attached
          </h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {docs.map((doc) => (
              <Box key={doc} label={doc} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-8 pt-6 text-[11px]">
          <div>
            <div className="mb-8 border-b border-black" />
            <p className="font-semibold">Applicant / Guardian Signature</p>
          </div>
          <div>
            <div className="mb-8 border-b border-black" />
            <p className="font-semibold">Authorized Signature</p>
          </div>
        </section>
      </div>
    </div>
  );
}
