"use client";

import { useEffect, useState } from "react";
import { Loader2, ReceiptText, Save } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { FeeVoucherDocument, sampleFeeInvoice } from "@/components/fees/fee-voucher";
import {
  DEFAULT_FEE_VOUCHER_TEMPLATE,
  describeApiError,
  feesApi,
  type FeeVoucherSchoolInfo,
  type FeeVoucherTemplate,
} from "@/lib/auth/api-client";

export default function FeeVoucherSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [school, setSchool] = useState<FeeVoucherSchoolInfo | null>(null);
  const [form, setForm] = useState<FeeVoucherTemplate>(DEFAULT_FEE_VOUCHER_TEMPLATE);

  const set = (patch: Partial<FeeVoucherTemplate>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  useEffect(() => {
    feesApi
      .getVoucherTemplate()
      .then((res) => {
        setForm({ ...DEFAULT_FEE_VOUCHER_TEMPLATE, ...res.template });
        setSchool(res.school);
      })
      .catch((err) => setError(describeApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await feesApi.updateVoucherTemplate(form);
      setForm({ ...DEFAULT_FEE_VOUCHER_TEMPLATE, ...res.template });
      setSchool(res.school);
      setSaved(true);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--theme-text-muted)]" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Fee Voucher Layout"
        subtitle="Challan / demand voucher layout (Bank, Student, School copies). Paid fee receipts use a separate receipt layout with A4 / 80mm / 58mm paper options at print time."
        actions={
          <Btn variant="primary" Icon={Save} loading={saving} loadingLabel="Saving…" onClick={save}>
            {saved ? "Saved" : "Save Layout"}
          </Btn>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 lg:grid-cols-2 lg:px-6">
        <div className="space-y-4">
          {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}

          <Card pad={false}>
            <CardHead title="Header & titles" Icon={ReceiptText} />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Field label="Voucher title" className="sm:col-span-2">
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </Field>
              <Field label="Header note" className="sm:col-span-2">
                <Input value={form.headerNote} onChange={(e) => set({ headerNote: e.target.value })} placeholder="Optional line under school name" />
              </Field>
              <Field label="Accent color">
                <Input type="color" value={form.accentColor || "#1e3a8a"} onChange={(e) => set({ accentColor: e.target.value })} />
              </Field>
              <Field label="Footer note" className="sm:col-span-2">
                <Textarea rows={2} value={form.footerNote} onChange={(e) => set({ footerNote: e.target.value })} />
              </Field>
              <Field label="Instructions" className="sm:col-span-2">
                <Textarea rows={2} value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Copy labels (3 vouchers)" />
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <Field label="Bank copy"><Input value={form.copyBank} onChange={(e) => set({ copyBank: e.target.value })} /></Field>
              <Field label="Student copy"><Input value={form.copyStudent} onChange={(e) => set({ copyStudent: e.target.value })} /></Field>
              <Field label="School copy"><Input value={form.copySchool} onChange={(e) => set({ copySchool: e.target.value })} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Bank details" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Field label="Bank name"><Input value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} /></Field>
              <Field label="Branch"><Input value={form.bankBranch} onChange={(e) => set({ bankBranch: e.target.value })} /></Field>
              <Field label="Account title"><Input value={form.bankAccountTitle} onChange={(e) => set({ bankAccountTitle: e.target.value })} /></Field>
              <Field label="Account number"><Input value={form.bankAccountNo} onChange={(e) => set({ bankAccountNo: e.target.value })} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Signatures" />
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <Field label="Left"><Input value={form.signatureLeft} onChange={(e) => set({ signatureLeft: e.target.value })} /></Field>
              <Field label="Center"><Input value={form.signatureCenter} onChange={(e) => set({ signatureCenter: e.target.value })} /></Field>
              <Field label="Right"><Input value={form.signatureRight} onChange={(e) => set({ signatureRight: e.target.value })} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Show / hide" />
            <div className="grid grid-cols-2 gap-2 p-4 text-[13px] sm:grid-cols-3">
              {(
                [
                  ["showLogo", "Logo"],
                  ["showAddress", "Address"],
                  ["showPhone", "Phone"],
                  ["showEmail", "Email"],
                  ["showWebsite", "Website"],
                  ["showDiscount", "Discount"],
                  ["showPaidBalance", "Paid / Balance"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded border border-[var(--theme-border)] px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--theme-primary)]"
                    checked={Boolean(form[key])}
                    onChange={(e) => set({ [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card pad={false}>
            <CardHead title="Live preview" subtitle="Sample invoice · Bank copy shown here; print shows all 3" />
            <div className="max-h-[80vh] overflow-auto bg-neutral-100 p-3">
              <FeeVoucherDocument
                invoice={sampleFeeInvoice()}
                template={form}
                school={school}
                previewSingle
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
