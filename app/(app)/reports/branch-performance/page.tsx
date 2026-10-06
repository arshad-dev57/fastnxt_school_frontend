"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, TrendingUp } from "lucide-react";
import { ReportPage, ReportTable, RRow, RC, RTotal, FilterSelect } from "@/components/report";
import { ChartBox, ChartCard, ChartLegend } from "@/components/charts/chart-kit";
import { AXIS_TICK, tooltipStyles, useChartTheme } from "@/components/charts/chart-theme";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { rs } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import { BRANCH_PERFORMANCE, type BranchPerformanceRow } from "@/lib/school-mock-data";
import { useState } from "react";

const COLS = ["Students", "Attendance", "Fee Collection", "Outstanding", "Admissions", "Employees", "Expenses", "Income", "Exam Average"] as const;

export default function BranchPerformancePage() {
  const { currentBranchId, branchNameFor } = useBranch();
  const p = useChartTheme();
  const [session, setSession] = useState("2025-2026");

  const rows = useMemo(
    () => (currentBranchId === "all" ? BRANCH_PERFORMANCE : BRANCH_PERFORMANCE.filter((r) => r.branchId === currentBranchId)),
    [currentBranchId],
  );

  const totals = rows.reduce(
    (a, r) => ({
      students: a.students + r.students, feeCollection: a.feeCollection + r.feeCollection,
      outstanding: a.outstanding + r.outstanding, admissions: a.admissions + r.admissions,
      employees: a.employees + r.employees, expenses: a.expenses + r.expenses, income: a.income + r.income,
      attendance: a.attendance + r.attendance, examAverage: a.examAverage + r.examAverage,
    }),
    { students: 0, feeCollection: 0, outstanding: 0, admissions: 0, employees: 0, expenses: 0, income: 0, attendance: 0, examAverage: 0 },
  );
  const n = Math.max(rows.length, 1);
  const chartData = rows.map((r: BranchPerformanceRow) => ({
    name: branchNameFor(r.branchId).replace(" Campus", ""),
    students: r.students,
    collection: Math.round(r.feeCollection / 1000),
  }));

  return (
    <ReportPage
      title="Branch Performance"
      subtitle="Consolidated management view across campuses for the selected academic session."
      Icon={Building2}
      filters={
        <>
          <BranchScopeBar />
          <FilterSelect label="Academic session" options={["2023-2024", "2024-2025", "2025-2026"]} value={session} onChange={setSession} />
        </>
      }
    >
      <ChartCard title="Enrollment & fee collection by campus" subtitle="Students (bars) and fee collection in thousands (bars)." Icon={TrendingUp}>
        <ChartBox height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={48} />
              <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} />
              <Bar dataKey="students" name="Students" fill={p.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="collection" name="Fee collection (k)" fill={p.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <div className="mt-2 px-1">
          <ChartLegend columns={2} items={[{ label: "Students", color: p.primary }, { label: "Fee collection (thousands)", color: p.accent }]} />
        </div>
      </ChartCard>

      <ReportTable columns={[{ label: "Branch" }, ...COLS.map((c) => ({ label: c, align: "right" as const }))]} minWidth={1040}>
        {rows.map((r) => (
          <RRow key={r.branchId}>
            <RC bold>{branchNameFor(r.branchId)}</RC>
            <RC align="right">{r.students.toLocaleString()}</RC>
            <RC align="right">{r.attendance}%</RC>
            <RC align="right">{rs(r.feeCollection)}</RC>
            <RC align="right" danger={r.outstanding > 350000}>{rs(r.outstanding)}</RC>
            <RC align="right">{r.admissions}</RC>
            <RC align="right">{r.employees}</RC>
            <RC align="right">{rs(r.expenses)}</RC>
            <RC align="right">{rs(r.income)}</RC>
            <RC align="right">{r.examAverage}%</RC>
          </RRow>
        ))}
        <RTotal>
          <RC bold>{currentBranchId === "all" ? "All Branches" : "Campus total"}</RC>
          <RC align="right">{totals.students.toLocaleString()}</RC>
          <RC align="right">{Math.round(totals.attendance / n)}%</RC>
          <RC align="right">{rs(totals.feeCollection)}</RC>
          <RC align="right">{rs(totals.outstanding)}</RC>
          <RC align="right">{totals.admissions}</RC>
          <RC align="right">{totals.employees}</RC>
          <RC align="right">{rs(totals.expenses)}</RC>
          <RC align="right">{rs(totals.income)}</RC>
          <RC align="right">{Math.round(totals.examAverage / n)}%</RC>
        </RTotal>
      </ReportTable>
    </ReportPage>
  );
}
