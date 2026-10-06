"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { X, ArrowUp } from "lucide-react";
import { cn } from "@/components/ui";

/* ============================================================================
   Floating "Bisons AI" assistant  (components/ai-assistant/FloatingAIAssistant)
   ---------------------------------------------------------------------------
   One globally-mounted, dependency-free AI emblem:
     • multi-colour gradient orb (rotating conic gradient) + soft pulsing glow
     • abstract AI "neural node" mark — deliberately NOT a bot / chat-bubble /
       sparkles icon
     • 3 staggered SVG sparkle particles (no emoji)
     • theme-aware container, tooltip and preview panel — only the artwork
       keeps its own colourful identity
     • CSS-only motion, fully disabled under `prefers-reduced-motion`
   Clicking opens a placeholder panel. Swap the panel body for the real
   chatbot later — no API / backend / storage is involved here.
   ========================================================================== */

const AI_GRADIENT =
  "linear-gradient(135deg, #22D3EE 0%, #3B82F6 18%, #8B5CF6 38%, #EC4899 56%, #F97316 72%, #FACC15 86%, #22C55E 100%)";
const AI_CONIC =
  "conic-gradient(from 0deg, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #F97316, #FACC15, #22C55E, #22D3EE)";

/** Abstract AI mark — a small neural-node graph. */
function AiMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 5.4 5.6 16.6M12 5.4l6.4 11.2M5.6 16.6h12.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <circle cx="12" cy="4.9" r="2.5" fill="currentColor" />
      <circle cx="5.6" cy="17.1" r="2.5" fill="currentColor" />
      <circle cx="18.4" cy="17.1" r="2.5" fill="currentColor" />
    </svg>
  );
}

function Sparkle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} style={style}>
      <path d="M12 1.6c.62 5.2 3.2 7.78 8.4 8.4-5.2.62-7.78 3.2-8.4 8.4-.62-5.2-3.2-7.78-8.4-8.4 5.2-.62 7.78-3.2 8.4-8.4Z" fill="currentColor" />
    </svg>
  );
}

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="ai-wrap ai-float group/ai isolate fixed bottom-[84px] right-[18px] z-30 md:bottom-6 md:right-6">
        {/* soft colourful glow (stays behind the emblem) */}
        <span aria-hidden="true" className="ai-glow pointer-events-none absolute -inset-2 -z-10 rounded-full blur-lg" style={{ backgroundImage: AI_GRADIENT }} />

        {/* staggered sparkle particles */}
        <Sparkle className="ai-twinkle pointer-events-none absolute -right-1.5 -top-1.5 h-2.5 w-2.5 text-[#22D3EE]" style={{ animationDelay: "0ms" }} />
        <Sparkle className="ai-twinkle pointer-events-none absolute -left-2 top-1/2 h-3 w-3 text-[#F472B6]" style={{ animationDelay: "1200ms" }} />
        <Sparkle className="ai-twinkle pointer-events-none absolute -bottom-1 right-1 h-2 w-2 text-[#FACC15]" style={{ animationDelay: "2200ms" }} />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open Bisons AI assistant"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface)] p-[3px] shadow-xl ring-1 ring-[var(--theme-border)] outline-none transition-transform duration-200 ease-out hover:scale-[1.07] focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg)]",
            open && "scale-[1.07]"
          )}
        >
          <span aria-hidden="true" className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
            <span className="ai-ring absolute -inset-3 rounded-full" style={{ backgroundImage: AI_CONIC }} />
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.6),transparent_58%)]" />
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
            <AiMark className="ai-core relative h-7 w-7 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
          </span>
        </button>

        <span role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--theme-text)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-surface)] opacity-0 shadow-lg transition-opacity duration-150 group-hover/ai:opacity-100 group-focus-within/ai:opacity-100">
          Ask Bisons AI
        </span>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-label="Bisons AI assistant preview"
            className="fixed bottom-[152px] right-[18px] z-40 w-[320px] max-w-[calc(100vw-36px)] overflow-hidden rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-[var(--theme-border)] md:bottom-[92px] md:right-6">
            <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] px-4 py-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundImage: AI_GRADIENT }}>
                <AiMark className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">Bisons AI</p>
                <p className="truncate text-[12px] text-[var(--theme-text-muted)]">Assistant preview</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close Bisons AI assistant"
                className="ic-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-hover)] hover:text-[var(--theme-text)]">
                <X className="ic-hover h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundImage: AI_GRADIENT }}>
                  <AiMark className="h-3.5 w-3.5 text-white" />
                </span>
                <p className="rounded-2xl rounded-tl-sm bg-[var(--theme-hover)] px-3 py-2 text-[13px] leading-relaxed">
                  Hi! I&apos;m <span className="font-semibold">Bisons AI</span>. Ask me about students, fees, classes or reports.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Student attendance", "Fee summary", "Class timetable", "Exam results"].map((s) => (
                  <span key={s} className="rounded-full border border-[var(--theme-border)] px-2.5 py-1 text-[12px] text-[var(--theme-text-muted)]">{s}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--theme-border)] p-3">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 py-2">
                <input disabled placeholder="Ask Bisons AI… (coming soon)"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-faint)]" />
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundImage: AI_GRADIENT }}>
                  <ArrowUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--theme-text-faint)]">Preview only — the AI assistant will be connected later.</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
