"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight, X, Inbox } from "lucide-react";

export type IconType = React.ElementType;

/* ------------------------------------------------------------------ utils */
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const OWNER_COLORS = ["#579BFC", "#A25DDC", "#00C875", "#FF158A", "#FDAB3D", "#037F4C"];
export const initials = (n: string) =>
  n.split(" ").filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
export const avatarColor = (n: string) => OWNER_COLORS[n.length % OWNER_COLORS.length];

export const rs = (n: number) => "Rs " + n.toLocaleString("en-PK");

/* ------------------------------------------------------------------- tones */
export type Tone = "gray" | "blue" | "green" | "orange" | "red" | "purple";

export const TONE: Record<Tone, { bg: string; fg: string }> = {
  gray: { bg: "#F0F1F4", fg: "#676879" },
  blue: { bg: "#CCE5FF", fg: "#1D4ED8" },
  green: { bg: "#D6F5E3", fg: "#037F4C" },
  orange: { bg: "#FFEBD1", fg: "#B26A00" },
  red: { bg: "#FDD9DF", fg: "#C0233B" },
  purple: { bg: "#E7DEFF", fg: "#5A34D6" },
};

const GREEN = ["active", "paid", "approved", "generated", "printed", "present", "completed", "success", "done", "enabled"];
const ORANGE = ["partially paid", "partial", "working on it", "in progress", "review", "warning", "low"];
const RED = ["overdue", "stuck", "rejected", "blocked", "absent", "failed", "expired", "high"];
const BLUE = ["new", "assigned", "info", "medium"];

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (GREEN.includes(s)) return "green";
  if (RED.includes(s)) return "red";
  if (ORANGE.includes(s)) return "orange";
  if (BLUE.includes(s)) return "blue";
  return "gray";
}

/* ------------------------------------------------------------------ badges */
export function Badge({ label, tone, className = "" }: { label: string; tone?: Tone; className?: string }) {
  const t = TONE[tone ?? statusTone(label)];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap", className)}
      style={{ background: t.bg, color: t.fg }}>
      {label}
    </span>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />;
}

/* ----------------------------------------------------------------- avatars */
export function Avatar({ name, size = 32, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <span title={name} className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size <= 28 ? 10 : 11, background: avatarColor(name), boxShadow: ring ? "0 0 0 2px #fff" : undefined }}>
      {initials(name)}
    </span>
  );
}

