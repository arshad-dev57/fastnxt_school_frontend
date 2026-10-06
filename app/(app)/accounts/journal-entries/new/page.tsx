"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, PageHeader, Select, Textarea, rs } from "@/components/ui";
import { ACCOUNTS, JOURNAL_LINE_SEED, type JournalLine } from "@/lib/accounting-mock-data";
import { simulateDelay } from "@/components/skeleton";

const ACCOUNT_OPTIONS = ACCOUNTS.map((a) => a.name);
const GRID = "grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_110px_110px_48px]";

export default function NewJournalEntryPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<JournalLine[]>(JOURNAL_LINE_SEED);
  const [busy, setBusy] = useState<null | "draft" | "post">(null);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const difference = totalDebit - totalCredit;

  const patch = (id: string, p: Partial<JournalLine>) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const addLine = () => setLines((p) => [...p, { id: `L${Date.now()}`, account: ACCOUNT_OPTIONS[0], description: "", debit: 0, credit: 0 }]);
  const removeLine = (id: string) => setLines((p) => (p.length > 2 ? p.filter((l) => l.id !== id) : p));
  const submit = async (kind: "draft" | "post") => { setBusy(kind); await simulateDelay(); setBusy(null); };

  return (
    <>
      <PageHeader
        title="New Journal Entry"
        subtitle="Record a balanced double-entry accounting transaction."
        back={<Link href="/accounts/journal-entries" className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]" aria-label="Back"><ChevronLeft className="h-5 w-5" /></Link>}
        actions={
          <>
            <Btn variant="secondary" Icon={Save} onClick={() => submit("draft")} loading={busy === "draft"} loadingLabel="Saving…">Save Draft</Btn>
            <Btn variant="primary" Icon={CheckCircle2} disabled={difference !== 0} onClick={() => submit("post")} loading={busy === "post"} loadingLabel="Posting…">Post Entry</Btn>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <Card pad={false} className="xl:col-span-2">
          <CardHead title="Journal lines" subtitle="Debits and credits must balance" Icon={Plus}
            right={<Btn size="sm" variant="secondary" Icon={Plus} onClick={addLine}>Add line</Btn>} />
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className={`grid ${GRID} border-b border-[var(--theme-border)] px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]`}>
                <span>Account</span><span>Description</span><span className="text-right">Debit</span><span className="text-right">Credit</span><span />
              </div>
              {lines.map((l) => (
                <div key={l.id} className={`grid ${GRID} items-center gap-2 border-b border-[var(--theme-border)] px-3 py-2 last:border-b-0`}>
                  <Select options={ACCOUNT_OPTIONS} value={l.account} onChange={(e) => patch(l.id, { account: e.target.value })} />
                  <Input value={l.description} onChange={(e) => patch(l.id, { description: e.target.value })} placeholder="Line description" />
                  <Input type="number" className="text-right" value={l.debit || ""} onChange={(e) => patch(l.id, { debit: Number(e.target.value) || 0, credit: 0 })} placeholder="0" />
                  <Input type="number" className="text-right" value={l.credit || ""} onChange={(e) => patch(l.id, { credit: Number(e.target.value) || 0, debit: 0 })} placeholder="0" />
                  <button type="button" onClick={() => removeLine(l.id)} aria-label="Remove line"
                    className="flex h-8 w-8 items-center justify-center justify-self-end rounded text-[var(--theme-danger)] hover:bg-[var(--theme-hover)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--theme-border)] p-4">
            <Summary label="Total Debit" value={rs(totalDebit)} />
            <Summary label="Total Credit" value={rs(totalCredit)} />
            <Summary label="Difference" value={rs(difference)} tone={difference === 0 ? "ok" : "bad"} />
          </div>
        </Card>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Entry details" subtitle="Header information" />
            <div className="space-y-4 p-4">
              <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. FEE-231" /></Field>
              <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Monthly Rent" /></Field>
              <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional internal notes" /></Field>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={CheckCircle2} disabled={difference !== 0} onClick={() => submit("post")} loading={busy === "post"} loadingLabel="Posting…">Post Entry</Btn>
            <Btn variant="secondary" Icon={Save} onClick={() => submit("draft")} loading={busy === "draft"} loadingLabel="Saving…">Save Draft</Btn>
            <Link href="/accounts/journal-entries" className="inline-flex h-9 items-center rounded px-3 text-[14px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]">Cancel</Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Summary({ label, value, tone = "plain" }: { label: string; value: string; tone?: "plain" | "ok" | "bad" }) {
  const color = tone === "ok" ? "text-[var(--theme-success-text)]" : tone === "bad" ? "text-[var(--theme-danger-text)]" : "";
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className={`mt-0.5 text-[16px] font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
