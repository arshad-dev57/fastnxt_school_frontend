"use client";

import { Wallet } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs } from "@/components/ui";
import { PAYROLL, type PayrollRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Draft: "var(--theme-pending)", Approved: "var(--theme-info)", Paid: "var(--theme-success)" };

export default function PayrollPage() {
  return (
    <BranchBoard<PayrollRow>
      title="Payroll"
      subtitle="Branch payroll — salary structures, allowances, deductions and payslips."
      Icon={Wallet}
      nameLabel="Employee"
      countNoun="records"
      rows={PAYROLL}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.employee}
      subtitleOf={(r) => `${r.designation} · ${r.department}`}
      searchTextOf={(r) => `${r.employee} ${r.designation} ${r.department} ${r.month}`}
      columns={[
        { key: "month", label: "Month", width: "110px", cell: (r) => r.month },
        { key: "basic", label: "Basic", width: "130px", cell: (r) => rs(r.basic) },
        { key: "allow", label: "Allowances", width: "130px", cell: (r) => rs(r.allowances) },
        { key: "ded", label: "Deductions", width: "130px", cell: (r) => rs(r.deductions) },
        { key: "net", label: "Net Pay", width: "140px", cell: (r) => <span className="font-semibold">{rs(r.net)}</span> },
        { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Employee", value: r.employee },
        { label: "Designation", value: r.designation },
        { label: "Department", value: r.department },
        { label: "Month", value: r.month },
        { label: "Basic", value: rs(r.basic) },
        { label: "Allowances", value: rs(r.allowances) },
        { label: "Deductions", value: rs(r.deductions) },
        { label: "Net Pay", value: rs(r.net) },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Month", value: r.month },
        { label: "Net Pay", value: rs(r.net) },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No payroll records"
      emptyMessage="No payroll records match the current campus scope."
    />
  );
}
