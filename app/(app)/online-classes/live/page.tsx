"use client";

import { OnlineClassList } from "@/components/online-classes/online-class-list";

export default function LiveOnlineClassesPage() {
  return (
    <OnlineClassList
      title="Live Online Classes"
      subtitle="Sessions currently in progress."
      bucket="live"
      canManage
      showJoin
    />
  );
}
