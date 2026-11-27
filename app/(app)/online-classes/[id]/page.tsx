"use client";

import { use } from "react";
import { OnlineClassDetail } from "@/components/online-classes/online-class-detail";

export default function OnlineClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OnlineClassDetail id={id} basePath="/online-classes" canManage showJoin />;
}
