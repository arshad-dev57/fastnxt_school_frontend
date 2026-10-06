"use client";

import { useState } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Briefcase, CalendarCheck, GraduationCap, ReceiptText, TrendingUp, UserPlus, Users, Wallet,
} from "lucide-react";
import { rs } from "@/components/ui";
import { AXIS_TICK, tooltipStyles, useChartMotion, useChartTheme } from "./chart-theme";
import { ChartBox, ChartCard, ChartEmpty, ChartLegend, ChartStat, Segmented } from "./chart-kit";
import {
  ENROLLMENT_PERIODS, admissionsData, admissionsSummary, attendanceData, attendanceSummary,
  classDistributionData, classPerformanceData, employeeData, employeeSummary, enrollmentData,
  feeCollectionData, feeStatusData, feeSummary, genderData, resultsSummary,
  type PeriodKey,
} from "@/lib/dashboard-data";

const fmtInt = (n: number) => n.toLocaleString("en-PK");
const fmtShort = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

/* ------------------------------------------------------ Student enrollment */
export function EnrollmentChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();
  const [period, setPeriod] = useState<PeriodKey>("6m");
  const data = enrollmentData[period];

  return (
    <ChartCard title="Student Enrollment" subtitle="Enrollment trend over the selected period." Icon={TrendingUp}
      right={<Segmented options={ENROLLMENT_PERIODS} value={period} onChange={setPeriod} />}>
      {data.length === 0 ? <ChartEmpty height={260} /> : (
        <>
          <ChartBox height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={p.primary} stopOpacity={0.42} />
                    <stop offset="100%" stopColor={p.primary} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={48} domain={["dataMin - 40", "dataMax + 20"]} />
                <Tooltip {...tooltipStyles(p)} cursor={{ stroke: p.axis, strokeDasharray: "4 4" }} formatter={(v) => fmtInt(Number(v))} />
                <Area type="monotone" dataKey="total" name="Total students" stroke={p.primary} strokeWidth={2.4}
                  fill="url(#enrollFill)" isAnimationActive={animate} animationDuration={duration} />
                <Line type="monotone" dataKey="admissions" name="New admissions" stroke={p.accent} strokeWidth={2}
                  dot={{ r: 2.5, fill: p.accent, strokeWidth: 0 }} isAnimationActive={animate} animationDuration={duration} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartBox>
          <div className="mt-2 px-1">
            <ChartLegend columns={2} items={[{ label: "Total students", color: p.primary }, { label: "New admissions", color: p.accent }]} />
          </div>
        </>
      )}
    </ChartCard>
  );
}

/* --------------------------------------------------------------- Attendance */
export function AttendanceChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();
  const series = [
    { key: "present", name: "Present", color: p.success },
    { key: "absent", name: "Absent", color: p.danger },
    { key: "late", name: "Late", color: p.warning },
    { key: "leave", name: "Leave", color: p.info },
  ];

  return (
    <ChartCard title="Attendance Overview" subtitle="Daily attendance breakdown for the current week." Icon={CalendarCheck}
      right={<span className="text-[12px] font-semibold text-[var(--theme-success-text)]">92% present</span>}>
      {attendanceData.length === 0 ? <ChartEmpty height={260} /> : (
        <>
          <ChartBox height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={44} />
                <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} formatter={(v) => fmtInt(Number(v))} />
                {series.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color}
                    radius={i === series.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={46}
                    isAnimationActive={animate} animationDuration={duration} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div className="mt-3 px-1">
            <ChartLegend columns={2} items={attendanceSummary.map((s, i) => ({ label: s.label, color: series[i].color, value: `${s.value}%` }))} />
          </div>
        </>
      )}
    </ChartCard>
  );
}

