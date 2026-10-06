"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

/* ============================================================================
   Chart theming — central CSS-variable tokens
   ---------------------------------------------------------------------------
   Charts reference the theme's CSS variables directly (Recharts passes them
   through to SVG presentation attributes, exactly like shadcn charts). So:
     • colours follow every theme automatically — nothing per-chart
     • server and client render identical values → no hydration drift
     • all tokens live centrally in lib/theme/themes.ts
   ========================================================================== */

export type ChartPalette = {
  primary: string;
  primarySoft: string;
  accent: string;
  accent2: string;
  success: string;
  successText: string;
  warning: string;
  danger: string;
  info: string;
  grid: string;
  axis: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
  series: string[];
};

export const chartPalette: ChartPalette = {
  primary: "var(--theme-primary)",
  primarySoft: "var(--theme-primary-soft)",
  accent: "var(--theme-accent)",
  accent2: "var(--theme-accent-2)",
  success: "var(--theme-success)",
  successText: "var(--theme-success-text)",
  warning: "var(--theme-warning)",
  danger: "var(--theme-danger)",
  info: "var(--theme-info)",
  grid: "var(--theme-border)",
  axis: "var(--theme-border-strong)",
  text: "var(--theme-text)",
  muted: "var(--theme-text-muted)",
  surface: "var(--theme-surface)",
  border: "var(--theme-border)",
  series: [
    "var(--theme-primary)", "var(--theme-accent)", "var(--theme-success)", "var(--theme-warning)",
    "var(--theme-danger)", "var(--theme-info)", "var(--theme-accent-2)", "var(--theme-success-text)",
  ],
};

/** Hook-shaped accessor so chart components read the palette consistently. */
export function useChartTheme(): ChartPalette {
  return chartPalette;
}

/* ---------------------------------------------------------------- motion */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const m = window.matchMedia(REDUCE_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/** `useSyncExternalStore` keeps this SSR-safe with no setState-in-effect. */
export function useChartMotion(): { animate: boolean; duration: number } {
  const reduce = useSyncExternalStore(
    subscribeMotion,
    () => (typeof window === "undefined" ? true : window.matchMedia(REDUCE_QUERY).matches),
    () => true
  );
  return { animate: !reduce, duration: reduce ? 0 : 700 };
}

/* ------------------------------------------------------- shared tooltip UI */
/** Themed style objects for Recharts' built-in tooltip (no hardcoded colours). */
export function tooltipStyles(p: ChartPalette) {
  const content: CSSProperties = {
    background: p.surface,
    border: `1px solid ${p.border}`,
    borderRadius: 10,
    boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
    fontSize: 12,
    padding: "8px 10px",
  };
  return {
    contentStyle: content,
    labelStyle: { color: p.text, fontWeight: 600, marginBottom: 4 } as CSSProperties,
    itemStyle: { color: p.muted, padding: 0 } as CSSProperties,
  };
}

export const AXIS_TICK = (p: ChartPalette) => ({ fill: p.muted, fontSize: 11 });
export const GRID_COLOR = (p: ChartPalette) => p.grid;
