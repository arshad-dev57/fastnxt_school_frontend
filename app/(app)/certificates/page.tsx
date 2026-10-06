"use client";

import { FileBadge } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { CERTIFICATES, type CertificateRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Requested: "var(--theme-pending)", Generated: "var(--theme-info)", Issued: "var(--theme-success)", Rejected: "var(--theme-danger)" };

export default function CertificatesPage() {
  return (
    <BranchBoard<CertificateRow>
      title="Certificates & Documents"
      subtitle="Bonafide, character, transfer and leaving certificates with QR verification codes."
      Icon={FileBadge}
      nameLabel="Student"
      countNoun="requests"
      rows={CERTIFICATES}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.student}
      subtitleOf={(r) => `${r.cls} · ${r.type}`}
      searchTextOf={(r) => `${r.student} ${r.cls} ${r.type} ${r.verify}`}
      columns={[
        { key: "type", label: "Certificate", width: "minmax(160px,1.2fr)", cell: (r) => r.type },
        { key: "req", label: "Requested", width: "120px", cell: (r) => r.requested },
        { key: "issued", label: "Issued", width: "120px", cell: (r) => r.issued },
        { key: "verify", label: "Verify Code", width: "120px", cell: (r) => r.verify },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Student", value: r.student },
        { label: "Class", value: r.cls },
        { label: "Certificate", value: r.type },
        { label: "Requested", value: r.requested },
        { label: "Issued", value: r.issued },
        { label: "Verify Code", value: r.verify },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Certificate", value: r.type },
        { label: "Requested", value: r.requested },
        { label: "Verify", value: r.verify },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No certificate requests"
      emptyMessage="No document requests match the current campus scope."
    />
  );
}
