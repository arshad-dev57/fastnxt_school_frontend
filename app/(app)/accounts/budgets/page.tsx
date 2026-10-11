"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, ArrowUpDown, Target, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Btn, ConfirmDialog, Field, Input, Modal, Select, type IconType, rs } from "@/components/ui";
import { BoardList, type BoardColumn } from "@/components/board-list";
import { StatusPill, ToolDropdown, statusColor, type BoardView } from "@/components/board-kit";
import { money } from "@/components/report";
import { BoardPageSkeleton } from "@/components/skeleton";
import { accountsApi, type BudgetItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const STATUSES = ["Active", "Inactive", "Completed", "Over Budget"] as const;
const SORTS = ["Budget Name", "Budget Amount", "Remaining"] as const;
const VIEWS = [{ key: "table", label: "Main table" }, { key: "kanban", label: "Kanban" }] as const;

export default function BudgetsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<string>("Budget Name");
  const [view, setView] = useState<BoardView>("table");

  // Create / Edit modal
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: BudgetItem } | null>(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("School Operations");
  const [formYear, setFormYear] = useState("2026-2027");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [actualSpent, setActualSpent] = useState("0");
  const [formSaving, setFormSaving] = useState(false);
  const [toDelete, setToDelete] = useState<BudgetItem | null>(null);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.listBudgets({ branchId: branchScope });
      setRows(res.budgets || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load budgets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [currentBranchId]);

  const years = useMemo(() => [...new Set(rows.map((r) => r.year))], [rows]);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => `${r.name} ${r.department} ${r.year}`.toLowerCase().includes(q.toLowerCase()))
        .filter((r) => (status ? r.status === status : true))
        .filter((r) => (year ? r.year === year : true))
        .sort((a, b) =>
          sort === "Budget Amount"
            ? (b.budget || 0) - (a.budget || 0)
            : sort === "Remaining"
            ? (b.remaining || 0) - (a.remaining || 0)
            : (a.name || "").localeCompare(b.name || "")
        ),
    [rows, q, status, year, sort]
  );

  const groups = useMemo(
    () =>
      STATUSES.map((s) => ({
        key: s,
        label: s,
        color: statusColor(s),
        items: filtered.filter((r) => r.status === s),
      })).filter((g) => g.items.length > 0),
    [filtered]
  );

  const columns: BoardColumn<BudgetItem>[] = [
    {
      key: "year",
      label: "Financial Year",
      width: "130px",
      cell: (r) => <span className="text-[var(--theme-text-muted)]">{r.year}</span>,
    },
    {
      key: "department",
      label: "Department",
      width: "minmax(150px,1fr)",
      cell: (r) => <span className="font-medium">{r.department}</span>,
    },
    {
      key: "budget",
      label: "Budget Amount",
      width: "140px",
      cell: (r) => <span className="tabular-nums font-semibold">{money(r.budget)}</span>,
    },
    {
      key: "actual",
      label: "Actual Spent",
      width: "140px",
      cell: (r) => <span className="tabular-nums">{money(r.actual)}</span>,
    },
    {
      key: "remaining",
      label: "Remaining",
      width: "140px",
      cell: (r) => (
        <span
          className={`tabular-nums font-medium ${
            r.remaining < 0 ? "text-[var(--theme-danger-text)] font-semibold" : "text-[var(--theme-success-text)]"
          }`}
        >
          {money(r.remaining)}
        </span>
      ),
    },
    { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
  ];

  const openAdd = () => {
    setName("");
    setDepartment("School Operations");
    setFormYear("2026-2027");
    setBudgetAmount("");
    setActualSpent("0");
    setModal({ mode: "add" });
  };

  const openEdit = (row: BudgetItem) => {
    setName(row.name);
    setDepartment(row.department);
    setFormYear(row.year);
    setBudgetAmount(String(row.budget));
    setActualSpent(String(row.actual));
    setModal({ mode: "edit", row });
  };

  const handleSaveBudget = async () => {
    if (!name.trim()) {
      alert("Budget name is required.");
      return;
    }
    const val = Number(budgetAmount);
    if (!val || val <= 0) {
      alert("Budget amount must be positive.");
      return;
    }

    setFormSaving(true);
    try {
      if (modal?.mode === "edit" && modal.row) {
        await accountsApi.updateBudget(modal.row.id, {
          name: name.trim(),
          department: department.trim(),
          year: formYear.trim(),
          budget: val,
          actual: Number(actualSpent) || 0,
        });
      } else {
        await accountsApi.createBudget({
          name: name.trim(),
          department: department.trim(),
          year: formYear.trim(),
          budget: val,
          actual: Number(actualSpent) || 0,
          branchId: currentBranchId !== "all" ? currentBranchId : undefined,
        });
      }
      setModal(null);
      await fetchBudgets();
    } catch (e: any) {
      alert(e?.message || "Failed to save budget.");
    } finally {
      setFormSaving(false);
    }
  };

  if (loading && rows.length === 0) return <BoardPageSkeleton rows={5} cols={6} />;

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)] sm:mx-6">
          {error}
        </div>
      )}

      <BoardList<BudgetItem>
        title="Budgets"
        subtitle="Plan and track department budgets and actual expenditure for the school."
        Icon={Target}
        nameLabel="Budget Name"
        primaryAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBudgets}
              className="inline-flex h-9 items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Plus className="ic-plus h-[18px] w-[18px]" />
              <span className="hidden sm:inline">New Budget</span>
            </button>
          </div>
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search budgets"
        views={VIEWS}
        view={view}
        onView={setView}
        groups={groups}
        columns={columns}
        minWidth={1300}
        keyOf={(r) => r.id}
        nameOf={(r) => r.name}
        subtitleOf={(r) => `${r.department} · ${r.year}`}
        menu={(r) => [
          { label: "Edit", Icon: Pencil, onClick: () => openEdit(r) },
          { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
        ]}
        mobileRows={(r) => [
          { label: "Department", value: r.department },
          { label: "Budget", value: money(r.budget) },
          { label: "Actual", value: money(r.actual) },
          { label: "Remaining", value: money(r.remaining) },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No budgets found"
        emptyMessage="Create a new budget to track departmental allocations."
        toolbar={
          <>
            <ToolDropdown
              Icon={Filter}
              label="Status"
              options={STATUSES}
              value={status}
              onChange={setStatus}
              allLabel="All Status"
            />
            {years.length > 0 && (
              <ToolDropdown
                Icon={Filter}
                label="Year"
                options={years}
                value={year}
                onChange={setYear}
                allLabel="All Years"
              />
            )}
            <ToolDropdown
              Icon={ArrowUpDown}
              label="Sort"
              options={SORTS}
              value={sort}
              onChange={(v) => setSort(v || "Budget Name")}
              allLabel="Budget Name"
            />
          </>
        }
      />

      {/* Add / Edit Budget Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Budget" : "New Department Budget"}
        subtitle="Set allocation and fiscal year limits."
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)} disabled={formSaving}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={handleSaveBudget} loading={formSaving} loadingLabel="Saving…">
              {modal?.mode === "edit" ? "Save Changes" : "Create Budget"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Budget Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science Labs & Equipment"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Academic / IT / Transport"
              />
            </Field>
            <Field label="Fiscal Year">
              <Input
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
                placeholder="e.g. 2026-2027"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget Amount (Rs)">
              <Input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Actual Spent (Rs)">
              <Input
                type="number"
                value={actualSpent}
                onChange={(e) => setActualSpent(e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await accountsApi.deleteBudget(toDelete.id);
            await fetchBudgets();
          } catch (e: any) {
            alert(e?.message || "Failed to delete budget.");
          }
        }}
        title="Delete Budget"
        confirmLabel="Delete"
        message={`Delete budget "${toDelete?.name}"?`}
      />
    </>
  );
}
