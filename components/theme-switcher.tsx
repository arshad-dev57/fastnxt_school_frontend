"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, Palette, Sparkles } from "lucide-react";
import { cn } from "@/components/ui";
import { IconButton } from "@/components/icons";
import { useTheme } from "@/lib/theme/theme-provider";
import { BRAND_DARK_ID, BRAND_LIGHT_ID } from "@/lib/theme/brand-theme";
import BrandSetup from "./theme/brand-setup";

/* ============================================================================
   Appearance selector for the top AppShell.
   Keeps every existing theme and adds a dynamically generated "MY BRAND"
   section built from the uploaded school logo. One theme button, one popover.
   ========================================================================== */

export const OPEN_BRAND_SETUP_EVENT = "bisons:open-brand-setup";

export default function ThemeSwitcher() {
  const { theme, setTheme, themes, sections, brand } = useTheme();
  const [open, setOpen] = useState(false);
  const [setup, setSetup] = useState(false);

  /* Let any page (e.g. Settings → Institute) open the brand setup modal. */
  useEffect(() => {
    const handler = () => setSetup(true);
    window.addEventListener(OPEN_BRAND_SETUP_EVENT, handler);
    return () => window.removeEventListener(OPEN_BRAND_SETUP_EVENT, handler);
  }, []);

  return (
    <div className="relative z-50">
      <IconButton Icon={Palette} label="Appearance" ariaExpanded={open} active={open}
        onClick={() => setOpen((v) => !v)} className={open ? "ic-open" : ""} />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[284px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-[var(--theme-border)]">
            <div className="border-b border-[var(--theme-border)] px-4 py-3">
              <p className="text-[15px] font-semibold">Appearance</p>
              <p className="text-[12px] text-[var(--theme-text-muted)]">Choose a theme for the whole app</p>
            </div>

            <div className="max-h-[min(72vh,460px)] overflow-y-auto p-1.5">
              {sections.map((section) => (
                <div key={section.label} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">
                    {section.label}
                  </p>

                  {section.label === "My brand" && !brand && (
                    <div className="rounded-lg border border-dashed border-[var(--theme-border-strong)] px-2.5 py-2.5">
                      <p className="text-[12px] leading-snug text-[var(--theme-text-muted)]">
                        Upload your school logo to create your brand theme.
                      </p>
                      <button type="button" onClick={() => { setOpen(false); setSetup(true); }}
                        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded bg-[var(--theme-primary)] px-2.5 text-[13px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
                        <ImagePlus className="h-4 w-4" /> Create brand theme
                      </button>
                    </div>
                  )}

                  {section.ids.map((id) => {
                    const t = themes[id];
                    const active = id === theme;
                    const isBrand = id === BRAND_LIGHT_ID || id === BRAND_DARK_ID;
                    return (
                      <button key={id} onClick={() => setTheme(id)} title={t.description}
                        className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--theme-hover)]",
                          active && "bg-[var(--theme-hover)]")}>
                        <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-[var(--theme-border)]"
                          style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 0 50%, ${t.swatch[1]} 50% 100%)` }} />
                        <span className={cn("min-w-0 flex-1 truncate text-[14px]", active && "font-medium")}>{t.name}</span>
                        {isBrand && <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--theme-primary)]" />}
                        {active && <Check className="h-4 w-4 shrink-0 text-[var(--theme-primary)]" />}
                      </button>
                    );
                  })}

                  {section.label === "My brand" && brand && (
                    <button type="button" onClick={() => { setOpen(false); setSetup(true); }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-hover)]">
                      <Palette className="h-4 w-4" /> Manage brand theme
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!brand && (
              <button type="button" onClick={() => { setOpen(false); setSetup(true); }}
                className="flex w-full items-center gap-2 border-t border-[var(--theme-border)] px-4 py-2.5 text-left text-[12px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)]">
                <Sparkles className="h-4 w-4" /> Create a brand theme from your logo
              </button>
            )}
          </div>
        </>
      )}

      <BrandSetup open={setup} onClose={() => setSetup(false)} />
    </div>
  );
}
