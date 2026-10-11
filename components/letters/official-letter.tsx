"use client";

import type { LetterSchoolInfo, LetterTemplate } from "@/lib/auth/api-client";

function fill(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), v || ""),
    template,
  );
}

export function OfficialLetterDocument({
  template,
  school,
  refNo,
  date,
  vars,
  detailRows,
}: {
  template: LetterTemplate;
  school: LetterSchoolInfo | null;
  refNo?: string;
  date?: string;
  vars: Record<string, string>;
  detailRows?: [string, string][];
}) {
  const schoolName = school?.name || "School";
  const accent = template.accentColor || "#0f4c81";
  const intro = fill(template.bodyIntro, { schoolName, ...vars });
  const closing = fill(template.bodyClosing, { schoolName, ...vars });
  const salutation = fill(template.salutation, { schoolName, ...vars });

  return (
    <div className="print-area print-document mx-auto max-w-[720px] bg-white p-8 text-black">
      <header className="flex items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: accent }}>
        <div className="flex items-center gap-3">
          {template.showLogo && school?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="h-14 w-14 object-contain" />
          ) : (
            <span
              className="flex h-14 w-14 items-center justify-center rounded text-[20px] font-extrabold text-white"
              style={{ background: accent }}
            >
              {(school?.shortName || schoolName).charAt(0)}
            </span>
          )}
          <div>
            <h1 className="text-[20px] font-bold leading-tight">{schoolName}</h1>
            {school?.address ? <p className="text-[12px] text-neutral-600">{school.address}</p> : null}
            <p className="text-[12px] text-neutral-600">
              {[school?.phone, school?.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="text-right text-[12px] text-neutral-600">
          <p className="font-semibold uppercase tracking-wide text-black">Official Letter</p>
          {school?.website ? <p>{school.website}</p> : null}
        </div>
      </header>

      {template.showRef && (
        <div className="mt-5 flex items-center justify-between text-[13px]">
          <p>
            <span className="text-neutral-600">Ref:</span>{" "}
            <span className="font-mono font-medium">{refNo || "—"}</span>
          </p>
          <p>
            <span className="text-neutral-600">Date:</span> {date || "—"}
          </p>
        </div>
      )}

      <h2 className="mt-6 text-center text-[17px] font-bold underline underline-offset-4" style={{ color: accent }}>
        {template.title}
      </h2>

      <p className="mt-6 text-[14px] leading-relaxed">{salutation}</p>
      <p className="mt-3 text-[14px] leading-relaxed">{intro}</p>

      {detailRows && detailRows.length > 0 && (
        <table className="mt-5 w-full border-collapse text-[13px]">
          <tbody>
            {detailRows.map(([k, v]) => (
              <tr key={k} className="border-b border-neutral-300">
                <td className="w-1/2 bg-neutral-100 px-3 py-2 font-medium">{k}</td>
                <td className="px-3 py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-5 text-[14px] leading-relaxed">{closing}</p>
      <p className="mt-6 text-[14px]">{template.signOff}</p>
      <p className="mt-12 text-[14px] font-semibold">{school?.principal || template.signerTitle}</p>
      <p className="text-[13px] text-neutral-600">{template.signerTitle}</p>
      <p className="text-[13px] text-neutral-600">{schoolName}</p>

      <p className="mt-8 border-t border-dashed border-neutral-400 pt-3 text-center text-[11px] text-neutral-500">
        {template.footerNote} · {schoolName}
      </p>
    </div>
  );
}

export function letterHtmlForEmail(args: {
  title: string;
  paragraphs: string[];
  details?: [string, string][];
}) {
  const rows = (args.details || [])
    .map(([k, v]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;">${k}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${v}</td></tr>`)
    .join("");
  const paras = args.paragraphs.map((p) => `<p style="margin:0 0 12px;line-height:1.6;">${p}</p>`).join("");
  return `${paras}${rows ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${rows}</table>` : ""}`;
}
