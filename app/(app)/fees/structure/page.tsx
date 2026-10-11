"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Calculator, Layers, Copy, Receipt, CalendarClock, FileText } from "lucide-react";
import {
  Badge, Btn, Card, CardHead, EmptyState, Field, Input, PageHeader, RowMenu, Select, Th, Td, cn, rs,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  describeApiError,
  feesApi,
  type ClassItem,
  type FeeParticularItem,
  type FeeStructureItem,
} from "@/lib/auth/api-client";

const COLS = "grid-cols-[minmax(180px,1.4fr)_130px_130px_130px_64px]";
const FREQUENCIES = ["Monthly", "Quarterly", "Annually", "One-time"];
const SESSIONS = ["2023-2024", "2024-2025", "2025-2026"];

export default function FeeStructurePage() {
  const { currentBranchId } = useBranch();
  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;

  const [session, setSession] = useState("2025-2026");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("A");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [particulars, setParticulars] = useState<FeeParticularItem[]>([]);
  const [rows, setRows] = useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [particularId, setParticularId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const classNames = useMemo(() => classes.map((c) => c.name), [classes]);
  const sections = useMemo(() => {
    const found = classes.find((c) => c.name === cls);
    const secs = Array.isArray(found?.sections) ? found!.sections : ["A", "B", "C"];
    return secs.length ? secs : ["A"];
  }, [classes, cls]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [clsRes, partRes] = await Promise.all([
          classesApi.list({ branchId: branchScope, status: "Active" }),
          feesApi.listParticulars({ status: "Active", branchId: branchScope }),
        ]);
        if (cancelled) return;
        const clsList = clsRes.classes ?? [];
        setClasses(clsList);
        setParticulars(partRes.particulars ?? []);
        setCls((prev) => prev || clsList[0]?.name || "");
        const first = partRes.particulars?.[0];
        if (first) {
          setParticularId((prev) => prev || first.id);
          setAmount((prev) => prev || String(first.amount));
          setFrequency((prev) => prev || first.frequency);
        }
      } catch (err) {
        if (!cancelled) setError(describeApiError(err).message);
      }
    })();
    return () => { cancelled = true; };
  }, [branchScope]);

  const loadStructure = useCallback(async () => {
    if (!cls) { setRows([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await feesApi.listStructure({
        session, cls, section, branchId: branchScope,
      });
      setRows(res.structure ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [session, cls, section, branchScope]);

  useEffect(() => { loadStructure(); }, [loadStructure]);

  useEffect(() => {
    if (sections.length && !sections.includes(section)) setSection(sections[0]);
  }, [sections, section]);

  const monthly = rows.filter((r) => r.frequency === "Monthly").reduce((a, r) => a + r.amount, 0);
  const other = rows.filter((r) => r.frequency !== "Monthly").reduce((a, r) => a + r.amount, 0);
  const total = rows.reduce((a, r) => a + r.amount, 0);

  const onParticular = (id: string) => {
    setParticularId(id);
    const p = particulars.find((x) => x.id === id);
    if (p) { setAmount(String(p.amount)); setFrequency(p.frequency); }
  };

  const addLine = async () => {
    if (!cls || !particularId || !amount) return;
    setSaving(true);
    setError(null);
    try {
      await feesApi.createStructureLine({
        session, cls, section,
        particularId,
        amount: Number(amount),
        frequency,
        dueDate,
        branchId: branchScope ?? null,
      });
      await loadStructure();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const copyToSection = async (target: string) => {
    setSaving(true);
    setError(null);
    try {
      await feesApi.copyStructure({ session, cls, fromSection: section, toSection: target });
      setSection(target);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await feesApi.deleteStructureLine(id);
      await loadStructure();
    } catch (err) {
      setError(describeApiError(err).message);
    }
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
          {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
          <Card pad={false}>
            <CardHead title="Scope" subtitle="Select the class & section to configure" Icon={Layers} />
            <div className="space-y-4 p-4">
              <Field label="Academic Session"><Select options={SESSIONS} value={session} onChange={(e) => setSession(e.target.value)} /></Field>
              <Field label="Class">
                <Select
                  options={classNames.length ? classNames : ["No classes"]}
                  value={cls || "No classes"}
                  onChange={(e) => setCls(e.target.value)}
                  disabled={!classNames.length}
                />
              </Field>
              <Field label="Section"><Select options={sections} value={section} onChange={(e) => setSection(e.target.value)} /></Field>
              <div className="flex flex-wrap gap-2">
                {sections.filter((s) => s !== section).map((s) => (
                  <Btn key={s} size="sm" variant="secondary" Icon={Copy} loading={saving} onClick={() => copyToSection(s)}>Copy to {s}</Btn>
                ))}
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Add fee line" subtitle="Pick a particular and set the amount" Icon={Receipt} />
            <div className="space-y-4 p-4">
              <Field label="Fee Particular">
                <Select
                  options={particulars.map((p) => p.particular)}
                  value={particulars.find((p) => p.id === particularId)?.particular || ""}
                  onChange={(e) => {
                    const p = particulars.find((x) => x.particular === e.target.value);
                    if (p) onParticular(p.id);
                  }}
                  placeholder={particulars.length ? "Select particular" : "Add particulars first"}
                />
              </Field>
              <Field label="Amount (Rs)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <Field label="Frequency"><Select options={FREQUENCIES} value={frequency} onChange={(e) => setFrequency(e.target.value)} /></Field>
              <Field label="Due Date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
              <Btn variant="primary" Icon={Plus} className="w-full" loading={saving} onClick={addLine} disabled={!particularId || !cls}>
                Add to Fee Structure
              </Btn>
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Calc label="Monthly Charges" value={rs(monthly)} Icon={Calculator} tone="blue" />
            <Calc label="Other Charges" value={rs(other)} Icon={CalendarClock} tone="orange" />
            <Calc label="Calculated Total" value={rs(total)} Icon={Calculator} tone="green" />
          </div>

          <Card pad={false}>
            <CardHead title={`Fee structure — ${cls || "—"}-${section}`} subtitle={`${session} · ${rows.length} fee lines`} Icon={Receipt}
              right={<Badge label={`Total ${rs(total)}`} tone="green" />} />

            {loading ? (
              <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading…</p>
            ) : rows.length === 0 ? (
              <EmptyState Icon={Receipt} title="No fee lines" message="Add fee particulars for this class and section." />
            ) : (
              <div className="hidden md:block">
                <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                  <Th className="border-l border-[var(--theme-border)]">Fee Particular</Th>
                  <Th className="border-l border-[var(--theme-border)]">Amount</Th>
                  <Th className="border-l border-[var(--theme-border)]">Frequency</Th>
                  <Th className="border-l border-[var(--theme-border)]">Due Date</Th>
                  <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                </div>
                {rows.map((r) => (
                  <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] hover:bg-[var(--theme-hover)]")}>
                    <Td className="border-l border-[var(--theme-border)] font-medium">{r.particular}</Td>
                    <Td className="border-l border-[var(--theme-border)] font-medium">{rs(r.amount)}</Td>
                    <Td className="border-l border-[var(--theme-border)]"><Badge label={r.frequency} tone="blue" /></Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.dueDate || "—"}</Td>
                    <Td className="justify-center border-l border-[var(--theme-border)]">
                      <RowMenu items={[{ label: "Remove", Icon: Trash2, danger: true, onClick: () => remove(r.id) }]} />
                    </Td>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Calc({ label, value, Icon, tone }: { label: string; value: string; Icon: typeof Calculator; tone: "blue" | "orange" | "green" }) {
  const color = tone === "green" ? "text-[var(--theme-success-text)]" : tone === "orange" ? "text-[var(--theme-warning)]" : "text-[var(--theme-primary)]";
  return (
    <Card>
      <div className="flex items-center gap-2 text-[12px] text-[var(--theme-text-faint)]"><Icon className="h-4 w-4" />{label}</div>
      <p className={cn("mt-1 text-[20px] font-bold", color)}>{value}</p>
    </Card>
  );
}
