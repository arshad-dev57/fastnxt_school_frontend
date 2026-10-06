"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME, THEME_ORDER, THEME_STORAGE_KEY, cssVarName, themes } from "./themes";
import type { Theme, ThemeColors } from "./theme-types";
import {
  BRAND_DARK_ID, BRAND_LIGHT_ID, buildBrandThemes, clearStoredBrand, loadStoredBrand, saveStoredBrand,
  type StoredBrand,
} from "./brand-theme";

/* ============================================================================
   Global theme source of truth.
   ---------------------------------------------------------------------------
   • The static theme registry (lib/theme/themes.ts) is unchanged and keeps
     working exactly as before.
   • A dynamically generated **Brand Theme** (from the school logo) is layered on
     top: its tokens are applied as inline CSS variables on <html> while active,
     which take precedence over the static stylesheet. Switching back to a
     static theme simply removes them.
   ========================================================================== */

type ThemeContextValue = {
  theme: string;
  setTheme: (id: string) => void;
  themes: Record<string, Theme>;
  order: string[];
  sections: { label: string; ids: string[] }[];
  brand: StoredBrand | null;
  /** resolved token set of the active brand theme (light) — for previews */
  brandTokens: ThemeColors | null;
  setBrand: (brand: StoredBrand, apply?: boolean) => void;
  removeBrand: () => void;
  resetBrand: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isBrandId = (id: string) => id === BRAND_LIGHT_ID || id === BRAND_DARK_ID;

function readSavedTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && (saved in themes || isBrandId(saved))) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<StoredBrand | null>(() => loadStoredBrand());
  const brandThemes = useMemo(() => (brand ? buildBrandThemes(brand) : {}), [brand]);
  const allThemes = useMemo<Record<string, Theme>>(() => ({ ...themes, ...brandThemes }), [brandThemes]);

  const [theme, setThemeState] = useState<string>(readSavedTheme);

  const setTheme = useCallback((id: string) => {
    if (!(id in allThemes)) return;
    setThemeState(id);
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", id);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, [allThemes]);

  /* Apply / clear the brand tokens as inline CSS variables on <html>. */
  useEffect(() => {
    const el = document.documentElement;
    const active = brandThemes[theme];
    if (!active) return;
    const keys = Object.keys(active.colors) as (keyof ThemeColors)[];
    keys.forEach((k) => el.style.setProperty(cssVarName(k), active.colors[k]));
    el.style.colorScheme = active.scheme;
    return () => {
      keys.forEach((k) => el.style.removeProperty(cssVarName(k)));
      el.style.colorScheme = "";
    };
  }, [theme, brandThemes]);

  const setBrand = useCallback((next: StoredBrand, apply = false) => {
    setBrandState(next);
    saveStoredBrand(next);
    if (apply) setTheme(BRAND_LIGHT_ID);
  }, [setTheme]);

  const removeBrand = useCallback(() => {
    clearStoredBrand();
    setBrandState(null);
    setThemeState((current) => {
      if (!isBrandId(current)) return current;
      if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
      } catch {
        /* ignore */
      }
      return DEFAULT_THEME;
    });
  }, []);

  const resetBrand = useCallback(() => {
    setBrandState((current) => {
      if (!current) return current;
      const next: StoredBrand = { ...current, colors: current.detected };
      saveStoredBrand(next);
      return next;
    });
  }, []);

  const sections = useMemo(() => {
    const list: { label: string; ids: string[] }[] = [];
    if (brand) list.push({ label: "My brand", ids: [BRAND_LIGHT_ID, BRAND_DARK_ID] });
    list.push({ label: "Light", ids: THEME_ORDER.filter((id) => themes[id].scheme === "light") });
    list.push({ label: "Dark", ids: THEME_ORDER.filter((id) => themes[id].scheme === "dark") });
    return list;
  }, [brand]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme, setTheme, themes: allThemes, order: [...THEME_ORDER, ...Object.keys(brandThemes)],
    sections, brand, brandTokens: brand ? brandThemes[BRAND_LIGHT_ID].colors : null,
    setBrand, removeBrand, resetBrand,
  }), [theme, setTheme, allThemes, brandThemes, sections, brand, setBrand, removeBrand, resetBrand]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
