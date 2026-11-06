"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { Btn, cn } from "@/components/ui";
import { schoolApi, type SchoolProfile } from "@/lib/auth/api-client";
import { useAuth } from "@/lib/auth/auth-context";

export type PrintMeta = {
  schoolName: string;
  shortName?: string;
  address?: string;
  phone?: string;
  email?: string;
  principal?: string;
  session?: string;
  logoUrl?: string;
};

export function useSchoolPrintMeta(): { meta: PrintMeta; loading: boolean } {
  const { school } = useAuth();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await schoolApi.getProfile();
        if (!cancelled) setProfile(res.school);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const meta: PrintMeta = {
    schoolName: profile?.name || school?.schoolName || "School",
    shortName: profile?.shortName || school?.shortName || undefined,
    address: profile?.address || [profile?.city, profile?.country].filter(Boolean).join(", ") || school?.city || undefined,
    phone: profile?.phone || school?.phone || undefined,
    email: profile?.email || school?.email || undefined,
    principal: profile?.principal || undefined,
    session: profile?.academicSession || undefined,
    logoUrl: profile?.logoUrl || school?.logoUrl || undefined,
  };

  return { meta, loading };
}

export function printedOnLabel(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function triggerPrint(selectorOrEvent?: string | { preventDefault?: () => void }) {
  if (typeof window === "undefined") return;
  const selector =
    typeof selectorOrEvent === "string" && selectorOrEvent
      ? selectorOrEvent
      : ".print-document, .print-area";
  // Prefer isolated iframe print so AI logo / chrome never appear.
  void import("@/lib/print-element").then(({ printElement }) => {
    const ok = printElement(selector, {
      title: "Print",
      pageCss: "@page { size: A4 portrait; margin: 12mm; }",
    });
    if (!ok) window.print();
  });
}

/** Official A4 report shell — letterhead + title + body + signatures. */
export function PrintDocument({
  title,
  subtitle,
  meta,
  metaRight,
  children,
  showSignatures = true,
  preparedBy = "Administration Office",
  className = "",
  screenOnlyClassName = "",
}: {
  title: string;
  subtitle?: string;
  meta: PrintMeta;
  metaRight?: ReactNode;
  children: ReactNode;
  showSignatures?: boolean;
  preparedBy?: string;
  className?: string;
  /** Extra classes for on-screen preview only (hidden when printing). */
  screenOnlyClassName?: string;
}) {
  const contact = [meta.phone, meta.email].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "print-area print-document mx-auto max-w-[210mm] bg-white p-6 text-black shadow-sm ring-1 ring-black/10 sm:p-8",
        "print:max-w-none print:p-0 print:shadow-none print:ring-0",
        screenOnlyClassName,
        className,
      )}
    >
      <header className="mb-5 flex items-start justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex min-w-0 items-center gap-3">
          {meta.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.logoUrl} alt="" className="h-14 w-14 shrink-0 object-contain" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded border-2 border-black text-[20px] font-extrabold">
              {(meta.shortName || meta.schoolName).charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold leading-tight tracking-tight sm:text-[20px]">{meta.schoolName}</h1>
            {meta.address ? <p className="text-[11px] text-neutral-700">{meta.address}</p> : null}
            {contact ? <p className="text-[11px] text-neutral-700">{contact}</p> : null}
          </div>
        </div>
        <div className="shrink-0 text-right text-[11px] text-neutral-700">
          <p className="font-semibold uppercase tracking-wide text-black">{title}</p>
          <p>Printed: {printedOnLabel()}</p>
          {meta.session ? <p>Session: {meta.session}</p> : null}
          {metaRight}
        </div>
      </header>

      <div className="mb-4">
        <h2 className="text-[15px] font-bold sm:text-[16px]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[11px] text-neutral-600">{subtitle}</p> : null}
      </div>

      <div className="print-report-body">{children}</div>

      {showSignatures ? (
        <footer className="mt-8 flex items-end justify-between gap-6 border-t border-neutral-400 pt-6 text-[11px] text-neutral-600">
          <div>
            <div className="mb-8 h-px w-36 bg-black" />
            <p className="font-semibold text-black">Prepared by</p>
            <p>{preparedBy}</p>
          </div>
          <div className="text-right">
            <div className="mb-8 ml-auto h-px w-36 bg-black" />
            <p className="font-semibold text-black">Verified by</p>
            <p>{meta.principal || "Principal / Admin"}</p>
          </div>
        </footer>
      ) : null}

      <p className="mt-6 text-center text-[10px] text-neutral-500">
        Computer-generated report · {meta.schoolName} · FastNxt
      </p>
    </div>
  );
}

/** Standard black/white report table for print documents. */
export function PrintTable({
  columns,
  children,
  className = "",
}: {
  columns: { label: string; align?: "left" | "right" | "center"; width?: string }[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("print-table w-full border-collapse text-[12px]", className)}>
      <thead>
        <tr className="border-y-2 border-black bg-neutral-100 text-left">
          {columns.map((c) => (
            <th
              key={c.label}
              className={cn(
                "px-2 py-2 font-semibold",
                c.align === "right" && "text-right",
                c.align === "center" && "text-center",
              )}
              style={c.width ? { width: c.width } : undefined}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function PrintBtn({
  label = "Print / PDF",
  disabled,
  className = "",
}: {
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Btn variant="primary" Icon={Printer} onClick={triggerPrint} disabled={disabled} className={className}>
      {label}
    </Btn>
  );
}
