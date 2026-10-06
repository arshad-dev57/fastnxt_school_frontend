"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Filter, Layers, School, BookOpen, Plus, RefreshCw } from "lucide-react";
import { Avatar, Badge, EmptyState, Select, ToolbarBtn, cn } from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, GroupHead,
} from "@/components/board";
import { subjectsApi, type ClassWithSubjectsItem } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

const PALETTE = [
  "var(--theme-info)",
  "var(--theme-accent-2)",
  "var(--theme-success)",
  "#FF158A",
  "var(--theme-warning)",
  "var(--theme-success-text)",
];

const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];

export default function ClassesWithSubjectsPage() {
  const { currentBranchId } = useBranch();
  const [classes, setClasses] = useState<ClassWithSubjectsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [section, setSection] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchClassesWithSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await subjectsApi.listClassesWithSubjects({
        branchId: branchScope,
      });
      setClasses(res.classes || []);
    } catch (err: unknown) {
      console.error("Failed to load classes with subjects:", err);
      setError(err instanceof Error ? err.message : "Failed to load classes with subjects.");
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    fetchClassesWithSubjects();
  }, [fetchClassesWithSubjects]);

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      (c.sections || []).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [classes]);

  const list = useMemo(() => {
    return classes
      .map((c, i) => ({
        ...c,
        color: PALETTE[i % PALETTE.length],
      }))
      .filter((c) => tab === "All" || c.status === tab)
      .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase()))
      .filter((c) => (section ? c.sections.includes(section) : true));
  }, [classes, tab, q, section]);

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={School}
          title="Classes with Subjects"
          subtitle="Overview of curriculum subjects assigned to each grade and section."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchClassesWithSubjects}
                title="Refresh"
                aria-label="Refresh classes"
                className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <Link
                href="/subjects/assign"
                className="flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
              >
                <Plus className="h-[18px] w-[18px]" /> Assign Subjects
              </Link>
            </div>
          }
        />
        <BoardTabs tabs={TABS} value={tab} onChange={setTab} />
        <BoardToolbar>
          <BoardSearch value={q} onChange={setQ} placeholder="Search classes or code" className="ml-0" />
          <div className="shrink-0">
            <Select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              options={["", ...availableSections]}
              placeholder="All Sections"
              className="h-9 w-40"
            />
          </div>
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {error && (
          <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--theme-primary)]" />
            Loading classes and subjects...
          </div>
        )}

        {!loading && list.length === 0 && (
          <EmptyState
            Icon={School}
            title="No classes found"
            message="No classes match your current filters. Add classes or assign subjects to get started."
            action={
              <Link
                href="/subjects/assign"
                className="inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--theme-primary-hover)]"
              >
                <Plus className="h-4 w-4" /> Assign Subjects
              </Link>
            }
          />
        )}

        {!loading && list.length > 0 && (
          <div className="space-y-6">
            {list.map((c) => {
              const open = !collapsed[c.id];
              return (
                <section key={c.id}>
                  <GroupHead
                    title={c.name}
                    color={c.color}
                    count={c.subjects.length}
                    open={open}
                    onToggle={() => setCollapsed((p) => ({ ...p, [c.id]: open }))}
                  />

                  {open && (
                    <div className="overflow-hidden rounded-l border-y border-r border-[var(--theme-border)] bg-[var(--theme-surface)]">
                      <div className="p-3 sm:p-4" style={{ borderLeft: `6px solid ${c.color}` }}>
                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                          <span className="font-mono rounded-full border border-[var(--theme-border)] px-2.5 py-0.5 text-[12px] font-semibold">
                            {c.code}
                          </span>
                          <span>
                            {c.sections.length} {c.sections.length === 1 ? "section" : "sections"} · {c.students} students
                          </span>
                          {c.sections.map((s) => (
                            <Badge key={s} label={`Section ${s}`} tone="gray" />
                          ))}
                          <Badge label={c.status} tone={c.status === "Active" ? "green" : "gray"} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {c.subjects.length === 0 ? (
                            <p className="text-[13px] italic text-[var(--theme-text-muted)]">
                              No subjects assigned yet to this class.
                            </p>
                          ) : (
                            c.subjects.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-2.5 py-1 text-[13px] font-medium"
                              >
                                <BookOpen className="h-3.5 w-3.5 text-[var(--theme-accent-strong)]" /> {s}
                              </span>
                            ))
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                          <Avatar name={c.teacher || "Unassigned"} size={28} />
                          <span>
                            Class teacher:{" "}
                            <span className="font-medium text-[var(--theme-text)]">
                              {c.teacher || "Unassigned"}
                            </span>
                          </span>
                        </div>

                        <div className="mt-3">
                          <Link
                            href={`/subjects/assign?class=${encodeURIComponent(c.name)}`}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--theme-primary)] hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" /> Assign more subjects
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </BoardBody>
    </Board>
  );
}