/* --------------------------------------------------------------------- Fees */
export function FeeCollectionChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();

  return (
    <ChartCard title="Fee Collection" subtitle="Expected vs collected fees with pending dues." Icon={Wallet}
      right={<span className="text-[12px] font-medium text-[var(--theme-text-muted)]">Last 8 months</span>}>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <ChartStat label="Collected" value={rs(feeSummary.totalCollected)} tone="success" />
        <ChartStat label="Pending" value={rs(feeSummary.totalPending)} tone="warning" />
        <ChartStat label="Rate" value={`${feeSummary.collectionRate}%`} />
      </div>
      {feeCollectionData.length === 0 ? <ChartEmpty height={240} /> : <ChartBox height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={feeCollectionData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2} barCategoryGap="26%">
            <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => fmtShort(Number(v))} />
            <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} formatter={(v) => rs(Number(v))} />
            <Bar dataKey="expected" name="Expected" fill={p.primarySoft} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={animate} animationDuration={duration} />
            <Bar dataKey="collected" name="Collected" fill={p.success} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={animate} animationDuration={duration} />
            <Line dataKey="pending" name="Pending" type="monotone" stroke={p.warning} strokeWidth={2.2} dot={{ r: 2.5, fill: p.warning, strokeWidth: 0 }} isAnimationActive={animate} animationDuration={duration} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartBox>}
      <div className="mt-2 px-1">
        <ChartLegend columns={3} items={[{ label: "Expected", color: p.primarySoft }, { label: "Collected", color: p.success }, { label: "Pending", color: p.warning }]} />
      </div>
    </ChartCard>
  );
}