export function PersonCell({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium">{name}</p>
        {sub && <p className="truncate text-[12px] text-[#9699A6]">{sub}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- selectable pill UI */
export function PillSelect<T extends string>({ value, options, colors, onPick, className = "", menuWidth = "w-44" }: {
  value: T; options: readonly T[]; colors: Record<string, string>;
  onPick: (v: T) => void; className?: string; menuWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="h-8 w-full rounded-md px-2.5 text-[13px] font-medium text-white"
        style={{ background: colors[value] ?? "#C4C4C4" }}>{value}</button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={cn("absolute left-0 top-full z-40 mt-1 space-y-1 rounded-lg bg-white p-2 shadow-xl ring-1 ring-[#E6E9EF]", menuWidth)}>
            {options.map((o) => (
              <button key={o} type="button" onClick={() => { onPick(o); setOpen(false); }}
                className="block h-8 w-full rounded text-[13px] font-medium text-white"
                style={{ background: colors[o] ?? "#C4C4C4" }}>{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


/* ----------------------------------------------------------------- buttons */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "purple";

export function Btn({ children, onClick, variant = "secondary", size = "md", Icon, IconRight, className = "", type = "button", disabled }: {
  children?: ReactNode; onClick?: (e: React.MouseEvent) => void; variant?: BtnVariant;
  size?: "sm" | "md" | "lg"; Icon?: IconType; IconRight?: IconType;
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-9 px-3.5 text-[14px]", lg: "h-10 px-4 text-[15px]" };
  const variants: Record<BtnVariant, string> = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
    secondary: "border border-[#C5C7D0] bg-white text-[#323338] hover:bg-[#F5F6F8]",
    ghost: "text-[#323338] hover:bg-[#F5F6F8]",
    danger: "bg-[#DF2F4A] text-white hover:bg-[#C0233B]",
    subtle: "bg-[#E6E9EF] text-[#323338] hover:bg-[#D9DCE3]",
    purple: "bg-[#6C47FF] text-white hover:bg-[#5A34D6]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cn("inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size], variants[variant], className)}>
      {Icon && <Icon className={size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]"} />}
      {children}
      {IconRight && <IconRight className="h-[18px] w-[18px]" />}
    </button>
  );
}

/* Split primary button (matches the "New item" control in the master UI) */
export function SplitButton({ label, onClick, onMore, Icon }: { label: string; onClick?: () => void; onMore?: () => void; Icon?: IconType }) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded">
      <button type="button" onClick={onClick}
        className="flex h-9 items-center gap-2 bg-[#2563EB] px-3.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8]">
        {Icon && <Icon className="h-[18px] w-[18px]" />}{label}
      </button>
      <button type="button" onClick={onMore} aria-label="More options"
        className="flex h-9 items-center border-l border-white/30 bg-[#2563EB] px-1.5 text-white hover:bg-[#1D4ED8]">
        <ChevronDownSmall />
      </button>
    </div>
  );
}

function ChevronDownSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------ toolbar items */
export function ToolbarBtn({ Icon, label, onClick, active }: { Icon: IconType; label?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex h-9 shrink-0 items-center gap-2 rounded px-2.5 text-[14px] text-[#323338] transition-colors hover:bg-[#E6E9EF]",
        active && "bg-[#E6E9EF]")}>
      <Icon className="h-5 w-5" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("flex h-9 min-w-0 items-center gap-2 rounded border border-[#C5C7D0] bg-white px-2.5 focus-within:border-[#2563EB]", className)}>
      <Search className="h-[18px] w-[18px] shrink-0 text-[#676879]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="min-w-0 w-full bg-transparent text-[14px] outline-none placeholder:text-[#9699A6]" />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Clear" className="text-[#9699A6] hover:text-[#323338]"><X className="h-4 w-4" /></button>}
    </div>
  );
}

export const ACTIVE_COLORS: Record<string, string> = { Active: "#00C875", Inactive: "#C4C4C4" };
export const INVOICE_COLORS: Record<string, string> = {
  Paid: "#00C875", "Partially Paid": "#FDAB3D", Pending: "#C4C4C4", Overdue: "#DF2F4A",
};

/* ------------------------------------------------------------------- cards */
export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={cn("rounded-lg border border-[#E6E9EF] bg-white", pad && "p-4", className)}>{children}</div>;
}

export function CardHead({ title, subtitle, right, Icon }: { title: string; subtitle?: string; right?: ReactNode; Icon?: IconType }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E6E9EF] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#1D4ED8]"><Icon className="h-[18px] w-[18px]" /></span>}
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold">{title}</h3>
          {subtitle && <p className="truncate text-[13px] text-[#676879]">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, Icon, tone = "blue", trend }: {
  label: string; value: string | number; sub?: string; Icon?: IconType; tone?: Tone; trend?: { dir: "up" | "down"; text: string };
}) {
  const t = TONE[tone];
  return (
    <div className="rounded-lg border border-[#E6E9EF] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        {Icon && <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: t.bg, color: t.fg }}><Icon className="h-5 w-5" /></span>}
        {trend && <span className="rounded-full px-2 py-0.5 text-[12px] font-medium" style={{ background: trend.dir === "up" ? TONE.green.bg : TONE.red.bg, color: trend.dir === "up" ? TONE.green.fg : TONE.red.fg }}>{trend.text}</span>}
      </div>
      <p className="mt-3 text-[13px] text-[#676879]">{label}</p>
      <p className="text-[24px] font-bold leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-[#9699A6]">{sub}</p>}
    </div>
  );
}

/* -------------------------------------------------------------- page header */
export function PageHeader({ title, subtitle, actions, tabs, activeTab, onTab, back }: {
  title: string; subtitle?: string; actions?: ReactNode; tabs?: string[];
  activeTab?: string; onTab?: (t: string) => void; back?: ReactNode;
}) {
  return (
    <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="flex flex-wrap items-center gap-2">
        {back}
        <h1 className="min-w-0 truncate text-[22px] font-bold leading-tight sm:text-[28px]">{title}</h1>
        <div className="flex-1" />
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {subtitle && <p className="mt-1 text-[14px] text-[#676879] sm:text-[15px]">{subtitle}</p>}
      {tabs && tabs.length > 0 && (
        <div className="mt-3 flex gap-1 overflow-x-auto border-b border-[#E6E9EF]">
          {tabs.map((t) => (
            <button key={t} type="button" onClick={() => onTab?.(t)}
              className={cn("relative -mb-px flex shrink-0 items-center whitespace-nowrap rounded-t px-3 pb-3 pt-2 text-[15px] transition-colors hover:bg-[#F5F6F8]",
                activeTab === t ? "font-medium text-[#323338]" : "text-[#676879]")}>
              {t}
              {activeTab === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#2563EB]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- row menu */
export type MenuItem = { label: string; Icon?: IconType; onClick?: () => void; danger?: boolean };

export function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} aria-label="Row actions"
        className="flex h-8 w-8 items-center justify-center rounded text-[#676879] hover:bg-[#E6E9EF]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-lg bg-white p-1 shadow-xl ring-1 ring-[#E6E9EF]">
            {items.map((it, i) => (
              <button key={i} type="button" onClick={() => { it.onClick?.(); setOpen(false); }}
                className={cn("flex h-9 w-full items-center gap-2.5 rounded px-2.5 text-left text-[14px] hover:bg-[#F5F6F8]",
                  it.danger ? "text-[#DF2F4A]" : "text-[#323338]")}>
                {it.Icon && <it.Icon className="h-[18px] w-[18px]" />}{it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- forms */
export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-[#323338]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[#9699A6]">{hint}</span>}
    </label>
  );
}

const inputCls = "h-10 w-full rounded border border-[#C5C7D0] bg-white px-3 text-[14px] text-[#323338] outline-none transition-colors placeholder:text-[#9699A6] focus:border-[#2563EB] disabled:bg-[#F5F6F8]";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, className)} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-[88px] w-full rounded border border-[#C5C7D0] bg-white px-3 py-2 text-[14px] text-[#323338] outline-none transition-colors placeholder:text-[#9699A6] focus:border-[#2563EB]", className)} />;
}

export function Select({ options, className = "", placeholder, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select {...props} className={cn(inputCls, "appearance-none pr-9", className)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676879]">
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Checkbox({ checked, onChange, className = "" }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={cn("h-4 w-4 shrink-0 accent-[#2563EB]", className)} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-[14px] text-[#323338]">
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-[#00C875]" : "bg-[#C5C7D0]")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------- modal */
export function Modal({ open, onClose, title, subtitle, children, footer, width = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: ReactNode; footer?: ReactNode; width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className={cn("modal-panel flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-xl", width)} onClick={(e) => e.stopPropagation()}>
        <div className="no-print flex items-start justify-between gap-3 border-b border-[#E6E9EF] px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold">{title}</h3>
            {subtitle && <p className="truncate text-[13px] text-[#676879]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#676879] hover:bg-[#E6E9EF]"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-[#E6E9EF] px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", tone = "danger" }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
  confirmLabel?: string; tone?: "danger" | "primary";
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant={tone === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
        </>
      }>
      <p className="text-[14px] leading-relaxed text-[#676879]">{message}</p>
    </Modal>
  );
}

/* -------------------------------------------------------------- pagination */
export function Pagination({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total?: number }) {
  if (pages <= 1) return null;
  const nums: number[] = [];
  for (let i = 1; i <= pages; i++) nums.push(i);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E9EF] px-4 py-3">
      <p className="text-[13px] text-[#676879]">{total !== undefined ? `${total} records · ` : ""}Page {page} of {pages}</p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded border border-[#C5C7D0] text-[#323338] hover:bg-[#F5F6F8] disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {nums.map((n) => (
          <button key={n} type="button" onClick={() => onPage(n)}
            className={cn("h-8 min-w-8 rounded px-2 text-[13px] font-medium",
              n === page ? "bg-[#2563EB] text-white" : "border border-[#C5C7D0] text-[#323338] hover:bg-[#F5F6F8]")}>
            {n}
          </button>
        ))}
        <button type="button" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}
          className="flex h-8 w-8 items-center justify-center rounded border border-[#C5C7D0] text-[#323338] hover:bg-[#F5F6F8] disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- empty state */
export function EmptyState({ title, message, Icon = Inbox, action }: { title: string; message?: string; Icon?: IconType; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F1F4] text-[#9699A6]"><Icon className="h-7 w-7" /></span>
      <p className="text-[16px] font-semibold">{title}</p>
      {message && <p className="max-w-sm text-[14px] text-[#676879]">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------- table helpers */
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <div className={cn("flex items-center px-3 py-2.5 text-[13px] font-semibold text-[#676879]", className)}>{children}</div>;
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 items-center px-3 py-2.5 text-[14px]", className)}>{children}</div>;
}


