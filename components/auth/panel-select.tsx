"use client";

import { cn } from "@/components/ui";
import { PANELS, type PanelId } from "@/lib/auth/panels";

/* ============================================================================
   Login panel selector — Admin / Teacher / Student.
   ---------------------------------------------------------------------------
   Front-end selection only. The chosen panel decides which dashboard the user
   lands on after signing in (see app/(auth)/login/page.tsx).
   ========================================================================== */

export default function PanelSelect({ value, onChange, disabled }: {
  value: PanelId;
  onChange: (id: PanelId) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Choose a panel" className="grid grid-cols-3 gap-2">
      {PANELS.map((panel) => {
        const active = panel.id === value;
        return (
          <button
            key={panel.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={panel.label}
            disabled={disabled}
            onClick={() => onChange(panel.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors disabled:opacity-60",
              active
                ? "border-[var(--theme-primary)] bg-[var(--theme-primary-soft)]"
                : "border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-hover)]"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                active ? "bg-[var(--theme-primary)] text-white" : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]"
              )}
            >
              <panel.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            <span className={cn("text-[13px] font-medium", active ? "text-[var(--theme-primary-hover)]" : "text-[var(--theme-text)]")}>
              {panel.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
