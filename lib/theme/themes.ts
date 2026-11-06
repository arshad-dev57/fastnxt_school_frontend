import type { Theme, ThemeColors, ThemeToken } from "./theme-types";

/* ============================================================================
   FastNxt — GLOBAL THEME DEFINITIONS  (single source of truth)

   ✏️  Want to change a colour? Do it here (and nowhere else).
       • `BASE`        = the existing Default (light) design — must stay exact.
       • `DARK`        = the dark visual system.
       • `themes.*`    = each theme overrides only the tokens it needs.
   Every token is emitted as a CSS variable (--theme-*) by `buildThemeCss()`
   and consumed across the app as e.g. `bg-[var(--theme-primary)]`.
   ========================================================================== */

export const THEME_STORAGE_KEY = "bisonseducore360-theme";

/* camelCase token → kebab css var suffix (accent2 → accent-2) */
export const cssVarName = (token: string) =>
  `--theme-${token.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([a-zA-Z])(\d)/g, "$1-$2").toLowerCase()}`;

const toVars = (colors: ThemeColors) =>
  (Object.keys(colors) as ThemeToken[]).map((k) => `${cssVarName(k)}:${colors[k]};`).join("");

/* --------------------------------------------------- Default (existing look) */
const BASE: ThemeColors = {
  chrome: "#292F4C",
  sidebar: "#F6F7FB",
  surface: "#FFFFFF",
  bg: "#FFFFFF",
  subtle: "#F0F1F4",
  neutralHover: "#D9DCE3",
  text: "#323338",
  textMuted: "#676879",
  textFaint: "#9699A6",
  border: "#E6E9EF",
  borderStrong: "#C5C7D0",
  hover: "#F5F6F8",
  activeBg: "#DBEAFE",
  activeText: "#1D4ED8",
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primarySoft: "#CCE5FF",
  primarySoftText: "#0060B9",
  accent: "#6C47FF",
  accentStrong: "#5A34D6",
  accentSoft: "#E7DEFF",
  accent2: "#A25DDC",
  success: "#00C875",
  successSoft: "#D6F5E3",
  successText: "#037F4C",
  warning: "#FDAB3D",
  warningSoft: "#FFEBD1",
  warningText: "#B26A00",
  danger: "#DF2F4A",
  dangerSoft: "#FDD9DF",
  dangerText: "#C0233B",
  info: "#579BFC",
  infoSoft: "#EFF6FF",
  pending: "#C4C4C4",
  star: "#FFCB00",
  badge: "#F62B54",
  skeleton: "#EDEFF3",
  skeletonShine: "#F9FAFB",
};

/* ------------------------------------------------------------------ Dark */
const DARK: ThemeColors = {
  chrome: "#161A26",
  sidebar: "#1A1F2E",
  surface: "#1F2533",
  bg: "#171B26",
  subtle: "#232A3A",
  neutralHover: "#2C3446",
  text: "#E7EAF2",
  textMuted: "#A2A9BC",
  textFaint: "#7C8398",
  border: "#2B3243",
  borderStrong: "#3B4359",
  hover: "#262D3D",
  activeBg: "#1E335C",
  activeText: "#9CC2FF",
  primary: "#4C8DFF",
  primaryHover: "#5FA0FF",
  primarySoft: "#1E3355",
  primarySoftText: "#9CC2FF",
  accent: "#8B6BFF",
  accentStrong: "#A98CFF",
  accentSoft: "#2C2450",
  accent2: "#B98BFF",
  success: "#2ED47A",
  successSoft: "#16351F",
  successText: "#59DB95",
  warning: "#FFB84D",
  warningSoft: "#3A2A12",
  warningText: "#FFC978",
  danger: "#FF5C75",
  dangerSoft: "#3A1A21",
  dangerText: "#FF93A4",
  info: "#6FA8FF",
  infoSoft: "#1C2740",
  pending: "#5A6274",
  star: "#FFCB00",
  badge: "#FF3D6A",
  skeleton: "#242B3B",
  skeletonShine: "#343D51",
};

/* ------------------------------------------------- Colour math helpers ----
   Derive the secondary tokens (soft tints, strong text, hovers …) from a small
   "core palette" so every added theme stays coordinated and DRY.            */
type Palette = {
  primary: string; primaryHover: string; accent: string;
  bg: string; surface: string; sidebar: string; chrome: string;
  text: string; textMuted: string; border: string;
  success: string; warning: string; danger: string;
};

const toRgb = (h: string) => {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]) =>
  "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
