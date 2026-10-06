"use client";

import { type MouseEvent } from "react";
import { LoaderCircle, CircleCheck } from "lucide-react";
import { cn, Tooltip, type IconType } from "./ui";

/* ============================================================================
   Premium icon primitives
   Subtle, theme-aware micro-interactions only. All motion is defined in
   globals.css and is automatically disabled for `prefers-reduced-motion`.
   ========================================================================== */

/** Icon-only button for the dark AppShell chrome (header / rail).
    - accessible label + themed tooltip
    - optional active state, badge and one-shot feedback animations */
export function IconButton({ Icon, label, onClick, active, badge, spin, shake, shakeKey, tooltipSide = "bottom", className = "", ariaExpanded }: {
  Icon: IconType; label: string; onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  active?: boolean; badge?: number | string; spin?: boolean; shake?: boolean; shakeKey?: string | number;
  tooltipSide?: "bottom" | "left"; className?: string; ariaExpanded?: boolean;
}) {
  return (
    <span className={cn("group/ic relative inline-flex", className)}>
      <button type="button" onClick={onClick} aria-label={label} aria-expanded={ariaExpanded}
        className={cn("ic-btn relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white",
          active && "bg-white/15 text-white")}>
        <Icon key={shake ? shakeKey : undefined} strokeWidth={1.8}
          className={cn("h-[22px] w-[22px] ic-hover", spin && "animate-spin", shake && "icon-shake")} />
        {badge !== undefined && badge !== "" && badge !== 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--theme-badge)] px-1 text-[10px] font-bold text-white">{badge}</span>
        )}
      </button>
      <Tooltip label={label} side={tooltipSide} />
    </span>
  );
}

/** Spinner shown while an action is in flight (theme-primary). */
export function LoadingIcon({ className = "", size = 20 }: { className?: string; size?: number }) {
  return <LoaderCircle aria-hidden="true" className={cn("animate-spin text-[var(--theme-primary)]", className)} style={{ width: size, height: size }} />;
}

/** Success confirmation icon with a small pop animation. Colour comes from the
    surrounding context (theme token) so it stays theme-aware. */
export function SuccessIcon({ className = "", size = 28 }: { className?: string; size?: number }) {
  return <CircleCheck aria-hidden="true" className={cn("icon-pop", className)} style={{ width: size, height: size }} />;
}
