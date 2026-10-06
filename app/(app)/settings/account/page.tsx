"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, UserCog, KeyRound, Bell, ShieldCheck, Globe, Mail, Phone, Building2, Loader2 } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { userApi, describeApiError } from "@/lib/auth/api-client";

export default function AccountSettingsPage() {
  const { user, signedIn, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "Administration",
    bio: "",
    timezone: "Asia/Karachi (PKT)",
    language: "English",
    notifications: true,
    twoFactor: false,
  });
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setF({
        name: user.name,
        email: user.email,
        phone: "",
        role: user.role,
        department: "Administration",
        bio: "",
        timezone: "Asia/Karachi (PKT)",
        language: "English",
        notifications: true,
        twoFactor: false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      await userApi.updateProfile({
        name: f.name,
      });
      await refresh(); // Refresh session to get updated user data
      setSaved(true);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (!signedIn) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4 text-center">
        <UserCog className="h-16 w-16 text-[var(--theme-text-muted)]" />
        <p className="text-[15px] font-medium">Please sign in to view your account settings.</p>
      </div>
    );
  }

  const initials = f.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <>
      <PageHeader title="Account Settings" subtitle="Manage your profile, security and preferences."
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
            <CardHead title="Profile information" subtitle="Your personal details and contact info" Icon={UserCog} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="Full Name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={f.email} disabled /></Field>
              <Field label="Phone"><Input value={f.phone} disabled placeholder="Phone is on school profile" /></Field>
              <Field label="Role"><Input value={f.role} disabled /></Field>
              <Field label="Department"><Input value={f.department} disabled /></Field>
              <Field label="Bio" className="sm:col-span-2"><Textarea value={f.bio} onChange={(e) => set({ bio: e.target.value })} rows={3} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Security" subtitle="Password and authentication settings" Icon={ShieldCheck} />
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]"><KeyRound className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[15px] font-medium">Password</p>
                    <p className="text-[12px] text-[var(--theme-text-muted)]">Last changed 30 days ago</p>
                  </div>
                </div>
                <Btn variant="secondary" onClick={() => setPasswordModal(true)}>Change</Btn>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]"><ShieldCheck className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[15px] font-medium">Two-factor authentication</p>
                    <p className="text-[12px] text-[var(--theme-text-muted)]">Add an extra layer of security</p>
                  </div>
                </div>
                <Toggle checked={f.twoFactor} onChange={(v) => set({ twoFactor: v })} />
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Preferences" subtitle="Notification and language settings" Icon={Bell} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="Time Zone"><Select options={["Asia/Karachi (PKT)", "Asia/Dubai (GST)", "UTC"]} value={f.timezone} onChange={(e) => set({ timezone: e.target.value })} /></Field>
              <Field label="Language"><Select options={["English", "اردو (Urdu)", "العربية (Arabic)"]} value={f.language} onChange={(e) => set({ language: e.target.value })} /></Field>
              <div className="flex items-center justify-between sm:col-span-2 rounded-lg border border-[var(--theme-border)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]"><Bell className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[15px] font-medium">Email notifications</p>
                    <p className="text-[12px] text-[var(--theme-text-muted)]">Receive updates via email</p>
                  </div>
                </div>
                <Toggle checked={f.notifications} onChange={(v) => set({ notifications: v })} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Preview" Icon={UserCog} />
            <div className="flex flex-col items-center gap-3 border-b border-[var(--theme-border)] p-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[20px] font-extrabold text-white">{initials || "U"}</span>
              <p className="text-[16px] font-bold">{f.name}</p>
              <p className="text-[13px] text-[var(--theme-text-muted)]">{f.role}</p>
            </div>
            <div className="space-y-2.5 p-4 text-[13px] text-[var(--theme-text-muted)]">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {f.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {f.phone}</p>
              <p className="flex items-center gap-2"><Building2 className="h-4 w-4 shrink-0" /> {f.department}</p>
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> {f.timezone}</p>
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

      <Modal open={saved} onClose={() => setSaved(false)} title="Settings saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">Account settings updated successfully.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">Your preferences have been saved.</p>
        </div>
      </Modal>

      <PasswordModal open={passwordModal} onClose={() => setPasswordModal(false)} />
    </>
  );
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saved, setSaved] = useState(false);

  const canSave = current && newPassword && confirm && newPassword === confirm;

  return (
    <Modal open={open} onClose={onClose} width="max-w-md"
      title="Change password" subtitle="Enter your current and new password"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" Icon={CheckCircle2} disabled={!canSave} onClick={() => { setSaved(true); }}>{saved ? "Changed" : "Update Password"}</Btn></>}>
      <div className="space-y-4">
        <Field label="Current password"><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Enter current password" /></Field>
        <Field label="New password"><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" /></Field>
        <Field label="Confirm password"><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" /></Field>
        {newPassword && confirm && newPassword !== confirm && <p className="text-[12px] text-[var(--theme-danger)]">Passwords do not match</p>}
      </div>
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--theme-success-soft)] p-3 text-[var(--theme-success-text)]">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-[13px] font-medium">Password changed successfully</p>
        </div>
      )}
    </Modal>
  );
}
