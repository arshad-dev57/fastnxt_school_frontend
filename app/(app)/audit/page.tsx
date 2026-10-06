"use client";

import { ShieldCheck } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { AUDIT_LOG, type AuditRow } from "@/lib/school-mock-data";

export default function AuditPage() {
  return (
    <BranchBoard<AuditRow>
      title="Audit Log"
      subtitle="Who changed what, when, and the before/after values — financial and academic history is never silently deleted."
      Icon={ShieldCheck}
      nameLabel="Action"
      countNoun="entries"
      rows={AUDIT_LOG}
      groupBy={(r) => r.module}
      nameOf={(r) => `${r.action} — ${r.record}`}
      subtitleOf={(r) => `${r.user} · ${r.at}`}
      searchTextOf={(r) => `${r.user} ${r.action} ${r.module} ${r.record} ${r.at}`}
      columns={[
        { key: "user", label: "User", width: "minmax(140px,1fr)", cell: (r) => r.user },
        { key: "module", label: "Module", width: "120px", cell: (r) => r.module },
        { key: "record", label: "Record", width: "minmax(150px,1fr)", cell: (r) => r.record },
        { key: "at", label: "Date / Time", width: "150px", cell: (r) => r.at },
        { key: "before", label: "Before", width: "minmax(140px,1fr)", cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.before}</span> },
        { key: "after", label: "After", width: "minmax(150px,1fr)", cell: (r) => r.after },
      ]}
      detailFields={(r) => [
        { label: "User", value: r.user },
        { label: "Action", value: r.action },
        { label: "Module", value: r.module },
        { label: "Record", value: r.record },
        { label: "Date / Time", value: r.at },
        { label: "Before", value: r.before },
        { label: "After", value: r.after },
      ]}
      mobileRows={(r) => [
        { label: "User", value: r.user },
        { label: "Module", value: r.module },
        { label: "At", value: r.at },
        { label: "After", value: r.after },
      ]}
      emptyTitle="No audit entries"
      emptyMessage="No audit entries match the current campus scope."
    />
  );
}
