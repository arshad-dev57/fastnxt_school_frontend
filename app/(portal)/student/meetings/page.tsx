"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui";
import { MeetingsBoard } from "@/components/meetings/meetings-board";
import { MeetingNotificationsCard } from "@/components/meetings/meeting-notifications";
import { MEETING_SCOPE_META } from "@/lib/meetings-data";

/* ============================================================================
   Student / My Meetings — read-only. A student sees only the teacher meetings
   they are invited to. No create action: the Student role holds "view" only.
   ========================================================================== */

export default function StudentMeetingsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const meta = MEETING_SCOPE_META.student;

  return (
    <>
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <MeetingsBoard scope="student" openMeetingId={openId} />
        </div>
        <div className="min-w-0">
          <MeetingNotificationsCard scope="student" onOpenMeeting={setOpenId} />
        </div>
      </div>
    </>
  );
}