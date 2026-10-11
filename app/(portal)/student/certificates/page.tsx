"use client";

import { useEffect, useState } from "react";
import { Download, FileCheck2, IdCard, ShieldCheck } from "lucide-react";
import { Btn, PageHeader, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import {
  describeApiError,
  studentsApi,
  uploadsApi,
  type StudentDocItem,
} from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

type DocRow = StudentDocItem & { status: string };

export default function StudentCertificatesPage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) {
      setRows([]);
      setLoading(profileLoading);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await studentsApi.me();
        const docs = (res.student.documents || []).map((d) => ({
          ...d,
          status: "Issued",
        }));
        if (!cancelled) setRows(docs);
      } catch (err) {
        if (!cancelled) {
          setError(describeApiError(err).message);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student, profileLoading]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Certificates & Documents"
        subtitle={
          student
            ? `Documents on file for ${student.studentId}.`
            : "Your school documents"
        }
      />

      {(error || profileError) && (
        <p className="px-4 pt-2 text-[13px] text-[var(--theme-danger)] sm:px-6">{error || profileError}</p>
      )}

      <div className="grid grid-cols-3 gap-3 px-4 pt-4 sm:px-6">
        <StatCard label="Documents" value={rows.length} Icon={ShieldCheck} tone="green" sub="On your record" />
        <StatCard label="In Process" value={0} Icon={FileCheck2} tone="orange" sub="Certificate requests" />
        <StatCard label="Student ID" value={student?.studentId || "—"} Icon={IdCard} tone="blue" sub={scopeLabel} />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Documents"
          subtitle={loading ? "Loading…" : "Files uploaded to your student record by the school office."}
          Icon={ShieldCheck}
          nameLabel="Document"
          rows={rows}
          keyOf={(r) => r.id}
          nameOf={(r) => r.name}
          subtitleOf={(r) => `${r.type} · ${r.uploadDate || "—"}`}
          searchTextOf={(r) => `${r.name} ${r.type}`}
          searchPlaceholder="Search document"
          scopeLabel={scopeLabel}
          countNoun="documents"
          groupBy={(r) => r.type || "Other"}
          groupColorOf={() => "var(--theme-info)"}
          columns={[
            { key: "type", label: "Type", width: "140px", cell: (r) => r.type },
            { key: "date", label: "Uploaded", width: "120px", cell: (r) => r.uploadDate || "—" },
            { key: "size", label: "Size", width: "100px", cell: (r) => (r.size ? `${Math.round(r.size / 1024)} KB` : "—") },
            { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Name", value: r.name },
            { label: "Type", value: r.type },
            { label: "Uploaded", value: r.uploadDate || "—" },
            { label: "Status", value: <StatusPill label={r.status} /> },
          ]}
          menu={(r) => [
            {
              label: "Download",
              Icon: Download,
              onClick: () => {
                const href = uploadsApi.downloadHref({
                  url: r.url,
                  publicId: r.publicId,
                  filename: r.name,
                });
                window.open(href, "_blank", "noopener,noreferrer");
              },
            },
          ]}
          emptyTitle="No documents"
          emptyMessage="When the office uploads certificates or documents to your record, they will appear here."
          minWidth={760}
        />
      </div>
    </div>
  );
}
