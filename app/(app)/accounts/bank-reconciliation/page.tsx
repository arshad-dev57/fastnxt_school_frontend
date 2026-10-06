"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, ArrowLeftRight } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, PageHeader, Select, rs } from "@/components/ui";
import { RC, ReportTable, RRow, RTotal, money } from "@/components/report";
import { StatusPill } from "@/components/board-kit";
import { simulateDelay, useInitialLoading } from "@/components/skeleton";
import { BANK_TXNS, CASH_BANK } from "@/lib/accounting-mock-data";

const BANKS = CASH_BANK.filter((a) => a.kind === "Bank").map((a) => a.name);

export default function BankReconciliationPage() {
  const [account, setAccount] = useState(BANKS[0]);
  const [date, setDate] = useState("2026-10-31");
  const [statement, setStatement] = useState("1067250");
  const [book, setBook] = useState("759500");
  const [busy, setBusy] = useState(false);
  const [txns, setTxns] = useState(BANK_TXNS);

  const diff = (Number(statement) || 0) - (Number(book) || 0);
  const unmatched = txns.filter((t) => t.status === "Unmatched").length;

  const start = async () => { setBusy(true); await simulateDelay(); setBusy(false); };
  const markAll = async () => {
    setBusy(true);
    await simulateDelay();
    setTxns((p) => p.map((t) => ({ ...t, status: "Matched" })));
    setBusy(false);
  };

  const loading = useInitialLoading();

  return (
    <>
      <PageHeader title="Bank Reconciliation" subtitle="Match book transactions against the bank statement." />
      <div className="space-y-5 px-4 pb-24 sm:px-6">
        <Card pad={false}>
          <CardHead title="Reconciliation details" subtitle="Select the account and enter balances" Icon={ArrowLeftRight} />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Bank Account"><Select options={BANKS} value={account} onChange={(e) => setAccount(e.target.value)} /></Field>
            <Field label="Statement Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Statement Balance"><Input type="number" value={statement} onChange={(e) => setStatement(e.target.value)} /></Field>
            <Field label="Book Balance"><Input type="number" value={book} onChange={(e) => setBook(e.target.value)} /></Field>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--theme-border)] p-4">
            <Btn variant="primary" Icon={RefreshCw} onClick={start} loading={busy} loadingLabel="Starting…">Start Reconciliation</Btn>
            <Btn variant="secondary" Icon={CheckCircle2} onClick={markAll} loading={busy} disabled={unmatched === 0}>Mark as Matched</Btn>
            <span className="text-[13px] text-[var(--theme-text-muted)]">
              Difference <span className={diff === 0 ? "font-semibold text-[var(--theme-success-text)]" : "font-semibold text-[var(--theme-danger-text)]"}>{rs(diff)}</span>
              {" · "}{unmatched} unmatched
            </span>
          </div>
        </Card>

        <Card pad={false}>
          <CardHead title="Transactions" subtitle="Book vs bank entries" Icon={ArrowLeftRight} />
          {loading ? (
            <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
          ) : (
            <ReportTable minWidth={780} columns={[{ label: "Date" }, { label: "Reference" }, { label: "Description" }, { label: "Book Amount", align: "right" }, { label: "Bank Amount", align: "right" }, { label: "Difference", align: "right" }, { label: "Status" }]}>
              {txns.map((t) => (
                <RRow key={t.id}>
                  <RC muted>{t.date}</RC>
                  <RC muted>{t.reference}</RC>
                  <RC>{t.description}</RC>
                  <RC align="right">{money(t.book)}</RC>
                  <RC align="right">{money(t.bank)}</RC>
                  <RC align="right" danger={t.book !== t.bank}>{money(Math.abs(t.book - t.bank))}</RC>
                  <RC><StatusPill label={t.status} /></RC>
                </RRow>
              ))}
              <RTotal>
                <RC>—</RC><RC>—</RC><RC>Totals</RC>
                <RC align="right">{money(txns.reduce((s, t) => s + t.book, 0))}</RC>
                <RC align="right">{money(txns.reduce((s, t) => s + t.bank, 0))}</RC>
                <RC align="right">—</RC><RC>—</RC>
              </RTotal>
            </ReportTable>
          )}
        </Card>
      </div>
    </>
  );
}
