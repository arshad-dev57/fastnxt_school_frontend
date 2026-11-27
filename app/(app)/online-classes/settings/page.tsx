"use client";

import { GoogleSettingsPanel } from "@/components/online-classes/google-settings-panel";

export default function OnlineClassesSettingsPage() {
  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-[22px] font-semibold">Google Account Integration</h1>
        <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
          School admins and teachers connect their own Google account here to host Meet classes.
        </p>
      </div>
      <GoogleSettingsPanel returnTo="/online-classes/settings" />
    </div>
  );
}
