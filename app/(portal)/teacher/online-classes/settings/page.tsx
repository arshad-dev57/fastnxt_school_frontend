"use client";

import { GoogleSettingsPanel } from "@/components/online-classes/google-settings-panel";

export default function TeacherOnlineClassesSettingsPage() {
  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <h1 className="text-[22px] font-semibold">Google Account</h1>
      <GoogleSettingsPanel returnTo="/teacher/online-classes/settings" />
    </div>
  );
}
