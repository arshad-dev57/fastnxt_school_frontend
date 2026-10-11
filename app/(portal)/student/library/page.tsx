"use client";

import { BookOpen } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { useMyStudent } from "@/lib/hooks/use-my-student";

export default function StudentLibraryPage() {
  const { student, loading, error } = useMyStudent();

  return (
    <>
      <PageHeader
        title="Library"
        subtitle={student ? `Issued books for ${student.name}.` : "Your library issues"}
      />
      <div className="px-4 pb-24 pt-6 sm:px-6">
        {error ? <p className="mb-4 text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
        {loading ? (
          <p className="text-center text-[14px] text-[var(--theme-text-muted)]">Loading…</p>
        ) : (
          <EmptyState
            Icon={BookOpen}
            title="No books issued"
            message="Library issue records will appear here once the school library module is connected for students."
          />
        )}
      </div>
    </>
  );
}
