"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Plus, Trash2, Users, Filter, ShieldCheck, UserCheck } from "lucide-react";
import { Btn, Field, Input, Modal, PageHeader, Select, StatCard, Textarea } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  employeesApi,
  noticesApi,
  subjectsApi,
  type EmployeeItem,
  type NoticeItem,
} from "@/lib/auth/api-client";
import { teacherClassSections } from "@/lib/portal-data";

const COLORS: Record<string, string> = {
  Draft: "var(--theme-pending)",
  Scheduled: "var(--theme-info)",
  Published: "var(--theme-success)",
  Sent: "var(--theme-success)",
  Failed: "var(--theme-danger)",
};

const CHANNELS = ["App Notice", "SMS + App", "Email", "WhatsApp"];
const TYPES = ["Notice", "Circular", "Announcement", "Alert"];

type FilterSource = "all" | "admin" | "teacher";

export default function TeacherNoticesPage() {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const [rows, setRows] = useState<NoticeItem[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<FilterSource>("all");

  const teacherName = user?.name || "Teacher";

  const isTeacherNotice = useCallback(
    (r: NoticeItem) => {
      if (!r.author) return false;
      return r.author.toLowerCase() === teacherName.toLowerCase() || (user?.id && r.authorId === user.id);
    },
    [teacherName, user?.id]
  );

  const fetchNoticesAndClasses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      // 1. Resolve employee name
      const empRes = await employeesApi.list({ q: user.email, branchId: branchScope }).catch(() => ({ employees: [] }));
      const emps: EmployeeItem[] = empRes.employees ?? [];
      const matched =
        emps.find((e) => e.email?.toLowerCase() === (user.email || "").toLowerCase()) ||
        emps.find((e) => e.name?.toLowerCase() === (user.name || "").toLowerCase()) ||
        (emps.length > 0 ? emps[0] : null);

      const resolvedTeacherName = matched?.name || user.name || "";
      const nameLower = resolvedTeacherName.toLowerCase();

      // 2. Load notices & teacher's classes
      const [noticeRes, clsRes, assignRes] = await Promise.all([
        noticesApi.list({ branchId: currentBranchId }),
        classesApi.list({ branchId: branchScope }).catch(() => ({ classes: [] })),
        subjectsApi.listAssignments({ teacher: resolvedTeacherName, branchId: branchScope }).catch(() => ({ assignments: [] })),
      ]);

      setRows(noticeRes.notices || []);

      // 3. Build teacher class & section options for notice composer
      const myClasses: string[] = [];

      (clsRes.classes || []).forEach((c) => {
        if (nameLower && (c.teacher || "").toLowerCase() === nameLower) {
          const secs = Array.isArray(c.sections) && c.sections.length > 0 ? c.sections : ["A"];
          secs.forEach((s) => {
            const label = `Class ${c.name}-${s}`;
            if (!myClasses.includes(label)) myClasses.push(label);
          });
        }
      });

      (assignRes.assignments || []).forEach((a) => {
        if (a.cls && a.section) {
          const label = `Class ${a.cls}-${a.section}`;
          if (!myClasses.includes(label)) myClasses.push(label);
        }
      });

      if (myClasses.length === 0) {
        teacherClassSections.forEach((ts) => {
          const label = `Class ${ts.label}`;
          if (!myClasses.includes(label)) myClasses.push(label);
        });
      }

      setClassOptions(myClasses);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentBranchId]);

  useEffect(() => {
    fetchNoticesAndClasses();
  }, [fetchNoticesAndClasses]);

  const handleCreateNotice = async (data: {
    title: string;
    content: string;
    audience: string;
    channel: string;
    type: string;
  }) => {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await noticesApi.create({
        title: data.title,
        content: data.content,
        audience: data.audience,
        channel: data.channel,
        type: data.type,
        date: today,
        author: teacherName,
        authorId: user?.id,
        status: "Published",
        branchId: currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined,
      });

      setRows((prev) => [res.notice, ...prev]);
    } catch (err) {
      console.error("Failed to create notice:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await noticesApi.delete(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete notice:", err);
    }
  };

  const adminNoticesCount = useMemo(() => rows.filter((r) => !isTeacherNotice(r)).length, [rows, isTeacherNotice]);
  const teacherNoticesCount = useMemo(() => rows.filter((r) => isTeacherNotice(r)).length, [rows, isTeacherNotice]);

  const filteredRows = useMemo(() => {
    if (sourceFilter === "admin") {
      return rows.filter((r) => !isTeacherNotice(r));
    }
    if (sourceFilter === "teacher") {
      return rows.filter((r) => isTeacherNotice(r));
    }
    return rows;
  }, [rows, sourceFilter, isTeacherNotice]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Notice Board"
        subtitle={`School announcements & class notices for ${teacherName}.`}
        actions={
          <Btn variant="primary" Icon={Plus} onClick={() => setOpen(true)}>
            New Class Notice
          </Btn>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <div className="cursor-pointer" onClick={() => setSourceFilter("all")}>
          <StatCard
            label="Total Notices"
            value={rows.length}
            Icon={Megaphone}
            tone="blue"
            sub="All notice sources"
          />
        </div>
        <div className="cursor-pointer" onClick={() => setSourceFilter("admin")}>
          <StatCard
            label="Admin Circulars"
            value={adminNoticesCount}
            Icon={ShieldCheck}
            tone="purple"
            sub="Click to filter Admin"
          />
        </div>
        <div className="cursor-pointer" onClick={() => setSourceFilter("teacher")}>
          <StatCard
            label="My Class Notices"
            value={teacherNoticesCount}
            Icon={UserCheck}
            tone="green"
            sub="Click to filter Yours"
          />
        </div>
        <StatCard
          label="Est. Reach"
          value={rows.reduce((n, r) => n + (r.reach || 0), 0).toLocaleString()}
          Icon={Users}
          tone="orange"
          sub="Total recipients"
        />
      </div>

      {/* Source Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Notice Source:</span>
        </div>

        <button
          type="button"
          onClick={() => setSourceFilter("all")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            sourceFilter === "all"
              ? "bg-[var(--theme-primary)] text-white shadow-sm font-semibold"
              : "bg-[var(--theme-card)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:bg-[var(--theme-card-subtle)]"
          }`}
        >
          <span>All Notices</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{rows.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceFilter("admin")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            sourceFilter === "admin"
              ? "bg-[var(--theme-primary)] text-white shadow-sm font-semibold"
              : "bg-[var(--theme-card)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:bg-[var(--theme-card-subtle)]"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Admin Notices</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{adminNoticesCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceFilter("teacher")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            sourceFilter === "teacher"
              ? "bg-[var(--theme-primary)] text-white shadow-sm font-semibold"
              : "bg-[var(--theme-card)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:bg-[var(--theme-card-subtle)]"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          <span>My Class Notices</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{teacherNoticesCount}</span>
        </button>
      </div>

      <div className="mt-2">
        <PortalBoard
          title={
            sourceFilter === "admin"
              ? "Admin Notices & Circulars"
              : sourceFilter === "teacher"
              ? "My Class Notices"
              : "All Notices & Announcements"
          }
          subtitle={
            loading
              ? "Loading notice board..."
              : sourceFilter === "admin"
              ? "Official circulars and policies issued by School Administration."
              : sourceFilter === "teacher"
              ? "Notices published by you for your assigned classes."
              : "Viewing all admin circulars and class notices."
          }
          Icon={Megaphone}
          nameLabel="Notice"
          rows={filteredRows}
          keyOf={(r) => r.id}
          nameOf={(r) => r.title}
          subtitleOf={(r) => `${r.type} · To ${r.audience}`}
          searchTextOf={(r) => `${r.title} ${r.audience} ${r.channel} ${r.type} ${r.author ?? ""}`}
          searchPlaceholder="Search notice title, audience, type..."
          scopeLabel="Notice Board"
          countNoun="notices"
          groupBy={(r) => r.status || "Published"}
          groupColorOf={(k) => COLORS[k] ?? "var(--theme-primary)"}
          columns={[
            {
              key: "author",
              label: "Posted By",
              width: "150px",
              cell: (r) =>
                isTeacherNotice(r) ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--theme-success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--theme-success-text)]">
                    <UserCheck className="h-3 w-3" /> By You ({r.author})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--theme-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--theme-primary)]">
                    <ShieldCheck className="h-3 w-3" /> Admin ({r.author || "School"})
                  </span>
                ),
            },
            { key: "audience", label: "Audience", width: "minmax(140px,1fr)", cell: (r) => r.audience },
            { key: "channel", label: "Channel", width: "120px", cell: (r) => r.channel },
            { key: "type", label: "Type", width: "120px", cell: (r) => r.type },
            { key: "date", label: "Date", width: "110px", cell: (r) => r.date },
            { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status || "Published"} /> },
          ]}
          detailFields={(r) => [
            { label: "Title", value: r.title },
            {
              label: "Posted By",
              value: isTeacherNotice(r) ? `Created by You (${r.author})` : `School Administration (${r.author || "School Admin"})`,
            },
            { label: "Audience", value: r.audience },
            { label: "Channel", value: r.channel },
            { label: "Type", value: r.type },
            { label: "Date", value: r.date },
            { label: "Status", value: <StatusPill label={r.status || "Published"} /> },
            { label: "Notice Message", value: r.content || "No detailed body provided." },
          ]}
          menu={(r) =>
            isTeacherNotice(r)
              ? [
                  {
                    label: "Delete Notice",
                    Icon: Trash2,
                    danger: true,
                    onClick: () => handleDeleteNotice(r.id),
                  },
                ]
              : []
          }
          emptyTitle="No notices found"
          emptyMessage={
            sourceFilter === "admin"
              ? "No notices issued by School Administration yet."
              : sourceFilter === "teacher"
              ? "You haven't created any class notices yet. Click 'New Class Notice' to create one."
              : "No notices match your current filters."
          }
          minWidth={900}
        />
      </div>

      <ComposeNoticeModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleCreateNotice}
        saving={saving}
        classOptions={classOptions}
      />
    </div>
  );
}

function ComposeNoticeModal({
  open,
  onClose,
  onSave,
  saving,
  classOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    audience: string;
    channel: string;
    type: string;
  }) => Promise<void>;
  saving: boolean;
  classOptions: string[];
}) {
  const audienceList = useMemo(() => {
    return [...classOptions, "All My Classes", "All Students & Parents"];
  }, [classOptions]);

  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [type, setType] = useState(TYPES[0]);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (audienceList.length > 0 && (!audience || !audienceList.includes(audience))) {
      setAudience(audienceList[0]);
    }
  }, [audienceList, audience]);

  const valid = !!title.trim() && !!audience;

  const save = async () => {
    if (!valid) return;
    await onSave({
      title: title.trim(),
      content: content.trim(),
      audience,
      channel,
      type,
    });
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-xl"
      title="New Notice / Announcement"
      subtitle="Publish an announcement for your class or section"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Publishing…" disabled={!valid}>
            Publish Notice
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Notice Title" className="sm:col-span-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Science Project Submission Deadline"
          />
        </Field>
        <Field label="Target Audience">
          <Select options={audienceList} value={audience} onChange={(e) => setAudience(e.target.value)} />
        </Field>
        <Field label="Channel">
          <Select options={CHANNELS} value={channel} onChange={(e) => setChannel(e.target.value)} />
        </Field>
        <Field label="Notice Type" className="sm:col-span-2">
          <Select options={TYPES} value={type} onChange={(e) => setType(e.target.value)} />
        </Field>
        <Field label="Notice Body / Message" className="sm:col-span-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the full announcement text here..."
          />
        </Field>
      </div>
    </Modal>
  );
}
