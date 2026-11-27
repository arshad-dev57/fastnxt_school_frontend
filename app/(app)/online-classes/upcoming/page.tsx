"use client";

import { OnlineClassList } from "@/components/online-classes/online-class-list";

export default function UpcomingOnlineClassesPage() {
  return (
    <OnlineClassList
      title="Upcoming Online Classes"
      subtitle="Scheduled sessions that have not started yet."
      bucket="upcoming"
      canManage
    />
  );
}
