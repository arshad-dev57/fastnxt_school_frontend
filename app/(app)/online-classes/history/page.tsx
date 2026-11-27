"use client";

import { OnlineClassList } from "@/components/online-classes/online-class-list";

export default function OnlineClassHistoryPage() {
  return (
    <OnlineClassList
      title="Class History"
      subtitle="Completed and cancelled online classes."
      bucket="history"
      canManage
    />
  );
}
