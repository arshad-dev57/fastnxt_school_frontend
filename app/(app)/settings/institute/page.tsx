"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, Building2, ImagePlus, Sparkles, Globe, Phone, Mail, MapPin, UserCog, CalendarDays, Loader2, HardDrive } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { SESSIONS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";
import { schoolApi, uploadsApi, describeApiError, type SchoolProfile, type SchoolStorageUsage } from "@/lib/auth/api-client";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function InstituteProfilePage() {
  const { signedIn, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [storage, setStorage] = useState<SchoolStorageUsage | null>(null);

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

    Promise.all([
      schoolApi.getProfile(),
      uploadsApi.usage().catch(() => null),
    ])
      .then(([res, usageRes]) => {
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
        if (usageRes?.usage) setStorage(usageRes.usage);
        setLoading(false);
      })
      .catch((err) => {
        setError(describeApiError(err).message);
        setLoading(false);
      });
  }, [signedIn]);

  const refreshStorage = () => {
    uploadsApi.usage()
      .then((res) => setStorage(res.usage))
      .catch(() => {});
  };

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
        logoUrl: f.logoUrl || null,
      });
      setProfile(res.school);
      setF((p) => ({ ...p, logoUrl: res.school.logoUrl || "" }));
      await refresh();
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
        <p className="text-[15px] font-medium">Please sign in to view your management profile.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Management Profile" subtitle="School identity, branding and contact information."
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
            <CardHead title="Logo" subtitle="Shown in the top bar, letters, invoices and ID cards" Icon={ImagePlus} />
            <div className="flex flex-wrap items-center gap-4 p-4">
              {f.logoUrl ? (
                <img src={f.logoUrl} alt="School logo" className="h-20 w-20 rounded-xl border border-[var(--theme-border)] object-contain bg-white p-1" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--theme-accent)] text-[30px] font-extrabold text-white">
                  {f.shortName?.charAt(0).toUpperCase() || f.name?.charAt(0).toUpperCase() || "S"}
                </span>
              )}
              <label className={`flex h-10 cursor-pointer items-center gap-2 rounded border border-dashed border-[var(--theme-border-strong)] px-4 text-[13px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] ${uploadingLogo ? "pointer-events-none opacity-60" : ""}`}>
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploadingLogo ? "Uploading…" : f.logoUrl ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    if (file.size > 8_000_000) {
                      setError("Logo must be under 8 MB.");
                      return;
                    }
                    setUploadingLogo(true);
                    setError(null);
                    try {
                      const res = await schoolApi.uploadLogo(file);
                      setProfile(res.school);
                      set({ logoUrl: res.school.logoUrl || "" });
                      await refresh();
                      refreshStorage();
                    } catch (err) {
                      setError(describeApiError(err).message);
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                />
              </label>
              {f.logoUrl && (
                <button
                  type="button"
                  onClick={() => set({ logoUrl: "" })}
                  className="h-10 rounded border border-[var(--theme-border)] px-3 text-[13px] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
                >
                  Remove
                </button>
              )}
              <p className="text-[12px] text-[var(--theme-text-faint)]">PNG / JPG / WebP · under 8 MB · Cloudinary hosted · recommended 512×512px</p>
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
              {f.logoUrl ? (
                <img src={f.logoUrl} alt="" className="h-16 w-16 rounded-xl border border-[var(--theme-border)] object-contain bg-white p-1" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--theme-accent)] text-[26px] font-extrabold text-white">
                  {f.shortName?.charAt(0).toUpperCase() || f.name?.charAt(0).toUpperCase() || "S"}
                </span>
              )}
              <p className="text-[16px] font-bold">{f.shortName || f.name || "School"}</p>
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
          <Card pad={false}>
            <CardHead title="Cloud storage" subtitle="Files hosted on Cloudinary for this school" Icon={HardDrive} />
            <div className="space-y-3 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Total used</p>
                  <p className="text-[22px] font-bold tabular-nums">{storage ? formatBytes(storage.totalBytes) : "—"}</p>
                </div>
                <p className="text-[13px] text-[var(--theme-text-muted)]">
                  {storage ? `${storage.totalFiles} file${storage.totalFiles === 1 ? "" : "s"}` : "Loading…"}
                </p>
              </div>
              {storage && storage.byPurpose.length > 0 && (
                <div className="space-y-1.5 border-t border-[var(--theme-border)] pt-3">
                  {storage.byPurpose.map((row) => (
                    <div key={row.purpose} className="flex items-center justify-between text-[13px]">
                      <span className="capitalize text-[var(--theme-text-muted)]">{row.purpose.replace(/-/g, " ")}</span>
                      <span className="tabular-nums font-medium">{formatBytes(row.bytes)} · {row.files}</span>
                    </div>
                  ))}
                </div>
              )}
              {storage && storage.byPurpose.length === 0 && (
                <p className="text-[13px] text-[var(--theme-text-muted)]">No uploads recorded yet.</p>
              )}
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
          <p className="text-[15px] font-medium">Management profile updated successfully.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">Changes will reflect across all documents.</p>
        </div>
      </Modal>
    </>
  );
}
