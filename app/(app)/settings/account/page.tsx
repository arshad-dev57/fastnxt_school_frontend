"use client";

import { useState } from "react";
import { Save, CheckCircle2, UserCog, KeyRound, Bell, ShieldCheck, Globe, Mail, Phone, Building2 } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea, Toggle } from "@/components/ui";

export default function AccountSettingsPage() {
  const [f, setF] = useState({
    name: "Amara Reyes",
    email: "amara.reyes@bisons.edu",
    phone: "0320-1112223",
    role: "Principal",
    department: "Administration",
    bio: "Leading the school with a focus on academic excellence and student development.",
    timezone: "Asia/Karachi (PKT)",
    language: "English",
    notifications: true,
    twoFactor: false,
  });
  const [saved, setSaved] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  return (
    <>
      <PageHeader title="Account Settings" subtitle="Manage your profile, security and preferences."
        actions={<Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Changes</Btn>} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card pad={false}>
            <CardHead title="Profile information" subtitle="Your personal details and contact info" Icon={UserCog} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="Full Name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
              <Field label="Phone"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
              <Field label="Role"><Input value={f.role} disabled /></Field>
              <Field label="Department"><Input value={f.department} disabled /></Field>
              <Field label="Bio" className="sm:col-span-2"><Textarea value={f.bio} onChange={(e) => set({ bio: e.target.value })} rows={3} /></Field>
            </div>
          </Card>

          <Card pad={false}>
            <CardHead title="Security" subtitle="Password and authentication settings" Icon={ShieldCheck} />
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between rounded-lg border border-[#E6E9EF] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><KeyRound className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[15px] font-medium">Password</p>
                    <p className="text-[12px] text-[#676879]">Last changed 30 days ago</p>
                  </div>
                </div>
                <Btn variant="secondary" onClick={() => setPasswordModal(true)}>Change</Btn>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#E6E9EF] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><ShieldCheck className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[15px] font-medium">Two-factor authentication</p>
                    <p className="text-[12px] text-[#676879]">Add an extra layer of security</p>
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
              <div className="flex items-center justify-between sm:col-span-2 rounded-lg border border-[#E6E9EF] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><Bell className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[15px] font-medium">Email notifications</p>
                    <p className="text-[12px] text-[#676879]">Receive updates via email</p>
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
            <div className="flex flex-col items-center gap-3 border-b border-[#E6E9EF] p-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6C47FF] text-[20px] font-extrabold text-white">AR</span>
              <p className="text-[16px] font-bold">{f.name}</p>
              <p className="text-[13px] text-[#676879]">{f.role}</p>
            </div>
            <div className="space-y-2.5 p-4 text-[13px] text-[#676879]">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {f.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {f.phone}</p>
              <p className="flex items-center gap-2"><Building2 className="h-4 w-4 shrink-0" /> {f.department}</p>
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> {f.timezone}</p>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Changes</Btn>
          </div>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Settings saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">Account settings updated successfully.</p>
          <p className="text-[13px] text-[#676879]">Your preferences have been saved.</p>
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
        {newPassword && confirm && newPassword !== confirm && <p className="text-[12px] text-[#DF2F4A]">Passwords do not match</p>}
      </div>
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#D6F5E3] p-3 text-[#037F4C]">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-[13px] font-medium">Password changed successfully</p>
        </div>
      )}
    </Modal>
  );
}
