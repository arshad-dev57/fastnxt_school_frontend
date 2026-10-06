/* ============================================================================
   Theme type definitions — the shape of a BisonsEduCore360 theme.
   Every colour the UI needs lives in `ThemeColors` so there is a single,
   centralized place to edit the whole visual system.
   ========================================================================== */

export type ThemeToken =
  /* structure */
  | "chrome" | "sidebar" | "surface" | "bg" | "subtle" | "neutralHover"
  /* text */
  | "text" | "textMuted" | "textFaint"
  /* lines */
  | "border" | "borderStrong"
  /* interaction */
  | "hover" | "activeBg" | "activeText"
  /* primary (brand) */
  | "primary" | "primaryHover" | "primarySoft" | "primarySoftText"
  /* accent (secondary brand) */
  | "accent" | "accentStrong" | "accentSoft" | "accent2"
  /* semantic */
  | "success" | "successSoft" | "successText"
  | "warning" | "warningSoft" | "warningText"
  | "danger" | "dangerSoft" | "dangerText"
  | "info" | "infoSoft"
  /* misc status */
  | "pending" | "star" | "badge"
  /* loading placeholders */
  | "skeleton" | "skeletonShine";

export type ThemeColors = Record<ThemeToken, string>;

export type Theme = {
  id: string;
  name: string;
  /** informs `color-scheme` + native control rendering */
  scheme: "light" | "dark";
  /** short description shown in the switcher popover */
  description: string;
  /** [chrome, primary] — used for the little preview swatch */
  swatch: [string, string];
  colors: ThemeColors;
};
