"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, Building2, ImagePlus, Sparkles, Globe, Phone, Mail, MapPin, UserCog, CalendarDays, Loader2 } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { SESSIONS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";
import { schoolApi, describeApiError, type SchoolProfile } from "@/lib/auth/api-client";

export default function InstituteProfilePage() {
  const { signedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  const [f, setF] = useState({
    name: "", shortName: "", address: "", phone: "",
    email: "", website: "", instituteNo: "",
    principal: "", academicSession: "", logoUrl: "", motto: "",
  });
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  // Fetch profile on mount
  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }

    schoolApi.getProfile()
      .then((res) => {
        setProfile(res.school);
        setF({
          name: res.school.name,
          shortName: res.school.shortName,
          address: res.school.address || "",
          phone: res.school.phone,
          email: res.school.email,
          website: res.school.website || "",
          instituteNo: res.school.instituteNo || "",
          principal: res.school.principal || "",
          academicSession: res.school.academicSession || "",
          logoUrl: res.school.logoUrl || "",
          motto: res.school.motto || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(describeApiError(err).message);
        setLoading(false);
      });
  }, [signedIn]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    try {
      const res = await schoolApi.updateProfile({
        name: f.name,
        shortName: f.shortName,
        address: f.address,
        phone: f.phone,
        email: f.email,
        website: f.website,
        instituteNo: f.instituteNo,
        principal: f.principal,
        academicSession: f.academicSession,
        motto: f.motto,
      });
      setProfile(res.school);
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

  if (!signedIn) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4 text-center">
        <Building2 className="h-16 w-16 text-[var(--theme-text-muted)]" />
        <p className="text-[15px] font-medium">Please sign in to view your institute profile.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Institute Profile" subtitle="School identity, branding and contact information."
        actions={
          <Btn variant="primary" Icon={Save} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Btn>
        } />

      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[var(--theme-danger-soft)] bg-[var(--theme-danger-soft)] p-3 text-[13px] text-[var(--theme-danger-text)] sm:mx-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card pad={false}>
            <CardHead title="Basic information" subtitle="Official name and registration" Icon={Building2} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="School Name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Short Name"><Input value={f.shortName} onChange={(e) => set({ shortName: e.target.value })} /></Field>
              <Field label="Institute Number"><Input value={f.instituteNo} onChange={(e) => set({ instituteNo: e.target.value })} /></Field>
              <Field label="Motto / Tagline" className="sm:col-span-2"><Input value={f.motto} onChange={(e) => set({ motto: e.target.value })} /></Field>
              <Field label="Principal"><Input value={f.principal} onChange={(e) => set({ principal: e.target.value })} /></Field>
              <Field label="Academic Session"><Select options={SESSIONS} value={f.academicSession} onChange={(e) => set({ academicSession: e.target.value })} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Contact details" subtitle="How parents and staff reach the school" Icon={MapPin} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="Address" className="sm:col-span-2"><Textarea value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
              <Field label="Phone"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
              <Field label="Website" className="sm:col-span-2"><Input value={f.website} onChange={(e) => set({ website: e.target.value })} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Logo" subtitle="Used across letters, invoices and ID cards" Icon={ImagePlus} />
            <div className="flex flex-wrap items-center gap-4 p-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--theme-accent)] text-[30px] font-extrabold text-white">
                {f.shortName?.charAt(0).toUpperCase() || "B"}
              </span>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded border border-dashed border-[var(--theme-border-strong)] px-4 text-[13px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]">
                <ImagePlus className="h-4 w-4" /> {f.logoUrl ? f.logoUrl : "Upload logo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => set({ logoUrl: e.target.files?.[0]?.name ?? "" })} />
              </label>
              <p className="text-[12px] text-[var(--theme-text-faint)]">PNG or SVG · recommended 512×512px</p>
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("bisons:open-brand-setup"))}
                className="inline-flex h-10 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[13px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
                <Sparkles className="h-4 w-4" /> Create brand theme from logo
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Preview" Icon={Building2} />
            <div className="flex flex-col items-center gap-2 border-b border-[var(--theme-border)] p-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--theme-accent)] text-[26px] font-extrabold text-white">
                {f.shortName?.charAt(0).toUpperCase() || "B"}
              </span>
              <p className="text-[16px] font-bold">{f.shortName || "School"}</p>
              <p className="text-[12px] text-[var(--theme-text-muted)]">{f.motto}</p>
            </div>
            <div className="space-y-2.5 p-4 text-[13px] text-[var(--theme-text-muted)]">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> {f.address}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {f.phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {f.email}</p>
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> {f.website}</p>
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /> Session {f.academicSession}</p>
              <p className="flex items-center gap-2"><UserCog className="h-4 w-4 shrink-0" /> {f.principal}</p>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Btn>
          </div>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Profile saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">Institute profile updated successfully.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">Changes will reflect across all documents.</p>
        </div>
      </Modal>
    </>
  );
}
