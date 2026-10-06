"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import CreateMeetingWizard from "@/components/meetings/create-meeting-wizard";

/* ============================================================================
   Teacher / My Meetings / New — the same wizard, scoped to the teacher flow so
   the participant step lists only the teacher's own students.
   ========================================================================== */

export default function NewTeacherMeetingPage() {
  return (
    <>
      <PageHeader
        title="Schedule a Meeting"
        subtitle="Invite your students, pick a slot and share the join link or venue."
        back={
          <Link href="/teacher/meetings" aria-label="Back to meetings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-hover)]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
      />
      <CreateMeetingWizard scope="teacher" baseHref="/teacher/meetings" />
    </>
  );
}