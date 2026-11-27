"use client";

import { OnlineClassList } from "@/components/online-classes/online-class-list";

export default function CompletedOnlineClassesPage() {
  return (
    <OnlineClassList
      title="Completed Online Classes"
      subtitle="Finished sessions ready for attendance sync."
      bucket="completed"
      canManage
    />
  );
}
