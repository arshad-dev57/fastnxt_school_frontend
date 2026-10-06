"use client";

import { useState } from "react";
import { CheckCircle2, ListChecks } from "lucide-react";
import { Card, PageHeader, PillSelect, StatCard } from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_TEACHER, teacherTasks } from "@/lib/portal-data";
import type { TaskRow } from "@/lib/school-mock-data";
import { KanbanBoard, MobileItem } from "@/components/board-views";

/* Teacher Tasks = the Admin /tasks module, own items only. The Admin board uses
   the TaskRow status vocabulary (Not Started / Working on it / Stuck / Done) and
   the same solid status pills, so a teacher updates status inline. */
const COLORS: Record<TaskRow["status"], string> = {
  "Not Started": "var(--theme-pending)",
  "Working on it": "var(--theme-info)",
  "Stuck": "var(--theme-danger)",
  "Done": "var(--theme-success)",
};
const PRIORITY: Record<TaskRow["priority"], string> = {
  High: "var(--theme-danger)", Medium: "var(--theme-warning)", Low: "var(--theme-text-muted)",
};
const STATUSES = Object.keys(COLORS) as TaskRow["status"][];

export default function TeacherTasksPage() {
  const [rows, setRows] = useState<TaskRow[]>(teacherTasks);
  const [q, setQ] = useState("");

  const filtered = rows.filter((t) => `${t.title} ${t.related} ${t.status}`.toLowerCase().includes(q.toLowerCase()));
  const open = filtered.filter((t) => t.status !== "Done");

  const setStatus = (id: string, status: TaskRow["status"]) =>
    setRows((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));

  const columns = STATUSES.map((s) => ({ key: s, label: s, color: COLORS[s], items: filtered.filter((t) => t.status === s) }));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader title="My Tasks" subtitle={`Academic work items assigned to ${PORTAL_TEACHER.name}.`} />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Open Tasks" value={open.length} Icon={ListChecks} tone="red" sub="Not done yet" />
        <StatCard label="In Progress" value={rows.filter((t) => t.status === "Working on it").length} Icon={ListChecks} tone="blue" />
        <StatCard label="Stuck" value={rows.filter((t) => t.status === "Stuck").length} Icon={ListChecks} tone="orange" />
        <StatCard label="Completed" value={rows.filter((t) => t.status === "Done").length} Icon={CheckCircle2} tone="green" />
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-[var(--theme-border)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)] sm:w-72">
          <ListChecks className="h-5 w-5 shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search task"
            className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-[var(--theme-text-faint)]" />
        </div>
      </div>

      {/* DESKTOP — kanban columns, the Admin task-board layout */}
      <div className="mt-3 hidden flex-1 overflow-x-auto px-4 pb-24 sm:px-6 md:block">
        <KanbanBoard
          columns={columns}
          keyOf={(t) => t.id}
          renderCard={(t) => (
            <div className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left shadow-sm">
              <p className="text-[14px] font-medium">{t.title}</p>
              <p className="mt-0.5 text-[12px] text-[var(--theme-text-muted)]">{t.related} · due {t.due}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded px-2 py-0.5 text-[11px] font-medium text-white" style={{ background: PRIORITY[t.priority] }}>{t.priority}</span>
                <PillSelect
                  value={t.status}
                  options={STATUSES}
                  colors={COLORS}
                  onPick={(v) => setStatus(t.id, v)}
                  className="w-32"
                />
              </div>
            </div>
          )}
        />
      </div>

      {/* MOBILE — the shared Admin MobileItem card */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-24 pt-3 sm:px-6 md:hidden">
        {open.map((t) => (
          <MobileItem
            key={t.id}
            name={t.title}
            subtitle={`${t.related} · due ${t.due}`}
            rows={[
              { label: "Priority", value: <span style={{ color: PRIORITY[t.priority] }}>{t.priority}</span> },
              { label: "Status", value: <StatusPill label={t.status} /> },
              { label: "Owner", value: t.owner },
              { label: "Related", value: t.related },
            ]}
          />
        ))}
        {open.length === 0 && (
          <Card>
            <p className="py-6 text-center text-[14px] text-[var(--theme-text-muted)]">Nothing open — all caught up.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
