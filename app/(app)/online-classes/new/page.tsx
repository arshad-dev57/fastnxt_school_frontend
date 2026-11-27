"use client";

import { CreateOnlineClassForm } from "@/components/online-classes/create-online-class-form";

export default function CreateOnlineClassPage() {
  return (
    <CreateOnlineClassForm successPath="/online-classes" settingsPath="/online-classes/settings" />
  );
}