export function FeeStatusDonut() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();
  const colors = [p.success, p.warning, p.danger, p.accent];

  return (
    <ChartCard title="Fee Status" subtitle="Share of invoices by payment state." Icon={ReceiptText}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-full sm:w-1/2">
          {feeStatusData.length === 0 ? <ChartEmpty height={180} /> : <ChartBox height={180}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...tooltipStyles(p)} formatter={(v) => `${v}%`} />
                <Pie data={feeStatusData} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="94%"
                  paddingAngle={2} stroke={p.surface} strokeWidth={2} isAnimationActive={animate} animationDuration={duration}>
                  {feeStatusData.map((s, i) => <Cell key={s.label} fill={colors[i % colors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>}
        </div>
        <div className="w-full sm:w-1/2">
          <ChartLegend items={feeStatusData.map((s, i) => ({ label: s.label, color: colors[i % colors.length], value: `${s.value}%` }))} />
        </div>
      </div>
    </ChartCard>
  );
}

/* ------------------------------------------------------- Students by class */
export function ClassDistributionChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();

  return (
    <ChartCard title="Students by Class" subtitle="Current headcount per class." Icon={GraduationCap}
      right={<span className="text-[12px] font-medium text-[var(--theme-text-muted)]">12 classes</span>}>
      {classDistributionData.length === 0 ? <ChartEmpty height={330} /> : (
        <ChartBox height={330}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={classDistributionData} margin={{ top: 4, right: 18, left: 6, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={62} />
              <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} formatter={(v) => fmtInt(Number(v))} />
              <Bar dataKey="value" name="Students" fill={p.primary} radius={[0, 4, 4, 0]} maxBarSize={16}
                isAnimationActive={animate} animationDuration={duration} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
    </ChartCard>
  );
}

/* ----------------------------------------------------- Gender distribution */
export function GenderDonut() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();
  const colors = [p.primary, p.accent2, p.warning];

  return (
    <ChartCard title="Student Distribution" subtitle="Students by gender." Icon={Users}>
      <div className="flex items-center gap-4">
        <div className="w-[132px] shrink-0">
          {genderData.length === 0 ? <ChartEmpty height={140} /> : <ChartBox height={140}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...tooltipStyles(p)} formatter={(v) => fmtInt(Number(v))} />
                <Pie data={genderData} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="94%"
                  paddingAngle={2} stroke={p.surface} strokeWidth={2} isAnimationActive={animate} animationDuration={duration}>
                  {genderData.map((s, i) => <Cell key={s.label} fill={colors[i % colors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>}
        </div>
        <div className="min-w-0 flex-1">
          <ChartLegend items={genderData.map((g, i) => ({ label: g.label, color: colors[i % colors.length], value: fmtInt(g.value) }))} />
        </div>
      </div>
    </ChartCard>
  );
}

/* -------------------------------------------------------------- Admissions */
export function AdmissionsChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();
  const series = [
    { key: "applications", name: "Applications", color: p.primary },
    { key: "approved", name: "Approved", color: p.success },
    { key: "pending", name: "Pending", color: p.warning },
    { key: "rejected", name: "Rejected", color: p.danger },
  ];

  return (
    <ChartCard title="Admissions Overview" subtitle="Applications and their current status." Icon={UserPlus}
      right={<span className="text-[12px] font-medium text-[var(--theme-text-muted)]">Last 6 months</span>}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ChartStat label="Applications" value={String(admissionsSummary.applications)} />
        <ChartStat label="Approved" value={String(admissionsSummary.approved)} tone="success" />
        <ChartStat label="Pending" value={String(admissionsSummary.pending)} tone="warning" />
        <ChartStat label="Rejected" value={String(admissionsSummary.rejected)} tone="danger" />
      </div>
      {admissionsData.length === 0 ? <ChartEmpty height={220} /> : <ChartBox height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={admissionsData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={40} />
            <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} formatter={(v) => fmtInt(Number(v))} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={12}
                isAnimationActive={animate} animationDuration={duration} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>}
      <div className="mt-2 px-1">
        <ChartLegend columns={2} items={series.map((s) => ({ label: s.name, color: s.color }))} />
      </div>
    </ChartCard>
  );
}

/* --------------------------------------------------------------- Employees */
export function EmployeeChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();

  return (
    <ChartCard title="Employee Overview" subtitle="Staff headcount by department." Icon={Briefcase}>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <ChartStat label="Total" value={String(employeeSummary.total)} />
        <ChartStat label="Teaching" value={String(employeeSummary.teaching)} tone="success" />
        <ChartStat label="Support" value={String(employeeSummary.support)} />
      </div>
      {employeeData.length === 0 ? <ChartEmpty height={210} /> : <ChartBox height={210}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={employeeData} margin={{ top: 4, right: 18, left: 6, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={92} />
            <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} formatter={(v) => fmtInt(Number(v))} />
            <Bar dataKey="value" name="Staff" fill={p.accent} radius={[0, 4, 4, 0]} maxBarSize={14}
              isAnimationActive={animate} animationDuration={duration} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ChartStat label="Active" value={String(employeeSummary.active)} tone="success" />
        <ChartStat label="Inactive" value={String(employeeSummary.inactive)} tone="danger" />
      </div>
    </ChartCard>
  );
}

/* ---------------------------------------------------------- Exams / results */
export function ResultsChart() {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();

  return (
    <ChartCard title="Class Performance" subtitle="Average marks by class (last exam)." Icon={GraduationCap}
      right={<span className="text-[12px] font-semibold text-[var(--theme-success-text)]">{resultsSummary.passRate}% pass</span>}>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <ChartStat label="Avg marks" value={`${resultsSummary.averageMarks}%`} />
        <ChartStat label="Pass rate" value={`${resultsSummary.passRate}%`} tone="success" />
        <ChartStat label="Fail rate" value={`${resultsSummary.failRate}%`} tone="danger" />
      </div>
      {classPerformanceData.length === 0 ? <ChartEmpty height={280} /> : (
        <ChartBox height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={classPerformanceData} margin={{ top: 4, right: 24, left: 6, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={62} />
              <Tooltip {...tooltipStyles(p)} cursor={{ fill: p.grid, opacity: 0.35 }} formatter={(v) => `${v}%`} />
              <Bar dataKey="value" name="Average" fill={p.accent} radius={[0, 4, 4, 0]} maxBarSize={14}
                isAnimationActive={animate} animationDuration={duration} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
    </ChartCard>
  );
}
