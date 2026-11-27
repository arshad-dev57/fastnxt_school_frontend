"use client";

import Link from "next/link";
import { OnlineClassList } from "@/components/online-classes/online-class-list";

export default function TeacherOnlineClassesPage() {
  return (
    <>
      <div className="flex justify-end gap-2 px-4 pt-4 sm:px-6">
        <Link href="/teacher/online-classes/settings" className="text-[13px] underline">
          Google Account
        </Link>
      </div>
      <OnlineClassList
        title="Online Classes"
        subtitle="Create Google Meet sessions for your sections and sync attendance after class."
        basePath="/teacher/online-classes"
        canManage
        showJoin
      />
    </>
  );
}
