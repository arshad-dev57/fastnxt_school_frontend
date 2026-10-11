"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileBadge, FileText, Filter, RefreshCw, Search } from "lucide-react";
import { Avatar, Btn, Card, CardHead, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  describeApiError,
  studentsApi,
  uploadsApi,
  type ClassItem,
  type StudentDocumentRow,
} from "@/lib/auth/api-client";

export default function CertificatesDocumentsPage() {
  const { currentBranchId } = useBranch();
  const [docs, setDocs] = useState<StudentDocumentRow[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const [docsRes, classesRes] = await Promise.all([
        studentsApi.listDocuments({
          branchId: branchScope,
          cls: cls || undefined,
          section: section || undefined,
          q: q.trim() || undefined,
        }),
        classesApi.list({ branchId: branchScope }),
      ]);
      setDocs(docsRes.documents || []);
      setClasses(classesRes.classes || []);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, cls, section, q]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const classNames = useMemo(() => classes.map((c) => c.name).sort(), [classes]);
  const sectionOptions = useMemo(() => {
    if (cls) {
      const found = classes.find((c) => c.name === cls);
      return found?.sections?.length ? found.sections : [];
    }
    const set = new Set<string>();
    classes.forEach((c) => (c.sections || []).forEach((s) => set.add(s)));
    docs.forEach((d) => d.section && set.add(d.section));
    return Array.from(set).sort();
  }, [classes, cls, docs]);

  const grouped = useMemo(() => {
    const map = new Map<string, StudentDocumentRow[]>();
    for (const d of docs) {
      const key = d.cls || "Unassigned";
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return [...map.keys()].sort().map((key) => ({ key, items: map.get(key)! }));
  }, [docs]);

  return (
    <>
      <PageHeader
        title="Certificates & Documents"
        subtitle="All uploaded student documents and certificates across the school — filter by class."
        actions={
          <Btn variant="secondary" Icon={RefreshCw} onClick={() => void load()} disabled={loading}>
            Refresh
          </Btn>
        }
      />

      <div className="space-y-4 px-4 pb-24 pt-4 sm:px-6">
        <Card pad={false}>
          <CardHead title="Filters" subtitle="Search and narrow by class / section" Icon={Filter} />
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-faint)]" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Student, document type…"
                  className="pl-8"
                />
              </div>
            </Field>
            <Field label="Class">
              <Select
                options={["All classes", ...classNames]}
                value={cls || "All classes"}
                onChange={(e) => {
                  const v = e.target.value === "All classes" ? "" : e.target.value;
                  setCls(v);
                  setSection("");
                }}
              />
            </Field>
            <Field label="Section">
              <Select
                options={["All sections", ...sectionOptions]}
                value={section || "All sections"}
                onChange={(e) => setSection(e.target.value === "All sections" ? "" : e.target.value)}
                disabled={!sectionOptions.length && !cls}
              />
            </Field>
            <div className="flex items-end">
              <p className="pb-2 text-[13px] text-[var(--theme-text-muted)]">
                {loading ? "Loading…" : `${docs.length} document${docs.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">{error}</div>
        )}

        {!loading && docs.length === 0 && (
          <EmptyState
            Icon={FileBadge}
            title="No documents yet"
            message="Upload documents when adding or editing a student — they will appear here for every class."
          />
        )}

        {grouped.map((g) => (
          <Card key={g.key} pad={false}>
            <CardHead title={g.key} subtitle={`${g.items.length} document${g.items.length === 1 ? "" : "s"}`} Icon={FileBadge} />
            <div className="divide-y divide-[var(--theme-border)]">
              {g.items.map((d) => (
                <div key={`${d.studentDbId}-${d.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={d.studentName} src={d.photo} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{d.studentName}</p>
                    <p className="truncate text-[12px] text-[var(--theme-text-muted)]">
                      {d.studentId} · {d.cls}-{d.section}
                    </p>
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[14px] font-medium">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--theme-accent-strong)]" />
                      {d.name || d.type}
                    </p>
                    <p className="text-[12px] text-[var(--theme-text-muted)]">Uploaded {d.uploadDate || "—"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {d.url ? (
                      <a
                        href={uploadsApi.downloadHref({
                          url: d.url,
                          publicId: d.publicId,
                          filename: `${d.studentName}-${d.name || d.type || "document"}`.replace(/\s+/g, "_"),
                          resourceType: d.url.includes("/raw/") ? "raw" : d.url.includes("/video/") ? "video" : "image",
                        })}
                        className="inline-flex h-9 items-center gap-1.5 rounded border border-[var(--theme-border)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    ) : null}
                    <Link
                      href={`/students/${d.studentDbId}/edit`}
                      className="inline-flex h-9 items-center rounded px-2 text-[13px] text-[var(--theme-primary-soft-text)] hover:underline"
                    >
                      Edit student
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
