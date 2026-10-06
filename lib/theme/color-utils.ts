/* ============================================================================
   Colour utilities for the Brand Theme feature (pure, dependency-free).
   All colour maths runs locally in the browser — nothing is uploaded.
   ========================================================================== */

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export const hexToRgb = (hex: string): RGB => {
  const s = hex.replace("#", "").trim();
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(full || "000000", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const rgbToHex = ({ r, g, b }: RGB): string =>
  "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase();

export const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    h *= 60;
  }
  return { h, s, l };
};

export const hslToRgb = ({ h, s, l }: HSL): RGB => {
  const H = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const k = (t: number) => {
    const T = ((t % 1) + 1) % 1;
    if (T < 1 / 6) return p + (q - p) * 6 * T;
    if (T < 1 / 2) return q;
    if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
    return p;
  };
  return { r: k(H + 1 / 3) * 255, g: k(H) * 255, b: k(H - 1 / 3) * 255 };
};

export const hexToHsl = (hex: string): HSL => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: HSL): string => rgbToHex(hslToRgb(hsl));

/** Perceptual-ish luminance (WCAG). */
export const luminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** WCAG contrast ratio between two colours (1 → 21). */
export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

export const mixHex = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t });
};

export const lighten = (hex: string, amount: number) => mixHex(hex, "#FFFFFF", clamp(amount));
export const darken = (hex: string, amount: number) => mixHex(hex, "#000000", clamp(amount));

/** Adjust lightness and/or saturation of a colour. */
export const adjust = (hex: string, opts: { l?: number; s?: number; h?: number }): string => {
  const hsl = hexToHsl(hex);
  return hslToHex({
    h: opts.h ?? hsl.h,
    s: opts.s !== undefined ? clamp(opts.s) : hsl.s,
    l: opts.l !== undefined ? clamp(opts.l) : hsl.l,
  });
};

/**
 * Nudge `fg` (toward black or white) until it reaches `min` contrast on `bg`.
 * Guarantees readable text/buttons on any brand colour.
 */
export const ensureContrast = (fg: string, bg: string, min = 4.5): string => {
  if (contrastRatio(fg, bg) >= min) return fg;
  const towardDark = luminance(bg) > 0.35;
  let out = fg;
  for (let i = 1; i <= 20; i++) {
    out = mixHex(fg, towardDark ? "#0B0F1A" : "#FFFFFF", i / 20);
    if (contrastRatio(out, bg) >= min) return out;
  }
  return towardDark ? "#0B0F1A" : "#FFFFFF";
};

/** Pick black or white text depending on which reads better on `bg`. */
export const readableOn = (bg: string, light = "#FFFFFF", dark = "#0B0F1A"): string =>
  contrastRatio(bg, light) >= contrastRatio(bg, dark) ? light : dark;
