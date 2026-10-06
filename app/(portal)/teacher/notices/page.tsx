"use client";

import { useState } from "react";
import { Megaphone, Plus, Send, Users } from "lucide-react";
import { Btn, Field, Input, Modal, PageHeader, Select, StatCard, Textarea } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { simulateDelay } from "@/components/skeleton";
import { PORTAL_TEACHER, teacherNotices } from "@/lib/portal-data";
import type { NoticeRow } from "@/lib/school-mock-data";

/* Teacher Notices = the Admin /communication module. The Teacher role has
   "create" on communication, so a composer is available; the field set matches
   the Admin NoticeRow exactly (title, audience, channel, type, date, status). */
const COLORS: Record<string, string> = {
  Draft: "var(--theme-pending)", Scheduled: "var(--theme-info)",
  Sent: "var(--theme-success)", Failed: "var(--theme-danger)",
};

const AUDIENCES = ["All Parents", "Students & Parents", "Grade 6–10", "Grade 1–5", "All", "Employees"];
const CHANNELS = ["App", "SMS + App", "Email", "WhatsApp"];
const TYPES = ["Notice", "Circular", "Announcement", "Alert"];

export default function TeacherNoticesPage() {
  const [rows, setRows] = useState<NoticeRow[]>(teacherNotices);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Notices"
        subtitle={`Publish circulars and announcements · ${PORTAL_TEACHER.name}`}
        actions={<Btn variant="primary" Icon={Plus} onClick={() => setOpen(true)}>New Notice</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Total Notices" value={rows.length} Icon={Megaphone} tone="blue" />
        <StatCard label="Sent" value={rows.filter((r) => r.status === "Sent").length} Icon={Megaphone} tone="green" />
        <StatCard label="Scheduled" value={rows.filter((r) => r.status === "Scheduled").length} Icon={Megaphone} tone="orange" />
        <StatCard label="Reach" value={rows.reduce((n, r) => n + r.reach, 0).toLocaleString()} Icon={Users} tone="purple" sub="People notified" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="Communication Hub"
          subtitle="Notices with delivery status and reach."
          Icon={Megaphone}
          nameLabel="Notice"
          rows={rows}
          keyOf={(r) => r.id}
          nameOf={(r) => r.title}
          subtitleOf={(r) => `${r.type} · to ${r.audience}`}
          searchTextOf={(r) => `${r.title} ${r.audience} ${r.channel} ${r.type}`}
          searchPlaceholder="Search notice"
          scopeLabel="My campus"
          countNoun="notices"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k]}
          columns={[
            { key: "audience", label: "Audience", width: "minmax(140px,1fr)", cell: (r) => r.audience },
            { key: "channel", label: "Channel", width: "140px", cell: (r) => r.channel },
            { key: "type", label: "Type", width: "130px", cell: (r) => r.type },
            { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
            { key: "reach", label: "Reach", width: "100px", cell: (r) => r.reach.toLocaleString() },
            { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Title", value: r.title },
            { label: "Audience", value: r.audience },
            { label: "Channel", value: r.channel },
            { label: "Type", value: r.type },
            { label: "Date", value: r.date },
            { label: "Reach", value: r.reach.toLocaleString() },
            { label: "Status", value: <StatusPill label={r.status} /> },
          ]}
          menu={(r) => (r.status !== "Sent" ? [{ label: "Send now", Icon: Send, onClick: () => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: "Sent" } : x))) }] : [])}
          emptyTitle="No notices"
          emptyMessage="Publish your first notice to students and parents."
          minWidth={900}
        />
      </div>

      <ComposeNotice open={open} onClose={() => setOpen(false)} onSave={(row) => setRows((p) => [row, ...p])} />
    </div>
  );
}

/* Composer reuses the Admin NoticeRow field set — no new terminology. */
function ComposeNotice({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (r: NoticeRow) => void }) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [type, setType] = useState(TYPES[0]);
  const [saving, setSaving] = useState(false);
  const valid = !!title.trim();

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    await simulateDelay();
    onSave({
      id: `NT-${Date.now()}`, branchId: "BR-MAIN", title: title.trim(), audience, channel, type,
      date: new Date().toISOString().slice(0, 10), reach: 0, status: "Draft",
    });
    setSaving(false);
    setTitle("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title="New Notice" subtitle="Publish to students, parents or staff"
      footer={<><Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Saving…" disabled={!valid}>Save Draft</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sports Day — Participation Notice" /></Field>
        <Field label="Audience"><Select options={AUDIENCES} value={audience} onChange={(e) => setAudience(e.target.value)} /></Field>
        <Field label="Channel"><Select options={CHANNELS} value={channel} onChange={(e) => setChannel(e.target.value)} /></Field>
        <Field label="Type" className="sm:col-span-2"><Select options={TYPES} value={type} onChange={(e) => setType(e.target.value)} /></Field>
        <Field label="Message" className="sm:col-span-2"><Textarea placeholder="Notice body" /></Field>
      </div>
    </Modal>
  );
}
