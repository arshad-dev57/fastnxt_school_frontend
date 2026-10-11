"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/components/ui";
import { PANELS, panelFromPath } from "@/lib/auth/panels";

/* ===========================================================================
   Panel Switcher — UI prototype for the Admin Panel top header.
   ---------------------------------------------------------------------------
   Lets a signed-in user pick which panel they want to work in.

   SCOPE: pure front-end panel switching — no authentication, permissions, API or
   database. Picking an item routes to that panel's home screen, and the current
   panel is derived from the URL, so a refresh or a directly-typed link keeps the
   trigger in sync with the screen you are on.

   The panel list itself lives in `lib/auth/panels.ts`. To add a
   Parent / Accountant / HR panel later, push one more entry into PANELS.

   DESIGN: the markup is the same popover anatomy the header already uses in
   ThemeSwitcher (backdrop + surface card + `hover:bg-[var(--theme-hover)]` rows +
   `Check` marker), and the trigger reuses the AppShell header chrome classes
   (`ic-btn`, `ic-hover`, `ic-open`). Every colour is a `--theme-*` token, so the
   switcher follows whatever theme is active.
   ========================================================================== */

export default function PanelSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  /* Derived from the URL instead of stored in state, so refreshing the page or
     opening a portal link directly keeps the trigger showing the panel you are
     actually working in. */
  const currentId = panelFromPath(pathname);
  const current = PANELS.find((p) => p.id === currentId) ?? PANELS[0];

  return (
    <div className="relative z-50">
      {/* TRIGGER — same chrome as the header's icon buttons, widened for the label */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Panel: ${current.label}`}
        className={cn(
          "ic-btn flex h-10 max-sm:w-10 max-sm:justify-center max-sm:px-0 items-center gap-2 rounded-md px-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white",
          open && "bg-white/15 text-white"
        )}
      >
        <current.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        <span className="max-sm:hidden whitespace-nowrap text-[14px] font-medium">{current.label}</span>
        <ChevronDown
          className={cn("ic-hover h-4 w-4 shrink-0 transition-transform max-sm:hidden", open && "rotate-180")}
          strokeWidth={1.8}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            role="listbox"
            aria-label="Switch panel"
            className="absolute right-0 top-full z-50 mt-2 w-[284px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-[var(--theme-border)]"
          >
            <div className="border-b border-[var(--theme-border)] px-4 py-3">
              <p className="text-[15px] font-semibold">Switch panel</p>
              <p className="text-[12px] text-[var(--theme-text-muted)]">Choose the panel you want to work in</p>
            </div>

            <div className="p-1.5">
              {PANELS.map((panel) => {
                const active = panel.id === currentId;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setOpen(false);
                      if (panel.id !== currentId) router.push(panel.href);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--theme-hover)]",
                      active && "bg-[var(--theme-active-bg)]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-[var(--theme-primary)] text-white"
                          : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)]"
                      )}
                    >
                      <panel.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[14px]", active && "font-semibold")}>
                        {panel.label}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--theme-text-muted)]">{panel.blurb}</span>
                    </span>

                    {active && <Check className="h-4 w-4 shrink-0 text-[var(--theme-primary)]" />}
                  </button>
                );
              })}
            </div>

            <p className="border-t border-[var(--theme-border)] px-4 py-2.5 text-[12px] text-[var(--theme-text-faint)]">
              Switch panel to use a different workspace
            </p>
          </div>
        </>
      )}
    </div>
  );
}