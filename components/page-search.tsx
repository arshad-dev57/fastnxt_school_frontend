"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";
import { cn } from "@/components/ui";

export type SearchablePage = {
  label: string;
  href: string;
  group?: string;
};

function scorePage(page: SearchablePage, q: string) {
  const label = page.label.toLowerCase();
  const group = (page.group || "").toLowerCase();
  const href = page.href.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (group.includes(q)) return 40;
  if (href.includes(q.replace(/\s+/g, "-"))) return 30;
  return 0;
}

export function filterPages(pages: SearchablePage[], query: string, limit = 10): SearchablePage[] {
  const q = query.trim().toLowerCase();
  if (!q) return pages.slice(0, limit);
  return pages
    .map((p) => ({ page: p, score: scorePage(p, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.page.label.localeCompare(b.page.label))
    .slice(0, limit)
    .map((r) => r.page);
}

/** Does a nav group / child match the sidebar filter query? */
export function matchesNavQuery(
  query: string,
  ...parts: (string | undefined | null)[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => (p || "").toLowerCase().includes(q));
}

type AnchorSearchProps = {
  pages: SearchablePage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Element that owns the search icon — dropdown anchors under it. */
  anchorRef: React.RefObject<HTMLElement | null>;
  placeholder?: string;
  onNavigate?: () => void;
};

/** Compact dropdown that opens under the header Search icon. */
export function HeaderPageSearch({
  pages,
  open,
  onOpenChange,
  anchorRef,
  placeholder = "Search pages…",
  onNavigate,
}: AnchorSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => filterPages(pages, query, 8), [pages, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + 8,
        right: Math.max(8, window.innerWidth - r.right),
      });
    };
    place();
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange, anchorRef]);

  const go = (href: string) => {
    onOpenChange(false);
    onNavigate?.();
    setQuery("");
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      e.preventDefault();
      go(results[activeIdx].href);
    }
  };

  if (!open || !pos) return null;

  return (
    <div
      ref={panelRef}
      style={{ top: pos.top, right: pos.right }}
      className="fixed z-[90] w-[min(300px,calc(100vw-16px))] origin-top-right transition-all duration-150 ease-out"
    >
      <div className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center gap-2 border-b border-[var(--theme-border)] px-2.5 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--theme-text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--theme-text-faint)]"
            aria-label="Search pages"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
            aria-label="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[260px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-[12px] text-[var(--theme-text-muted)]">
              No pages match “{query.trim()}”
            </p>
          ) : (
            results.map((page, i) => (
              <button
                key={`${page.href}-${page.label}`}
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => go(page.href)}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors",
                  i === activeIdx ? "bg-[var(--theme-active-bg)]" : "hover:bg-[var(--theme-hover)]"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{page.label}</span>
                  {page.group && (
                    <span className="block truncate text-[11px] text-[var(--theme-text-muted)]">{page.group}</span>
                  )}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-faint)]" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Sidebar search field only — filters the nav list below (no dropdown). */
export function SidebarNavSearch({
  value,
  onChange,
  placeholder = "Search pages…",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 focus-within:border-[var(--theme-primary)]",
        className
      )}
    >
      <Search className="h-[18px] w-[18px] shrink-0 text-[var(--theme-text-muted)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--theme-text-faint)]"
        aria-label="Filter sidebar pages"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-[var(--theme-text-faint)] hover:text-[var(--theme-text-muted)]"
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Flatten admin NAV groups into searchable page entries. */
export function pagesFromNavGroups(
  groups: { label: string; href?: string; children: { label: string; href: string }[] }[]
): SearchablePage[] {
  const out: SearchablePage[] = [];
  const seen = new Set<string>();
  for (const g of groups) {
    if (g.href && !seen.has(g.href)) {
      seen.add(g.href);
      out.push({ label: g.label, href: g.href, group: g.label });
    }
    for (const c of g.children) {
      if (c.href === "/logout" || seen.has(c.href)) continue;
      seen.add(c.href);
      out.push({ label: c.label, href: c.href, group: g.label });
    }
  }
  return out;
}
