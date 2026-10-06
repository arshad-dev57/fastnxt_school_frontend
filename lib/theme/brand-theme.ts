import type { ThemeColors } from "./theme-types";
import { darken, ensureContrast, hexToHsl, hexToRgb, lighten, mixHex, rgbToHex } from "./color-utils";

/* ============================================================================
   Brand Theme — "Company logo → automatic brand theme"
   ---------------------------------------------------------------------------
   Everything happens locally in the browser (canvas + colour maths).
   Nothing is uploaded to any server or third-party service.
   ========================================================================== */

export const BRAND_STORAGE_KEY = "bisonseducore360-brand-theme";
export const BRAND_LIGHT_ID = "brand-light";
export const BRAND_DARK_ID = "brand-dark";

export type BrandColors = { primary: string; accent: string; support: string };

export type StoredBrand = {
  name: string;
  /** small data-URL preview of the uploaded logo (localStorage only) */
  logo: string | null;
  /** swatches detected from the logo */
  palette: string[];
  /** current brand colours (may be manually adjusted) */
  colors: BrandColors;
  /** originally detected colours — used by "Reset to logo colours" */
  detected: BrandColors;
  enabled: boolean;
};

const NEUTRAL_TEXT = "#1F2430";
const SUCCESS_L = "#00C875", SUCCESS_D = "#2ED47A";
const WARNING_L = "#FDAB3D", WARNING_D = "#FFB84D";
const DANGER_L = "#DF2F4A", DANGER_D = "#FF5C75";

const dist = (a: string, b: string) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return Math.sqrt((A.r - B.r) ** 2 + (A.g - B.g) ** 2 + (A.b - B.b) ** 2);
};

const hueDist = (a: string, b: string) => {
  const d = Math.abs(hexToHsl(a).h - hexToHsl(b).h);
  return Math.min(d, 360 - d);
};

/* ------------------------------------------------------------- extraction */

/**
 * Reads the logo **locally** on a small canvas and returns the dominant,
 * meaningful brand colours (near-white / near-black / grey pixels are ignored).
 */
export function extractPaletteFromImage(img: HTMLImageElement, count = 8): string[] {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return []; // tainted / unreadable canvas
  }

  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // transparent
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n++; cur.r += r; cur.g += g; cur.b += b;
    buckets.set(key, cur);
  }

  const scored = [...buckets.values()]
    .map((bucket) => {
      const hex = rgbToHex({ r: bucket.r / bucket.n, g: bucket.g / bucket.n, b: bucket.b / bucket.n });
      const { s, l } = hexToHsl(hex);
      return { hex, score: bucket.n * (0.55 + s), s, l };
    })
    .filter((c) => c.l > 0.06 && c.l < 0.94) // drop near-black / near-white
    .filter((c) => c.s > 0.1) // drop unsaturised greys
    .sort((a, b) => b.score - a.score);

  const out: string[] = [];
  for (const c of scored) {
    if (out.every((h) => dist(h, c.hex) > 46)) out.push(c.hex);
    if (out.length >= count) break;
  }
  return out;
}

/** Chooses primary / accent / support from a detected palette. */
export function pickBrandColors(palette: string[]): BrandColors | null {
  if (palette.length === 0) return null;
  const primary = palette[0];
  const rest = palette.slice(1);
  const accent = rest.length ? [...rest].sort((a, b) => hueDist(b, primary) - hueDist(a, primary))[0] : lighten(primary, 0.35);
  const support = rest.find((c) => c !== accent) ?? mixHex(primary, "#FFFFFF", 0.35);
  return { primary, accent, support };
}

/* ------------------------------------------------------------ generation */

/**
 * Builds the COMPLETE theme token set from the brand colours, with contrast
 * guarantees so text, buttons and nav stay readable — the raw logo colours are
 * never applied blindly.
 */
