"use client";

import { IdCard, ShieldCheck, Download, FileCheck2 } from "lucide-react";
import { Btn, PageHeader, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_STUDENT, studentCertificates } from "@/lib/portal-data";

/* Student Certificates = the Admin /certificates module scoped to the signed-in
   student, plus the ID card produced by /students/id-cards. Requesting a new
   certificate is the only write action a student gets here. */
const COLORS: Record<string, string> = {
  Requested: "var(--theme-info)", Generated: "var(--theme-warning)",
  Issued: "var(--theme-success)", Rejected: "var(--theme-danger)",
};

export default function StudentCertificatesPage() {
  const issued = studentCertificates.filter((c) => c.status === "Issued");
  const pending = studentCertificates.filter((c) => c.status === "Requested" || c.status === "Generated");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Certificates & Documents"
        subtitle={`Bonafide, transfer, character and ID card requests for ${PORTAL_STUDENT.studentId}.`}
        actions={<Btn variant="primary" Icon={FileCheck2}>Request Certificate</Btn>}
      />

      <div className="grid grid-cols-3 gap-3 px-4 pt-4 sm:px-6">
        <StatCard label="Issued" value={issued.length} Icon={ShieldCheck} tone="green" sub="Ready to collect" />
        <StatCard label="In Process" value={pending.length} Icon={FileCheck2} tone="orange" sub="Requested or generated" />
        <StatCard label="Student ID" value={PORTAL_STUDENT.studentId} Icon={IdCard} tone="blue" sub="Digital ID card" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Certificates"
          subtitle="Every certificate request with its verification code."
          Icon={ShieldCheck}
          nameLabel="Certificate"
          rows={studentCertificates}
          keyOf={(r) => r.id}
          nameOf={(r) => r.type}
          subtitleOf={(r) => `${r.cls} · requested ${r.requested}`}
          searchTextOf={(r) => `${r.type} ${r.status} ${r.verify}`}
          searchPlaceholder="Search certificate"
          scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
          countNoun="certificates"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k]}
          primaryAction={<Btn variant="secondary" Icon={Download}>Download All</Btn>}
          columns={[
            { key: "cls", label: "Class", width: "130px", cell: (r) => r.cls },
            { key: "requested", label: "Requested", width: "120px", cell: (r) => r.requested },
            { key: "issued", label: "Issued", width: "120px", cell: (r) => r.issued },
            { key: "verify", label: "Verify Code", width: "minmax(140px,1fr)", cell: (r) => (
              r.verify !== "—" ? <span className="rounded-full border border-[var(--theme-border)] px-2.5 py-0.5 text-[12px] font-medium">{r.verify}</span> : "—"
            ) },
            { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Type", value: r.type },
            { label: "Class", value: r.cls },
            { label: "Requested", value: r.requested },
            { label: "Issued", value: r.issued },
            { label: "Verify Code", value: r.verify },
            { label: "Status", value: <StatusPill label={r.status} /> },
          ]}
          menu={(r) => [{ label: "Download", Icon: Download, onClick: () => {} }]}
          emptyTitle="No certificates"
          emptyMessage="Request a certificate and it will appear here with its status."
          minWidth={860}
        />
      </div>
    </div>
  );
}
