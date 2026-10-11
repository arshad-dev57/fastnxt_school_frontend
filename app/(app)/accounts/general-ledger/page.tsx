"use client";

import { useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { rs } from "@/components/ui";
import { RC, ReportCard, ReportPage, ReportTable, RRow, RTotal, money } from "@/components/report";
import { TablePageSkeleton } from "@/components/skeleton";
import { accountsApi, type AccountItem, type GeneralLedgerResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function GeneralLedgerPage() {
  const { currentBranchId } = useBranch();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ledgerData, setLedgerData] = useState<GeneralLedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch available accounts
  useEffect(() => {
    accountsApi
      .listAccounts({ status: "Active" })
      .then((res) => {
        const list = res.accounts || [];
        setAccounts(list);
        if (list.length > 0 && !selectedAccountId) {
          setSelectedAccountId(list[0].id);
        }
      })
      .catch((e) => setError(e?.message || "Failed to load accounts."));
  }, []);

  // 2. Fetch general ledger for selected account
  const fetchLedger = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getGeneralLedger({
        accountId: selectedAccountId,
        from: from || undefined,
        to: to || undefined,
        branchId: branchScope,
      });
      setLedgerData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load general ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchLedger();
    }
  }, [selectedAccountId, from, to, currentBranchId]);

  const accountObj = ledgerData?.account || accounts.find((a) => a.id === selectedAccountId);
  const rows = ledgerData?.rows || [];
  const opening = ledgerData?.opening || 0;
  const totalDebit = ledgerData?.totalDebit || 0;
  const totalCredit = ledgerData?.totalCredit || 0;
  const closing = ledgerData?.closing || 0;

  return (
    <ReportPage
      title="General Ledger"
      subtitle="Account-wise transaction ledger with running balance."
      Icon={BookOpen}
      filters={
        <>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">Select Account</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--theme-primary)]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">Date From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">Date To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <button
            type="button"
            onClick={fetchLedger}
            className="inline-flex h-9 self-end items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
          {error}
        </div>
      )}

      {loading && !ledgerData ? (
        <TablePageSkeleton rows={8} cols={6} />
      ) : (
        <ReportCard
          title={accountObj ? `${accountObj.code} · ${accountObj.name} (${accountObj.type})` : "General Ledger"}
          subtitle={`${from ? `From ${from}` : "Start of records"} — ${to ? `To ${to}` : "Present"}`}
        >
          <ReportTable
            columns={[
              { label: "Date" },
              { label: "Reference" },
              { label: "Description" },
              { label: "Debit", align: "right" },
              { label: "Credit", align: "right" },
              { label: "Balance", align: "right" },
            ]}
          >
            <RRow>
              <RC muted>{from || "—"}</RC>
              <RC muted>—</RC>
              <RC muted className="font-medium">Opening Balance</RC>
              <RC align="right" muted>—</RC>
              <RC align="right" muted>—</RC>
              <RC align="right" className="font-semibold">{rs(opening)}</RC>
            </RRow>

            {rows.length === 0 ? (
              <RRow>
                <RC colSpan={6} className="text-center text-[var(--theme-text-muted)] py-6">
                  No posted transactions for this account in the selected period.
                </RC>
              </RRow>
            ) : (
              rows.map((l, idx) => (
                <RRow key={`${l.date}-${l.reference}-${idx}`}>
                  <RC muted>{l.date ? l.date.slice(0, 10) : "—"}</RC>
                  <RC muted>{l.reference || "—"}</RC>
                  <RC>{l.description}</RC>
                  <RC align="right">{l.debit ? money(l.debit) : "—"}</RC>
                  <RC align="right">{l.credit ? money(l.credit) : "—"}</RC>
                  <RC align="right" className="font-semibold tabular-nums">{rs(l.balance)}</RC>
                </RRow>
              ))
            )}

            <RTotal>
              <RC>—</RC>
              <RC>—</RC>
              <RC>Total Movement & Closing</RC>
              <RC align="right">{money(totalDebit)}</RC>
              <RC align="right">{money(totalCredit)}</RC>
              <RC align="right" className="text-[var(--theme-primary)] font-bold">{rs(closing)}</RC>
            </RTotal>
          </ReportTable>
        </ReportCard>
      )}
    </ReportPage>
  );
}
