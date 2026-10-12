"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, SlidersHorizontal, TrendingUp, TrendingDown, Coins, RefreshCw, LoaderCircle } from "lucide-react";
import { Badge, Btn, Card, CardHead, PageHeader, SearchBox, Select, StatCard, cn, rs } from "@/components/ui";
import { downloadBrandedPdf } from "@/lib/pdf-export";
import { accountsApi, type AccountStatementResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function AccountStatementPage() {
  const { currentBranchId } = useBranch();
  const [data, setData] = useState<AccountStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getStatement({
        from: from || undefined,
        to: to || undefined,
        type: type || undefined,
        q: q || undefined,
        branchId: branchScope,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load statement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [type, from, to, currentBranchId]);

  const rows = data?.rows || [];
  const totalIn = data?.totalIncome || 0;
  const totalOut = data?.totalExpense || 0;
  const net = data?.net || 0;

  const periodLabel = `${from || "Inception"} — ${to || "Current"}`;

  const exportCsv = () => {
    if (rows.length === 0) return;
    const header = "Date,Reference,Description,Category,Income,Expense,Running Balance\n";
    const body = rows
      .map(
        (r) =>
          `"${r.date}","${r.ref}","${r.description.replace(/"/g, '""')}","${r.category}",${r.income},${r.expense},${r.balance}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `account-statement-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPdf = async () => {
    if (rows.length === 0) {
      alert("No transactions to export.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadBrandedPdf({
        reportTitle: "Account Statement",
        subtitle: `Period: ${periodLabel} · Net ${rs(net)}`,
        sections: [
          {
            title: "Summary",
            head: ["Metric", "Amount"],
            body: [
              ["Total Income", rs(totalIn)],
              ["Total Expenses", rs(totalOut)],
              ["Net Balance", rs(net)],
            ],
          },
          {
            title: "Transactions",
            head: ["Date", "Ref", "Description", "Category", "Income", "Expense", "Balance"],
            body: rows.map((r) => [
              r.date,
              r.ref,
              r.description,
              r.category,
              r.income > 0 ? rs(r.income) : "—",
              r.expense > 0 ? rs(r.expense) : "—",
              rs(r.balance),
            ]),
          },
        ],
        filename: `account-statement-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Account Statement"
          subtitle="Ledger of all income and expense transactions with running balance."
          actions={
            <>
              <button
                type="button"
                onClick={fetchStatement}
                className="inline-flex items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 py-2 text-[14px] hover:bg-[var(--theme-hover)]"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
              </button>
              <Btn variant="secondary" Icon={Download} onClick={exportCsv} className="hidden sm:inline-flex">
                Export
              </Btn>
              <Btn
                variant="primary"
                Icon={pdfBusy ? LoaderCircle : FileDown}
                onClick={exportPdf}
                disabled={pdfBusy || rows.length === 0}
                className="hidden sm:inline-flex"
              >
                {pdfBusy ? "Preparing…" : "PDF"}
              </Btn>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:px-6 sm:grid-cols-3">
          <StatCard label="Total Income" value={rs(totalIn)} Icon={TrendingUp} tone="green" />
          <StatCard label="Total Expenses" value={rs(totalOut)} Icon={TrendingDown} tone="red" />
          <StatCard
            label="Net Balance"
            value={rs(net)}
            Icon={Coins}
            tone={net >= 0 ? "blue" : "red"}
            sub={net >= 0 ? "Net Surplus" : "Net Deficit"}
          />
        </div>

        <div className="px-4 sm:px-6">
          <Card pad={false} className="mt-4">
            <CardHead title="Filters" subtitle="Narrow down the statement by query, type or date" Icon={SlidersHorizontal} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex gap-2">
                <SearchBox value={q} onChange={setQ} placeholder="Search description, ref" />
                <button
                  type="button"
                  onClick={fetchStatement}
                  className="rounded border border-[var(--theme-border-strong)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
                >
                  Search
                </button>
              </div>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={["Income", "Expense"]}
                placeholder="All Types"
              />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]"
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 pb-24 pt-4 sm:px-6">
        {error && (
          <div className="no-print mb-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
            {error}
          </div>
        )}

        <Card pad={false}>
          <CardHead
            title="Transactions"
            subtitle={`${rows.length} posted entries · Period ${periodLabel}`}
            Icon={Coins}
            right={<Badge label={`Net ${rs(net)}`} tone={net >= 0 ? "green" : "red"} />}
          />
          {loading ? (
            <p className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">Loading transactions…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-[14px] text-[var(--theme-text-muted)]">
              No transactions match the selected criteria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="report-table w-full min-w-[760px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-sidebar)] text-left text-[12px] uppercase tracking-wide text-[var(--theme-text-muted)]">
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Ref</th>
                    <th className="px-3 py-2.5 font-semibold">Description</th>
                    <th className="px-3 py-2.5 font-semibold">Category</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Income</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Expense</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {rows.map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--theme-hover)]">
                      <td className="px-3 py-2 text-[var(--theme-text-muted)]">{t.date}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{t.ref}</td>
                      <td className="px-3 py-2 font-medium">{t.description}</td>
                      <td className="px-3 py-2 text-[var(--theme-text-muted)]">{t.category}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--theme-success-text)]">
                        {t.income > 0 ? rs(t.income) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--theme-danger-text)]">
                        {t.expense > 0 ? rs(t.expense) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{rs(t.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
