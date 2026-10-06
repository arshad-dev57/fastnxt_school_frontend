"use client";

/* The logo preview is a local data-URL (never a remote asset), so a plain
   <img> is intentional here. */
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { Btn, Modal } from "@/components/ui";
import { LoadingIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme/theme-provider";
import {
  ACCEPTED_LOGO_TYPES, extractPaletteFromImage, generateBrandTheme, loadImage, pickBrandColors,
  type StoredBrand,
} from "@/lib/theme/brand-theme";

/* "Create your brand theme from the school logo" — fully local (canvas). */

/** Downscale locally to a small data URL so the preview fits in localStorage. */
async function downscale(file: File, max = 160): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function BrandSetup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { brand, setBrand, resetBrand } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [logo, setLogo] = useState<string | null>(brand?.logo ?? null);
  const [name, setName] = useState(brand?.name ?? "School Brand");
  const [palette, setPalette] = useState<string[]>(brand?.palette ?? []);
  const [colors, setColors] = useState(brand?.colors ?? null);
  const [detected, setDetected] = useState(brand?.detected ?? null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [message, setMessage] = useState("");

  const analyze = async (src: string, fileName?: string) => {
    setStatus("analyzing");
    setMessage("");
    try {
      const img = await loadImage(src);
      const found = extractPaletteFromImage(img);
      const picked = pickBrandColors(found);
      if (!picked) {
        setStatus("error");
        setMessage("Couldn’t automatically detect brand colors. Pick your primary and accent colors below.");
        setColors({ primary: "#2563EB", accent: "#F59E0B", support: "#A25DDC" });
        setDetected(null);
        return;
      }
      setPalette(found);
      setColors(picked);
      setDetected(picked);
      if (fileName) setName(fileName.replace(/\.[^.]+$/, ""));
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Couldn’t read that image. Try a PNG, JPG or WEBP file.");
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setStatus("error");
      setMessage("Unsupported file type — please use PNG, JPG or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setMessage("That image is larger than 5 MB. Please use a smaller file.");
      return;
    }
    const dataUrl = await downscale(file);
    setLogo(dataUrl);
    await analyze(dataUrl, file.name);
  };

  const removeLogo = () => {
    setLogo(null); setPalette([]); setColors(null); setDetected(null); setStatus("idle"); setMessage("");
  };

  const apply = () => {
    if (!colors) return;
    const next: StoredBrand = { name: name || "School Brand", logo, palette, colors, detected: detected ?? colors, enabled: true };
    setBrand(next, true);
    onClose();
  };

  const tokens = colors ? generateBrandTheme(colors, "light") : null;

  return (
    <Modal open={open} onClose={onClose} width="max-w-2xl" title="Brand theme from logo"
      subtitle="We read your logo locally in the browser — nothing is uploaded."
      footer={
        <>
          {brand && <Btn variant="secondary" Icon={RefreshCw} onClick={() => { resetBrand(); if (detected) setColors(detected); }}>Reset to Logo Colors</Btn>}
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" Icon={Sparkles} onClick={apply} disabled={!colors}>Use Brand Theme</Btn>
        </>
      }>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--theme-border)] p-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)]">
            {logo
              ? <img src={logo} alt="School logo" className="h-full w-full object-contain" />
              : <ImagePlus className="h-6 w-6 text-[var(--theme-text-muted)]" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">{logo ? "Logo uploaded" : "Upload your school logo"}</p>
            <p className="text-[12px] text-[var(--theme-text-muted)]">PNG, JPG or WEBP · up to 5 MB · processed locally</p>
          </div>
          <input ref={fileRef} type="file" accept={ACCEPTED_LOGO_TYPES.join(",")} className="hidden"
            onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="flex shrink-0 gap-2">
            <Btn size="sm" variant="secondary" Icon={Upload} onClick={() => fileRef.current?.click()}>
              {logo ? "Replace" : "Upload"}
            </Btn>
            {logo && <Btn size="sm" variant="ghost" Icon={Trash2} onClick={removeLogo}>Remove</Btn>}
          </div>
        </div>

        {status === "analyzing" && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-3">
            <LoadingIcon size={18} />
            <p className="text-[13px] text-[var(--theme-text-muted)]">Analyzing your logo… generating brand colors…</p>
          </div>
        )}
        {status === "error" && (
          <p className="rounded-lg border p-3 text-[13px]" style={{ background: "var(--theme-danger-soft)", borderColor: "var(--theme-danger-soft)", color: "var(--theme-danger-text)" }}>{message}</p>
        )}

        {palette.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Detected colors</p>
            <div className="flex flex-wrap gap-1.5">
              {palette.map((c) => (
                <span key={c} title={c} className="h-6 w-6 rounded-full ring-1 ring-[var(--theme-border)]" style={{ background: c }} />
              ))}
            </div>
          </div>
        )}

        {colors && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-2 rounded-lg border border-[var(--theme-border)] px-3 py-2">
              <span className="text-[13px] font-medium">Primary color</span>
              <span className="flex items-center gap-2">
                <input type="color" aria-label="Primary color" value={colors.primary} onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="h-7 w-10 cursor-pointer rounded border border-[var(--theme-border)] bg-transparent" />
                <span className="w-16 truncate text-[12px] text-[var(--theme-text-muted)]">{colors.primary}</span>
              </span>
            </label>
            <label className="flex items-center justify-between gap-2 rounded-lg border border-[var(--theme-border)] px-3 py-2">
              <span className="text-[13px] font-medium">Accent color</span>
              <span className="flex items-center gap-2">
                <input type="color" aria-label="Accent color" value={colors.accent} onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="h-7 w-10 cursor-pointer rounded border border-[var(--theme-border)] bg-transparent" />
                <span className="w-16 truncate text-[12px] text-[var(--theme-text-muted)]">{colors.accent}</span>
              </span>
            </label>
          </div>
        )}

        {tokens && (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">Preview</p>
            <div className="rounded-lg border p-3" style={{ background: tokens.bg, borderColor: tokens.border }}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-white" style={{ background: tokens.primary }}>B</span>
                <span className="truncate text-[13px] font-medium" style={{ color: tokens.text }}>{name || "School Brand"}</span>
                <span className="ml-auto shrink-0 rounded px-2 py-0.5 text-[11px] font-medium text-white" style={{ background: tokens.accent }}>Accent</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["Students", "1,284"], ["Employees", "68"], ["Pending", "43"]].map(([l, v]) => (
                  <div key={l} className="rounded p-2" style={{ background: tokens.surface, border: `1px solid ${tokens.border}` }}>
                    <p className="text-[10px]" style={{ color: tokens.textMuted }}>{l}</p>
                    <p className="text-[14px] font-bold" style={{ color: tokens.text }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded px-2.5 py-1 text-[11px] font-medium text-white" style={{ background: tokens.primary }}>Primary</span>
                <span className="rounded px-2.5 py-1 text-[11px]" style={{ background: tokens.surface, color: tokens.text, border: `1px solid ${tokens.borderStrong}` }}>Secondary</span>
                <span className="rounded px-2.5 py-1 text-[11px] font-medium text-white" style={{ background: tokens.success }}>Success</span>
                <span className="rounded px-2.5 py-1 text-[11px] font-medium text-white" style={{ background: tokens.warning }}>Warning</span>
                <span className="rounded px-2.5 py-1 text-[11px] font-medium text-white" style={{ background: tokens.danger }}>Danger</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
