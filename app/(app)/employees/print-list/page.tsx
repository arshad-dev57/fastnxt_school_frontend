"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, CardHead, PageHeader, Select, cn } from "@/components/ui";
import { PrintDocument, PrintTable, triggerPrint, useSchoolPrintMeta } from "@/components/print/print-document";
import { employeesApi, type EmployeeItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";
import { DEPARTMENTS, DESIGNATIONS } from "@/lib/mock-data";

export default function PrintEmployeeListPage() {
  const { currentBranchId } = useBranch();
  const { meta } = useSchoolPrintMeta();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await employeesApi.list({ branchId: branchScope });
      setEmployees(res.employees || []);
    } catch (err) {
      console.error("Failed to load employees for print list:", err);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const list = useMemo(
    () =>
      employees
        .filter((e) => !currentBranchId || currentBranchId === "all" || !e.branchId || e.branchId === currentBranchId)
        .filter((e) => (dept ? e.department === dept : true))
        .filter((e) => (designation ? e.designation === designation : true))
        .filter((e) => (status ? e.status === status : true)),
    [employees, currentBranchId, dept, designation, status],
  );

  const activeFilters = [
    dept && `Department: ${dept}`,
    designation && `Designation: ${designation}`,
    status && `Status: ${status}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Print Staff List"
          subtitle="Generate a printable employee directory — formatted as an official school document."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                title="Refresh"
                aria-label="Refresh employee list"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Btn variant="primary" Icon={Printer} onClick={triggerPrint} disabled={list.length === 0}>
                Print / PDF
              </Btn>
            </div>
          }
        />

        <div className="px-4 pb-6 sm:px-6">
          <Card pad={false}>
            <CardHead title="Filters" subtitle="Choose the criteria for the printed list" Icon={SlidersHorizontal} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select value={dept} onChange={(e) => setDept(e.target.value)} options={["", ...DEPARTMENTS]} placeholder="All Departments" />
              <Select value={designation} onChange={(e) => setDesignation(e.target.value)} options={["", ...DESIGNATIONS]} placeholder="All Designations" />
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["", "Active", "Inactive"]} placeholder="All Status" />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--theme-border)] px-4 py-3">
              {activeFilters.length ? (
                activeFilters.map((f) => <Badge key={f} label={f} tone="blue" />)
              ) : (
                <span className="text-[13px] text-[var(--theme-text-faint)]">
                  No filters — {employees.length} employee(s)
                </span>
              )}
            </div>
          </Card>
          <p className="mt-3 text-[13px] text-[var(--theme-text-muted)]">
            {list.length} employee(s) will print. Use Print / PDF (or Ctrl+P → Save as PDF) for a clean A4 report.
          </p>
        </div>
      </div>

      <div className="px-4 pb-24 sm:px-6">
        <PrintDocument
          title="Staff Directory"
          subtitle={
            activeFilters.length
              ? `Filters: ${activeFilters.join(" · ")} · Total: ${list.length}`
              : `All staff · Total: ${list.length}`
          }
          meta={meta}
          preparedBy="HR / Administration"
        >
          {list.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">No employees match the selected filters.</p>
          ) : (
            <PrintTable
              columns={[
                { label: "#", width: "40px" },
                { label: "Emp ID", width: "90px" },
                { label: "Name" },
                { label: "Designation" },
                { label: "Department" },
                { label: "Phone", width: "110px" },
                { label: "Status", width: "80px" },
              ]}
            >
              {list.map((e, i) => (
                <tr key={e.id} className="border-b border-neutral-300">
                  <td className="px-2 py-1.5 text-neutral-600">{i + 1}</td>
                  <td className="px-2 py-1.5 font-mono text-[11px]">{e.employeeId}</td>
                  <td className="px-2 py-1.5 font-medium">{e.name}</td>
                  <td className="px-2 py-1.5">{e.designation}</td>
                  <td className="px-2 py-1.5">{e.department}</td>
                  <td className="px-2 py-1.5">{e.phone || "—"}</td>
                  <td className="px-2 py-1.5">{e.status}</td>
                </tr>
              ))}
            </PrintTable>
          )}
        </PrintDocument>
      </div>
    </>
  );
}
