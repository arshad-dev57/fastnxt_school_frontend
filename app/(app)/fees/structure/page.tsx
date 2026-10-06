"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Calculator, Layers, Copy, Receipt, CalendarClock, FileText } from "lucide-react";
import {
  Badge, Btn, Card, CardHead, EmptyState, Field, Input, PageHeader, RowMenu, Select, Th, Td, cn, rs,
} from "@/components/ui";
import { FEE_STRUCTURE, FEE_PARTICULARS, CLASS_NAMES, SECTIONS, SESSIONS, FREQUENCIES, type FeeStructureRow } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(180px,1.4fr)_130px_130px_130px_64px]";

export default function FeeStructurePage() {
  const [session, setSession] = useState("2025-2026");
  const [cls, setCls] = useState("Grade 10");
  const [section, setSection] = useState("A");
  const [rows, setRows] = useState<FeeStructureRow[]>(FEE_STRUCTURE);

  const [particular, setParticular] = useState(FEE_PARTICULARS[0].particular);
  const [amount, setAmount] = useState(String(FEE_PARTICULARS[0].amount));
  const [frequency, setFrequency] = useState<string>(FEE_PARTICULARS[0].frequency);
  const [dueDate, setDueDate] = useState("2026-02-10");

  const scoped = useMemo(() => rows.filter((r) => r.cls === cls && r.section === section && r.session === session), [rows, cls, section, session]);
  const monthly = scoped.filter((r) => r.frequency === "Monthly").reduce((a, r) => a + r.amount, 0);
  const other = scoped.filter((r) => r.frequency !== "Monthly").reduce((a, r) => a + r.amount, 0);
  const total = scoped.reduce((a, r) => a + r.amount, 0);

  const onParticular = (name: string) => {
    setParticular(name);
    const p = FEE_PARTICULARS.find((x) => x.particular === name);
    if (p) { setAmount(String(p.amount)); setFrequency(p.frequency); }
  };

  const addLine = () => {
    if (!particular || !amount) return;
    setRows((p) => [...p, {
      id: `FS-${Date.now()}`, session, cls, section, particular,
      amount: Number(amount), frequency: frequency as FeeStructureRow["frequency"], dueDate,
    }]);
  };

  const copyToSection = (target: string) => {
    const cloned = scoped.map((r, i) => ({ ...r, id: `FS-${Date.now()}-${i}`, section: target }));
    setRows((p) => [...p, ...cloned]);
    setSection(target);
  };

  return (
    <>
      <PageHeader 
        title="Fee Structure" 
        subtitle="Configure the fee heads applicable to each class and section."
        actions={
          <Link href="/fees/invoices" className="inline-flex items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)]">
            <FileText className="h-[18px] w-[18px]" /> Fee Invoices
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Scope" subtitle="Select the class & section to configure" Icon={Layers} />
            <div className="space-y-4 p-4">
              <Field label="Academic Session"><Select options={SESSIONS} value={session} onChange={(e) => setSession(e.target.value)} /></Field>
              <Field label="Class"><Select options={CLASS_NAMES} value={cls} onChange={(e) => setCls(e.target.value)} /></Field>
              <Field label="Section"><Select options={SECTIONS} value={section} onChange={(e) => setSection(e.target.value)} /></Field>
              <div className="flex flex-wrap gap-2">
                {SECTIONS.filter((s) => s !== section).map((s) => (
                  <Btn key={s} size="sm" variant="secondary" Icon={Copy} onClick={() => copyToSection(s)}>Copy to {s}</Btn>
                ))}
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Add fee line" subtitle="Pick a particular and set the amount" Icon={Receipt} />
            <div className="space-y-4 p-4">
              <Field label="Fee Particular"><Select options={FEE_PARTICULARS.map((p) => p.particular)} value={particular} onChange={(e) => onParticular(e.target.value)} /></Field>
              <Field label="Amount (Rs)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <Field label="Frequency"><Select options={[...FREQUENCIES]} value={frequency} onChange={(e) => setFrequency(e.target.value)} /></Field>
              <Field label="Due Date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
              <Btn variant="primary" Icon={Plus} className="w-full" onClick={addLine}>Add to Fee Structure</Btn>
            </div>
          </Card>
        </div>

        {/* STRUCTURE */}
        <div className="space-y-5 xl:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Calc label="Monthly Charges" value={rs(monthly)} Icon={Calculator} tone="blue" />
            <Calc label="Other Charges" value={rs(other)} Icon={CalendarClock} tone="orange" />
            <Calc label="Calculated Total" value={rs(total)} Icon={Calculator} tone="green" />
          </div>

          <Card pad={false}>
            <CardHead title={`Fee structure — ${cls}-${section}`} subtitle={`${session} · ${scoped.length} fee lines`} Icon={Receipt}
              right={<Badge label={`Total ${rs(total)}`} tone="green" />} />

            <div className="hidden md:block">
              <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                <Th className="border-l border-[var(--theme-border)]">Fee Particular</Th>
                <Th className="border-l border-[var(--theme-border)]">Amount</Th>
                <Th className="border-l border-[var(--theme-border)]">Frequency</Th>
                <Th className="border-l border-[var(--theme-border)]">Due Date</Th>
                <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
              </div>
              {scoped.map((r) => (
                <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] hover:bg-[var(--theme-hover)]")}>
                  <Td className="border-l border-[var(--theme-border)] font-medium">{r.particular}</Td>
                  <Td className="border-l border-[var(--theme-border)] font-medium">{rs(r.amount)}</Td>
                  <Td className="border-l border-[var(--theme-border)]"><Badge label={r.frequency} tone="blue" /></Td>
                  <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.dueDate}</Td>
                  <Td className="justify-center border-l border-[var(--theme-border)]">
                    <RowMenu items={[{ label: "Remove", Icon: Trash2, danger: true, onClick: () => setRows((p) => p.filter((x) => x.id !== r.id)) }]} />
                  </Td>
                </div>
              ))}
              <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-sidebar)] text-[14px] font-semibold")}>
                <Td className="border-l border-[var(--theme-border)]">Calculated Total</Td>
                <Td className="border-l border-[var(--theme-border)]">{rs(total)}</Td>
                <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">Monthly {rs(monthly)}</Td>
                <Td className="border-l border-[var(--theme-border)]" />
                <Td className="border-l border-[var(--theme-border)]" />
              </div>
            </div>

            <div className="space-y-2 p-3 md:hidden">
              {scoped.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.particular}</p>
                    <p className="text-[12px] text-[var(--theme-text-muted)]">{r.frequency} · Due {r.dueDate}</p>
                  </div>
                  <span className="text-[14px] font-semibold">{rs(r.amount)}</span>
                  <button onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))} className="text-[var(--theme-danger)]" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-[var(--theme-sidebar)] px-3 py-2 text-[14px] font-semibold">
                <span>Calculated Total</span><span>{rs(total)}</span>
              </div>
            </div>

            {scoped.length === 0 && <EmptyState Icon={Receipt} title="No fee lines yet" message="Add fee particulars to build the structure for this class and section." />}
          </Card>
        </div>
      </div>
    </>
  );
}

function Calc({ label, value, Icon, tone }: { label: string; value: string; Icon: React.ElementType; tone: "blue" | "orange" | "green" }) {
  const cls = tone === "blue" ? "bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]" : tone === "orange" ? "bg-[var(--theme-warning-soft)] text-[var(--theme-warning-text)]" : "bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]";
  return (
    <Card>
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", cls)}><Icon className="h-5 w-5" /></span>
      <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">{label}</p>
      <p className="text-[22px] font-bold">{value}</p>
    </Card>
  );
}
