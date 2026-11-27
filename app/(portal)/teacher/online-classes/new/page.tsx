"use client";

import { CreateOnlineClassForm } from "@/components/online-classes/create-online-class-form";

export default function TeacherCreateOnlineClassPage() {
  return (
    <CreateOnlineClassForm
      successPath="/teacher/online-classes"
      settingsPath="/teacher/online-classes/settings"
    />
  );
}
