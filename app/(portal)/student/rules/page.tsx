"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { describeApiError, rulesApi, type SchoolRuleItem } from "@/lib/auth/api-client";

export default function StudentRulesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SchoolRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await rulesApi.list({ panel: "student" });
      setRows(res.rules ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Rules & Regulations"
        subtitle="School policies published for students by the administration."
      />

      <div className="space-y-3 px-4 pb-24 sm:px-6">
        {error && (
          <p className="rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        )}

        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--theme-text-muted)]">Loading rules…</p>
        )}

        {!loading && rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent-strong)]">
                <ScrollText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{r.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--theme-text-muted)] whitespace-pre-wrap">
                  {r.body}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {!loading && rows.length === 0 && !error && (
          <EmptyState
            Icon={ScrollText}
            title="No rules yet"
            message="When the admin publishes rules for students, they will appear here."
          />
        )}
      </div>
    </div>
  );
}
