"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Filter, Search, UserCheck, Users, X } from "lucide-react";
import { Avatar, Btn, cn } from "@/components/ui";
import { PARTICIPANT_CLASSES, PARTICIPANT_SECTIONS, type MeetingParticipant } from "@/lib/meetings-data";

/* ============================================================================
   Participant picker — shared by the Admin → Teachers and Teacher → Students
   flows. Supports search, class / section filters, per-group "select all in
   section", global select-all and clear. Responsive: the filters collapse into
   a toggle on phones and the list scrolls inside a fixed-height panel.
   ========================================================================== */

export function ParticipantPicker({
  people, selectedIds, onChange, kindLabel, withClassFilters = false, emptyHint,
}: {
  people: MeetingParticipant[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  kindLabel: string;
  withClassFilters?: boolean;
  emptyHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (withClassFilters) {
        if (cls && p.cls !== cls) return false;
        if (section && p.section !== section) return false;
      }
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q);
    });
  }, [people, query, cls, section, withClassFilters]);

  /* Group by class-section (students) or department (teachers) for scannability. */
  const groups = useMemo(() => {
    const map = new Map<string, MeetingParticipant[]>();
    for (const p of filtered) {
      const key = withClassFilters
        ? (p.cls ? (p.section ? `${p.cls}-${p.section}` : p.cls) : "Other")
        : (p.sub.split("·")[1]?.trim() ?? "Staff");
      const list = map.get(key);
      if (list) list.push(p); else map.set(key, [p]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, withClassFilters]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedSet.has(p.id));

  const toggle = (id: string) =>
    onChange(selectedSet.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const selectAllFiltered = () => onChange([...new Set([...selectedIds, ...filtered.map((p) => p.id)])]);
  const clearAll = () => onChange([]);
  const clearFilters = () => { setQuery(""); setCls(""); setSection(""); };

  const activeFilters = (cls ? 1 : 0) + (section ? 1 : 0);

  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
      {/* toolbar */}
      <div className="space-y-2 border-b border-[var(--theme-border)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="group flex h-9 min-w-[170px] flex-1 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 transition-colors focus-within:border-[var(--theme-primary)]">
            <Search className="h-[18px] w-[18px] shrink-0 text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${kindLabel.toLowerCase()}…`}
              className="min-w-0 w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--theme-text-faint)]" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[var(--theme-text-faint)] hover:text-[var(--theme-text)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {withClassFilters && (
            <Btn size="sm" variant={activeFilters ? "subtle" : "secondary"} Icon={Filter} className="sm:hidden"
              onClick={() => setFiltersOpen((o) => !o)}>
              Filters{activeFilters ? ` (${activeFilters})` : ""}
            </Btn>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <Btn size="sm" variant="secondary" Icon={UserCheck} disabled={filtered.length === 0 || allFilteredSelected} onClick={selectAllFiltered}>
              <span className="hidden sm:inline">Select all</span><span className="sm:hidden">All</span>
            </Btn>
            <Btn size="sm" variant="ghost" Icon={X} disabled={selectedIds.length === 0} onClick={clearAll}>Clear</Btn>
          </div>
        </div>

        {withClassFilters && (
          <div className={cn("flex-wrap items-center gap-2", filtersOpen ? "flex" : "hidden sm:flex")}>
            <FilterSelect label="Class" value={cls} options={PARTICIPANT_CLASSES} onChange={setCls} />
            <FilterSelect label="Section" value={section} options={PARTICIPANT_SECTIONS} onChange={setSection} />
            {(activeFilters > 0 || query) && (
              <button type="button" onClick={clearFilters} className="text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
                Reset filters
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--theme-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Showing {filtered.length} of {people.length}
          </span>
          <span className={cn("font-semibold", selectedIds.length > 0 && "text-[var(--theme-primary)]")}>
            {selectedIds.length} selected
          </span>
        </div>
      </div>
      {/* participant list */}
      <div className="max-h-[300px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-subtle)] text-[var(--theme-text-faint)]">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-[14px] font-medium">No {kindLabel.toLowerCase()} match</p>
            <p className="text-[13px] text-[var(--theme-text-muted)]">{emptyHint ?? "Try a different search or clear the filters."}</p>
          </div>
        ) : (
          groups.map(([groupLabel, members]) => {
            const groupAllSelected = members.every((p) => selectedSet.has(p.id));
            return (
              <div key={groupLabel} className="border-b border-[var(--theme-border)] last:border-b-0">
                <div className="flex items-center justify-between gap-2 bg-[var(--theme-subtle)] px-3 py-1.5">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">{groupLabel}</span>
                  <button type="button"
                    onClick={() => onChange(groupAllSelected
                      ? selectedIds.filter((id) => !members.some((m) => m.id === id))
                      : [...new Set([...selectedIds, ...members.map((m) => m.id)])])}
                    className="text-[12px] font-medium text-[var(--theme-primary)] hover:underline">
                    {groupAllSelected ? "Unselect section" : `Select all ${members.length}`}
                  </button>
                </div>
                {members.map((p) => {
                  const on = selectedSet.has(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggle(p.id)} role="checkbox" aria-checked={on}
                      className={cn("flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--theme-hover)]",
                        on && "bg-[var(--theme-info-soft)]")}>
                      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        on ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white" : "border-[var(--theme-border-strong)]")}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <Avatar name={p.name} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{p.name}</span>
                        <span className="block truncate text-[12px] text-[var(--theme-text-muted)]">{p.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string; options: readonly string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className={cn("flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] transition-colors",
          value ? "border-[var(--theme-primary)] bg-[var(--theme-info-soft)] text-[var(--theme-primary-hover)]"
            : "border-[var(--theme-border-strong)] text-[var(--theme-text)] hover:bg-[var(--theme-hover)]")}>
        {value || label}<ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-40 overflow-y-auto rounded-lg bg-[var(--theme-surface)] p-1 shadow-xl ring-1 ring-[var(--theme-border)]">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className={cn("flex h-8 w-full items-center rounded px-2.5 text-left text-[13px] hover:bg-[var(--theme-hover)]", !value && "font-medium text-[var(--theme-primary)]")}>
              All {label.toLowerCase()}es
            </button>
            {options.map((o) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }}
                className={cn("flex h-8 w-full items-center gap-2 rounded px-2.5 text-left text-[13px] hover:bg-[var(--theme-hover)]", value === o && "font-medium text-[var(--theme-primary)]")}>
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
