"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { MeetingsBoard } from "@/components/meetings/meetings-board";
import { MeetingNotificationsCard } from "@/components/meetings/meeting-notifications";
import { MEETING_SCOPE_META } from "@/lib/meetings-data";

/* ============================================================================
   Teacher / My Meetings — the teacher flow: meet your own students (class
   sessions, doubt clearing, exam reviews) and see meetings the Admin scheduled
   with you as an invited teacher.
   ========================================================================== */

export default function TeacherMeetingsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const meta = MEETING_SCOPE_META.teacher;

  return (
    <>
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Link href="/teacher/meetings/new"
            className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
            <Plus className="ic-plus h-[18px] w-[18px]" /> New Meeting
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <MeetingsBoard scope="teacher" canCreate onCreateHref="/teacher/meetings/new" openMeetingId={openId} />
        </div>
        <div className="min-w-0">
          <MeetingNotificationsCard scope="teacher" onOpenMeeting={setOpenId} />
        </div>
      </div>
    </>
  );
}