export function generateBrandTheme(c: BrandColors, scheme: "light" | "dark"): ThemeColors {
  const light = scheme === "light";
  const softOf = (color: string) => (light ? mixHex("#FFFFFF", color, 0.15) : mixHex("#0B0F1A", color, 0.3));
  const textOf = (color: string, soft: string) => ensureContrast(light ? darken(color, 0.3) : lighten(color, 0.34), soft, 4.5);

  // primary tuned for white button text (light) / for dark surfaces (dark)
  const primary = light
    ? ensureContrast(c.primary, "#FFFFFF", 4.3)
    : ensureContrast(lighten(c.primary, 0.32), "#0B0F1A", 3.2);
  const primaryHover = light ? darken(primary, 0.16) : lighten(primary, 0.12);

  const surface = light ? "#FFFFFF" : mixHex("#121826", c.primary, 0.08);
  const bg = light ? mixHex("#FFFFFF", c.primary, 0.05) : mixHex("#0B0F1A", c.primary, 0.12);
  const chrome = light ? ensureContrast(darken(c.primary, 0.62), "#FFFFFF", 5) : mixHex("#080B14", c.primary, 0.12);
  const sidebar = light ? mixHex("#FFFFFF", c.primary, 0.08) : mixHex("#0E1420", c.primary, 0.1);

  const text = light ? NEUTRAL_TEXT : "#E8ECF4";
  const textMuted = light ? mixHex(text, bg, 0.46) : mixHex(text, bg, 0.42);
  const textFaint = light ? mixHex(text, bg, 0.62) : mixHex(text, bg, 0.58);

  const border = light ? mixHex("#FFFFFF", c.primary, 0.2) : mixHex(surface, "#FFFFFF", 0.1);
  const borderStrong = light ? mixHex("#FFFFFF", c.primary, 0.34) : mixHex(surface, "#FFFFFF", 0.2);
  const hover = light ? mixHex("#FFFFFF", c.primary, 0.07) : mixHex(surface, "#FFFFFF", 0.07);

  const primarySoft = softOf(primary);
  const primarySoftText = ensureContrast(light ? primary : lighten(primary, 0.15), primarySoft, 4.5);

  const accent = light ? ensureContrast(c.accent, "#FFFFFF", 3) : lighten(c.accent, 0.18);
  const accentStrong = light ? darken(accent, 0.18) : lighten(accent, 0.32);
  const accentSoft = softOf(accent);
  const accent2 = light ? ensureContrast(c.support, "#FFFFFF", 2.6) : lighten(c.support, 0.16);

  const success = light ? SUCCESS_L : SUCCESS_D;
  const warning = light ? WARNING_L : WARNING_D;
  const danger = light ? DANGER_L : DANGER_D;
  const successSoft = softOf(success), warningSoft = softOf(warning), dangerSoft = softOf(danger);
  const infoSoft = softOf(accent2);

  return {
    chrome, sidebar, surface, bg,
    subtle: light ? mixHex("#FFFFFF", c.primary, 0.14) : mixHex(surface, "#FFFFFF", 0.06),
    neutralHover: light ? mixHex("#FFFFFF", c.primary, 0.24) : mixHex(surface, "#FFFFFF", 0.12),
    text, textMuted, textFaint, border, borderStrong, hover,
    activeBg: primarySoft, activeText: primarySoftText,
    primary, primaryHover, primarySoft, primarySoftText,
    accent, accentStrong, accentSoft, accent2,
    success, successSoft, successText: textOf(success, successSoft),
    warning, warningSoft, warningText: textOf(warning, warningSoft),
    danger, dangerSoft, dangerText: textOf(danger, dangerSoft),
    info: accent2, infoSoft,
    pending: light ? mixHex("#C4C4C4", c.primary, 0.08) : "#5A6274",
    star: "#FFCB00",
    badge: danger,
    skeleton: light ? mixHex("#EDEFF3", c.primary, 0.06) : mixHex(surface, "#FFFFFF", 0.08),
    skeletonShine: light ? mixHex("#F9FAFB", c.primary, 0.03) : mixHex(surface, "#FFFFFF", 0.16),
  };
}

/** Builds the two dynamic Theme objects (Brand Light / Brand Dark). */
export function buildBrandThemes(brand: StoredBrand): Record<string, import("./theme-types").Theme> {
  const mk = (id: string, name: string, scheme: "light" | "dark"): import("./theme-types").Theme => {
    const colors = generateBrandTheme(brand.colors, scheme);
    return {
      id, name, scheme,
      description: scheme === "light" ? "Auto-generated from your school logo" : "Dark brand theme from your logo",
      swatch: [colors.primary, colors.accent],
      colors,
    };
  };
  return {
    [BRAND_LIGHT_ID]: mk(BRAND_LIGHT_ID, `${brand.name} — Light`, "light"),
    [BRAND_DARK_ID]: mk(BRAND_DARK_ID, `${brand.name} — Dark`, "dark"),
  };
}

/* ------------------------------------------------------------- persistence */

export function loadStoredBrand(): StoredBrand | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBrand;
    return parsed && parsed.colors ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredBrand(brand: StoredBrand): void {
  try {
    window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export function clearStoredBrand(): void {
  try {
    window.localStorage.removeItem(BRAND_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Load an image element from a data URL / object URL. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = src;
  });
}

export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