/** blend hex `a` toward hex `b` by t (0..1) */
const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a), B = toRgb(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

/** Build a full light-theme token set from a compact core palette. */
const light = (p: Palette): ThemeColors => ({
  chrome: p.chrome, sidebar: p.sidebar, surface: p.surface, bg: p.bg,
  subtle: mix(p.surface, p.border, 0.6),
  neutralHover: mix(p.border, "#000000", 0.12),
  text: p.text, textMuted: p.textMuted, textFaint: mix(p.textMuted, "#FFFFFF", 0.35),
  border: p.border, borderStrong: mix(p.border, "#000000", 0.18),
  hover: mix(p.surface, p.border, 0.4),
  activeBg: mix(p.primary, "#FFFFFF", 0.88), activeText: p.primaryHover,
  primary: p.primary, primaryHover: p.primaryHover,
  primarySoft: mix(p.primary, "#FFFFFF", 0.86), primarySoftText: mix(p.primary, "#000000", 0.25),
  accent: p.accent, accentStrong: mix(p.accent, "#000000", 0.2),
  accentSoft: mix(p.accent, "#FFFFFF", 0.86), accent2: p.accent,
  success: p.success, successSoft: mix(p.success, "#FFFFFF", 0.86), successText: mix(p.success, "#000000", 0.3),
  warning: p.warning, warningSoft: mix(p.warning, "#FFFFFF", 0.84), warningText: mix(p.warning, "#000000", 0.35),
  danger: p.danger, dangerSoft: mix(p.danger, "#FFFFFF", 0.88), dangerText: mix(p.danger, "#000000", 0.2),
  info: p.accent, infoSoft: mix(p.accent, "#FFFFFF", 0.87),
  pending: mix(p.textMuted, "#FFFFFF", 0.6),
  star: "#FFCB00", badge: p.danger,
  skeleton: mix(p.surface, p.border, 0.5), skeletonShine: mix(p.surface, p.border, 0.15),
});

/** Build a full dark-theme token set from a compact core palette. */
const dark = (p: Palette): ThemeColors => ({
  chrome: p.chrome, sidebar: p.sidebar, surface: p.surface, bg: p.bg,
  subtle: mix(p.surface, "#FFFFFF", 0.06),
  neutralHover: mix(p.surface, "#FFFFFF", 0.12),
  text: p.text, textMuted: p.textMuted, textFaint: mix(p.textMuted, p.bg, 0.35),
  border: p.border, borderStrong: mix(p.border, "#FFFFFF", 0.12),
  hover: mix(p.surface, "#FFFFFF", 0.07),
  activeBg: mix(p.primary, p.bg, 0.78), activeText: mix(p.primary, "#FFFFFF", 0.25),
  primary: p.primary, primaryHover: p.primaryHover,
  primarySoft: mix(p.primary, p.bg, 0.75), primarySoftText: mix(p.primary, "#FFFFFF", 0.3),
  accent: p.accent, accentStrong: mix(p.accent, "#FFFFFF", 0.2),
  accentSoft: mix(p.accent, p.bg, 0.75), accent2: p.accent,
  success: p.success, successSoft: mix(p.success, p.bg, 0.78), successText: mix(p.success, "#FFFFFF", 0.25),
  warning: p.warning, warningSoft: mix(p.warning, p.bg, 0.78), warningText: mix(p.warning, "#FFFFFF", 0.25),
  danger: p.danger, dangerSoft: mix(p.danger, p.bg, 0.78), dangerText: mix(p.danger, "#FFFFFF", 0.25),
  info: p.accent, infoSoft: mix(p.accent, p.bg, 0.78),
  pending: mix(p.textMuted, p.bg, 0.35),
  star: "#FFCB00", badge: p.danger,
  skeleton: mix(p.surface, "#FFFFFF", 0.08), skeletonShine: mix(p.surface, "#FFFFFF", 0.16),
});

/* ------------------------------------------------------- Blue / Purple / Green / Rose
   Light themes share the Default semantic colours; they only re-map the
   structure + brand tokens so each feels like its own visual identity.       */

const BLUE: Partial<ThemeColors> = {
  chrome: "#0B2447", sidebar: "#EEF4FB", subtle: "#EAF2FB", neutralHover: "#D6E4F5",
  text: "#10233F", textMuted: "#4A6484", textFaint: "#7C93AE",
  border: "#DCE7F3", borderStrong: "#B9CBE0", hover: "#F1F7FD",
  activeBg: "#D6E8FF", activeText: "#1257A8",
  primary: "#0B66D0", primaryHover: "#0A56B0", primarySoft: "#CFE3FF", primarySoftText: "#0A56B0",
  accent: "#2D7FF9", accentStrong: "#1D6FE8", accentSoft: "#D9E9FF", accent2: "#4C93F0",
  info: "#5C9CF5", infoSoft: "#E8F2FF", pending: "#BCC7D6",
};

const PURPLE: Partial<ThemeColors> = {
  chrome: "#2A1B4D", sidebar: "#F6F2FE", subtle: "#F0EAFB", neutralHover: "#E1D6F7",
  text: "#2C2140", textMuted: "#6A5B85", textFaint: "#9385AC",
  border: "#E9E1F6", borderStrong: "#CBBDE6", hover: "#F7F3FD",
  activeBg: "#E7DEFF", activeText: "#5A34D6",
  primary: "#6C47FF", primaryHover: "#5A34D6", primarySoft: "#E7DEFF", primarySoftText: "#5A34D6",
  accent: "#8B5CF6", accentStrong: "#7C3AED", accentSoft: "#EDE4FF", accent2: "#A25DDC",
  info: "#8B7BF0", infoSoft: "#F0EBFF", pending: "#C6BEE0",
};

const GREEN: Partial<ThemeColors> = {
  chrome: "#0F3D2E", sidebar: "#EEF7F1", subtle: "#E9F4ED", neutralHover: "#D3E8DB",
  text: "#16281F", textMuted: "#48675A", textFaint: "#7E9A8D",
  border: "#DCEBE1", borderStrong: "#B8D6C4", hover: "#F1F9F4",
  activeBg: "#D3F0DF", activeText: "#0B8358",
  primary: "#0E9E6A", primaryHover: "#0B8358", primarySoft: "#CFF0DF", primarySoftText: "#0B8358",
  accent: "#12A874", accentStrong: "#0B8358", accentSoft: "#DCF4E7", accent2: "#37B98A",
  success: "#12A870", successSoft: "#D8F3E6", successText: "#0B7A51",
  info: "#35A67E", infoSoft: "#E6F6EF", pending: "#BBD3C6",
};

const ROSE = light({
  primary: "#E11D48", primaryHover: "#BE123C", accent: "#F43F5E",
  bg: "#FFF1F2", surface: "#FFFFFF", sidebar: "#FFE4E6", chrome: "#9F1239",
  text: "#4C0519", textMuted: "#78716C", border: "#FECDD3",
  success: "#16A34A", warning: "#D97706", danger: "#DC2626",
});

/* ------------------------------------------------------------- New themes */
const OCEAN = light({
  primary: "#0284C7", primaryHover: "#0369A1", accent: "#06B6D4",
  bg: "#F0F9FF", surface: "#FFFFFF", sidebar: "#E0F2FE", chrome: "#075985",
  text: "#0C4A6E", textMuted: "#64748B", border: "#BAE6FD",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
});

const INDIGO = light({
  primary: "#4F46E5", primaryHover: "#4338CA", accent: "#6366F1",
  bg: "#F5F7FF", surface: "#FFFFFF", sidebar: "#EEF2FF", chrome: "#3730A3",
  text: "#1E1B4B", textMuted: "#64748B", border: "#C7D2FE",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
});

const VIOLET = light({
  primary: "#7C3AED", primaryHover: "#6D28D9", accent: "#8B5CF6",
  bg: "#FAF5FF", surface: "#FFFFFF", sidebar: "#F3E8FF", chrome: "#581C87",
  text: "#3B0764", textMuted: "#6B7280", border: "#E9D5FF",
  success: "#16A34A", warning: "#D97706", danger: "#DC2626",
});

const EMERALD = light({
  primary: "#059669", primaryHover: "#047857", accent: "#10B981",
  bg: "#F0FDF4", surface: "#FFFFFF", sidebar: "#DCFCE7", chrome: "#065F46",
  text: "#064E3B", textMuted: "#64748B", border: "#A7F3D0",
  success: "#16A34A", warning: "#D97706", danger: "#DC2626",
});

const TEAL = light({
  primary: "#0D9488", primaryHover: "#0F766E", accent: "#14B8A6",
  bg: "#F0FDFA", surface: "#FFFFFF", sidebar: "#CCFBF1", chrome: "#115E59",
  text: "#134E4A", textMuted: "#64748B", border: "#99F6E4",
  success: "#16A34A", warning: "#F59E0B", danger: "#EF4444",
});

const AMBER = light({
  primary: "#D97706", primaryHover: "#B45309", accent: "#F59E0B",
  bg: "#FFFBEB", surface: "#FFFFFF", sidebar: "#FEF3C7", chrome: "#92400E",
  text: "#451A03", textMuted: "#78716C", border: "#FDE68A",
  success: "#16A34A", warning: "#EA580C", danger: "#DC2626",
});

const SLATE = light({
  primary: "#475569", primaryHover: "#334155", accent: "#64748B",
  bg: "#F8FAFC", surface: "#FFFFFF", sidebar: "#F1F5F9", chrome: "#1E293B",
  text: "#0F172A", textMuted: "#64748B", border: "#CBD5E1",
  success: "#16A34A", warning: "#D97706", danger: "#DC2626",
});

const MIDNIGHT = dark({
  primary: "#38BDF8", primaryHover: "#0EA5E9", accent: "#818CF8",
  bg: "#020617", surface: "#0F172A", sidebar: "#111827", chrome: "#020617",
  text: "#F8FAFC", textMuted: "#94A3B8", border: "#1E293B",
  success: "#34D399", warning: "#FBBF24", danger: "#FB7185",
});

const FOREST = dark({
  primary: "#34D399", primaryHover: "#10B981", accent: "#2DD4BF",
  bg: "#052E16", surface: "#064E3B", sidebar: "#022C22", chrome: "#022C22",
  text: "#ECFDF5", textMuted: "#A7F3D0", border: "#065F46",
  success: "#4ADE80", warning: "#FBBF24", danger: "#FB7185",
});

/* ----------------------------------------------------------- Theme registry */
export const themes = {
  /* ---------------------------------------------------------- Light themes */
  default: {
    id: "default", name: "Default", scheme: "light",
    description: "FastNxt signature blue", swatch: [BASE.chrome, BASE.primary],
    colors: { ...BASE },
  },
  blue: {
    id: "blue", name: "Blue", scheme: "light",
    description: "Deep ocean blues", swatch: ["#0B2447", "#0B66D0"],
    colors: { ...BASE, ...BLUE },
  },
  ocean: {
    id: "ocean", name: "Ocean", scheme: "light",
    description: "Clean professional blue & cyan", swatch: [OCEAN.chrome, OCEAN.primary],
    colors: OCEAN,
  },
  indigo: {
    id: "indigo", name: "Indigo", scheme: "light",
    description: "Modern deep indigo", swatch: [INDIGO.chrome, INDIGO.primary],
    colors: INDIGO,
  },
  purple: {
    id: "purple", name: "Purple", scheme: "light",
    description: "Royal violet accents", swatch: ["#2A1B4D", "#6C47FF"],
    colors: { ...BASE, ...PURPLE },
  },
  violet: {
    id: "violet", name: "Violet", scheme: "light",
    description: "Rich violet", swatch: [VIOLET.chrome, VIOLET.primary],
    colors: VIOLET,
  },
  green: {
    id: "green", name: "Green", scheme: "light",
    description: "Fresh emerald tones", swatch: ["#0F3D2E", "#0E9E6A"],
    colors: { ...BASE, ...GREEN },
  },
  emerald: {
    id: "emerald", name: "Emerald", scheme: "light",
    description: "Professional emerald green", swatch: [EMERALD.chrome, EMERALD.primary],
    colors: EMERALD,
  },
  teal: {
    id: "teal", name: "Teal", scheme: "light",
    description: "Fresh modern teal", swatch: [TEAL.chrome, TEAL.primary],
    colors: TEAL,
  },
  amber: {
    id: "amber", name: "Amber", scheme: "light",
    description: "Warm premium amber", swatch: [AMBER.chrome, AMBER.primary],
    colors: AMBER,
  },
  rose: {
    id: "rose", name: "Rose", scheme: "light",
    description: "Modern pink & rose", swatch: [ROSE.chrome, ROSE.primary],
    colors: ROSE,
  },
  slate: {
    id: "slate", name: "Slate", scheme: "light",
    description: "Minimal neutral slate", swatch: [SLATE.chrome, SLATE.primary],
    colors: SLATE,
  },

  /* ----------------------------------------------------------- Dark themes */
  dark: {
    id: "dark", name: "Dark", scheme: "dark",
    description: "Low-light, easy on the eyes", swatch: [DARK.chrome, DARK.primary],
    colors: { ...DARK },
  },
  midnight: {
    id: "midnight", name: "Midnight", scheme: "dark",
    description: "Deep premium dark", swatch: [MIDNIGHT.chrome, MIDNIGHT.primary],
    colors: MIDNIGHT,
  },
  forest: {
    id: "forest", name: "Forest", scheme: "dark",
    description: "Deep natural green", swatch: [FOREST.chrome, FOREST.primary],
    colors: FOREST,
  },
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof themes;

export const DEFAULT_THEME: ThemeId = "default";

export const THEME_ORDER = Object.keys(themes) as ThemeId[];

/* Grouped for the selector UI (light first, then dark) */
export const THEME_SECTIONS = [
  { scheme: "light" as const, label: "Light", ids: THEME_ORDER.filter((id) => themes[id].scheme === "light") },
  { scheme: "dark" as const, label: "Dark", ids: THEME_ORDER.filter((id) => themes[id].scheme === "dark") },
];

/* ------------------------------------------- Generate the global CSS tokens */
export function buildThemeCss(): string {
  const block = (selector: string, theme: Theme) =>
    `${selector}{color-scheme:${theme.scheme};${toVars(theme.colors)}}`;
  const blocks = [block(":root", themes[DEFAULT_THEME] as Theme)];
  for (const id of THEME_ORDER) blocks.push(block(`[data-theme="${id}"]`, themes[id] as Theme));
  return blocks.join("");
}
