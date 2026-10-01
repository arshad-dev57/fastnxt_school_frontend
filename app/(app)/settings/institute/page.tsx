"use client";

import { useState } from "react";
import { Save, CheckCircle2, Building2, ImagePlus, Globe, Phone, Mail, MapPin, UserCog, CalendarDays } from "lucide-react";
import { Btn, Card, CardHead, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { SESSIONS, SCHOOL } from "@/lib/mock-data";

export default function InstituteProfilePage() {
  const [f, setF] = useState({
    name: SCHOOL.name, shortName: SCHOOL.shortName, address: SCHOOL.address, phone: SCHOOL.phone,
    email: SCHOOL.email, website: SCHOOL.website, instituteNo: SCHOOL.instituteNo,
    principal: SCHOOL.principal, session: SCHOOL.session, logo: "", motto: "Knowledge · Discipline · Excellence",
  });
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  return (
    <>
      <PageHeader title="Institute Profile" subtitle="School identity, branding and contact information."
        actions={<Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Changes</Btn>} />

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
              <Field label="Academic Session"><Select options={SESSIONS} value={f.session} onChange={(e) => set({ session: e.target.value })} /></Field>
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
              <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#6C47FF] text-[30px] font-extrabold text-white">B</span>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded border border-dashed border-[#C5C7D0] px-4 text-[13px] text-[#676879] hover:bg-[#F5F6F8]">
                <ImagePlus className="h-4 w-4" /> {f.logo ? f.logo : "Upload logo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => set({ logo: e.target.files?.[0]?.name ?? "" })} />
              </label>
              <p className="text-[12px] text-[#9699A6]">PNG or SVG · recommended 512×512px</p>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Preview" Icon={Building2} />
            <div className="flex flex-col items-center gap-2 border-b border-[#E6E9EF] p-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#6C47FF] text-[26px] font-extrabold text-white">B</span>
              <p className="text-[16px] font-bold">{f.shortName || "School"}</p>
              <p className="text-[12px] text-[#676879]">{f.motto}</p>
            </div>
            <div className="space-y-2.5 p-4 text-[13px] text-[#676879]">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> {f.address}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {f.phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {f.email}</p>
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> {f.website}</p>
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /> Session {f.session}</p>
              <p className="flex items-center gap-2"><UserCog className="h-4 w-4 shrink-0" /> {f.principal}</p>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={Save} onClick={() => setSaved(true)}>Save Changes</Btn>
          </div>
        </div>
      </div>

      <Modal open={saved} onClose={() => setSaved(false)} title="Profile saved" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setSaved(false)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6F5E3] text-[#037F4C]"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="text-[15px] font-medium">Institute profile updated successfully.</p>
          <p className="text-[13px] text-[#676879]">Changes will reflect across all documents.</p>
        </div>
      </Modal>
    </>
  );
}
