/**
 * Isolated printing helpers — never print app chrome (AI, sidebar, toasts).
 *
 * Prefer `printHtml` for documents that need reliable styling (receipts).
 * Prefer `printElement` when the on-screen node already looks correct and
 * we can pull stylesheets into the iframe.
 */

export type PrintElementOptions = {
  pageCss?: string;
  extraCss?: string;
  title?: string;
  delayMs?: number;
};

function openPrintFrame(html: string, delayMs = 300): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  };

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(cleanup, 1500);
    }
  }, delayMs);

  return true;
}

function collectStylesheetLinks(): string {
  if (typeof document === "undefined") return "";
  const parts: string[] = [];
  document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    const href = (node as HTMLLinkElement).href;
    if (href) parts.push(`<link rel="stylesheet" href="${href}" />`);
  });
  // Inline <style> tags from the app (Tailwind runtime / globals)
  document.querySelectorAll("style").forEach((node) => {
    const css = node.textContent || "";
    if (css.trim()) parts.push(`<style>${css}</style>`);
  });
  return parts.join("\n");
}

/**
 * Print raw HTML document (fully self-contained — best for receipts).
 */
export function printHtml(documentHtml: string, opts: { delayMs?: number } = {}): boolean {
  return openPrintFrame(documentHtml, opts.delayMs ?? 350);
}

/**
 * Clone a DOM node into an iframe, bringing parent stylesheets along.
 * Does NOT copy computed styles (that caused overlapping boxes).
 */
export function printElement(
  source: HTMLElement | string | null | undefined,
  opts: PrintElementOptions = {}
): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;

  const el =
    typeof source === "string"
      ? (document.querySelector(source) as HTMLElement | null)
      : source;
  if (!el) return false;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".no-print").forEach((n) => n.remove());

  const pageCss = opts.pageCss || "@page { size: A4 portrait; margin: 12mm; }";
  const title = (opts.title || "Print").replace(/[<>&"]/g, "");
  const sheets = collectStylesheetLinks();

  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>${title}</title>
${sheets}
<style>
  ${pageCss}
  html, body { margin: 0; padding: 0; background: #fff !important; }
  body { padding: 0; }
  .no-print, .ai-wrap, .ai-float, .dashboard-float { display: none !important; }
  ${opts.extraCss || ""}
</style>
</head><body>${clone.outerHTML}</body></html>`;

  return openPrintFrame(html, opts.delayMs ?? 400);
}
