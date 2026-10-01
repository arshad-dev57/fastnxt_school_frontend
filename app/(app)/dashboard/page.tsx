"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home, CalendarCheck, Star, LayoutGrid, Search, Bell, Inbox, UserPlus, Puzzle, HelpCircle,
  ChevronDown, ChevronRight, Plus, Users, Wallet, GraduationCap, BarChart3, Bus,
  Filter, ArrowUpDown, EyeOff, Layers, MoreHorizontal, MessageSquarePlus, Table2, Kanban,
  CalendarDays, Sparkles, PanelLeftClose, Menu, X,
} from "lucide-react";

type Status = "Done" | "Working on it" | "Stuck" | "Pending";
type Priority = "High" | "Medium" | "Low";
type Item = { id: number; name: string; owner: string; status: Status; due: string; priority: Priority; progress: number; checked?: boolean };
type Group = { id: string; title: string; color: string; open: boolean; items: Item[] };

const STATUS: Record<Status, string> = { Done: "#00C875", "Working on it": "#FDAB3D", Stuck: "#DF2F4A", Pending: "#C4C4C4" };
const PRIORITY: Record<Priority, string> = { High: "#401694", Medium: "#5559DF", Low: "#579BFC" };
const OWNER_COLORS = ["#579BFC", "#A25DDC", "#00C875", "#FF158A", "#FDAB3D", "#037F4C"];

const boards = [
  { k: "students", label: "Student management", Icon: Users },
  { k: "attendance", label: "Attendance", Icon: CalendarCheck },
  { k: "fees", label: "Fee management", Icon: Wallet },
  { k: "exams", label: "Exams & results", Icon: GraduationCap },
  { k: "transport", label: "Transport routes", Icon: Bus },
  { k: "reports", label: "Reports dashboard", Icon: BarChart3 },
];

const seed: Group[] = [
  {
    id: "g1", title: "This week", color: "#579BFC", open: true,
    items: [
      { id: 1, name: "Grade 10A roster verification", owner: "Amara Reyes", status: "Done", due: "Sep 28", priority: "High", progress: 100 },
      { id: 2, name: "Term 2 attendance reconciliation", owner: "Daniel Okafor", status: "Working on it", due: "Oct 02", priority: "Medium", progress: 60 },
      { id: 3, name: "Send fee reminders to guardians", owner: "Priya Nair", status: "Stuck", due: "Oct 01", priority: "High", progress: 25 },
      { id: 4, name: "Upload mid-term exam marks", owner: "Liam Bennett", status: "Pending", due: "Oct 05", priority: "Low", progress: 0 },
    ],
  },
  {
    id: "g2", title: "Next week", color: "#A25DDC", open: true,
    items: [
      { id: 5, name: "Parent–teacher meeting schedule", owner: "Amara Reyes", status: "Pending", due: "Oct 08", priority: "Medium", progress: 10 },
      { id: 6, name: "Plan bus route changes for Zone 3", owner: "Daniel Okafor", status: "Working on it", due: "Oct 09", priority: "Low", progress: 40 },
      { id: 7, name: "Generate teacher performance report", owner: "Priya Nair", status: "Pending", due: "Oct 11", priority: "High", progress: 0 },
    ],
  },
  {
    id: "g3", title: "Completed", color: "#00C875", open: false,
    items: [
      { id: 8, name: "New admissions data import", owner: "Liam Bennett", status: "Done", due: "Sep 20", priority: "High", progress: 100 },
      { id: 9, name: "Set up guardian portal access", owner: "Amara Reyes", status: "Done", due: "Sep 15", priority: "Medium", progress: 100 },
    ],
  },
];

const initials = (n: string) => n.split(" ").map((x) => x[0]).join("");
const ownerColor = (n: string) => OWNER_COLORS[n.length % OWNER_COLORS.length];

/* Colored pill with dropdown (used for Status + Priority) */
function Pill<T extends string>({ id, value, colors, onPick, menu, setMenu, className = "" }: {
  id: string; value: T; colors: Record<T, string>; onPick: (v: T) => void;
  menu: string | null; setMenu: (v: string | null) => void; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => { e.stopPropagation(); setMenu(menu === id ? null : id); }}
        className="pill h-full min-h-9 w-full rounded-sm px-2 text-[14px] font-medium text-white"
        style={{ background: colors[value] }}
      >{value}</button>
      {menu === id && (
        <div className="absolute left-1/2 top-full z-30 mt-1 w-44 -translate-x-1/2 space-y-1 rounded-lg bg-white p-2 shadow-xl ring-1 ring-[#E6E9EF]">
          {(Object.keys(colors) as T[]).map((o) => (
            <button key={o} onClick={(e) => { e.stopPropagation(); onPick(o); setMenu(null); }}
              className="pill block h-9 w-full rounded text-[14px] font-medium text-white" style={{ background: colors[o] }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [activeBoard, setActiveBoard] = useState("students");
  const [view, setView] = useState("Main table");
  const [groups, setGroups] = useState<Group[]>(seed);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const update = (gid: string, fn: (g: Group) => Group) => setGroups((p) => p.map((g) => (g.id === gid ? fn(g) : g)));
  const patchItem = (gid: string, id: number, patch: Partial<Item>) =>
    update(gid, (g) => ({ ...g, items: g.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const setStatus = (gid: string, it: Item, s: Status) => patchItem(gid, it.id, { status: s, progress: s === "Done" ? 100 : it.progress });

  const addItem = (gid: string) => {
    const name = (draft[gid] || "").trim();
    if (!name) return;
    update(gid, (g) => ({ ...g, items: [...g.items, { id: Date.now(), name, owner: "Amara Reyes", status: "Pending", due: "—", priority: "Medium", progress: 0 }] }));
    setDraft((d) => ({ ...d, [gid]: "" }));
  };

  const filtered = useMemo(
    () => groups.map((g) => ({ ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) })),
    [groups, q]
  );

  const cols = "grid-cols-[44px_minmax(240px,1fr)_90px_160px_120px_140px_170px]";
  const tb = "flex h-9 shrink-0 items-center gap-2 rounded px-2.5 text-[14px] text-[#323338] transition-colors hover:bg-[#E6E9EF]";
  const boardTitle = boards.find((b) => b.k === activeBoard)?.label;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.pill{transition:filter .15s}.pill:hover{filter:brightness(.92)}.row:hover .rowact{opacity:1}@media (hover:none){.rowact{opacity:1!important}}@media (prefers-reduced-motion:reduce){*{transition:none!important}}`}</style>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="shrink-0 px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-[22px] font-bold leading-tight sm:text-[30px]">{boardTitle}</h1>
            <ChevronDown className="h-6 w-6 shrink-0 text-[#676879]" />
            <Star className="hidden h-5 w-5 shrink-0 text-[#676879] hover:text-[#FFCB00] sm:block" />
            <div className="flex-1" />
            <div className="hidden -space-x-2 md:flex">
              {["Amara Reyes", "Daniel Okafor", "Priya Nair"].map((n) => (
                <span key={n} title={n} className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-white" style={{ background: ownerColor(n) }}>{initials(n)}</span>
              ))}
            </div>
            <Link href="/students/new" className="hidden h-9 items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3 text-[14px] hover:bg-[#F5F6F8] md:flex"><UserPlus className="h-[18px] w-[18px]" /> Invite / 4</Link>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-[#F5F6F8]" aria-label="More"><MoreHorizontal className="h-5 w-5" /></button>
          </div>
          <p className="mt-1 text-[14px] text-[#676879] sm:text-[15px]">Track students, fees, and tasks for the current term.</p>

          <div className="mt-3 flex gap-1 overflow-x-auto border-b border-[#E6E9EF]">
            {[["Main table", Table2], ["Kanban", Kanban], ["Calendar", CalendarDays]].map(([t, I]: any) => (
              <button key={t} onClick={() => setView(t)}
                className={`relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t px-3 pb-3 pt-2 text-[15px] transition-colors hover:bg-[#F5F6F8] ${view === t ? "font-medium text-[#323338]" : "text-[#676879]"}`}>
                <I className="h-5 w-5" /> {t}
                {view === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#2563EB]" />}
              </button>
            ))}
            <button className="flex shrink-0 items-center px-2 pb-3 text-[#676879] hover:text-[#323338]" aria-label="Add view"><Plus className="h-5 w-5" /></button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-3">
            <div className="flex shrink-0 overflow-hidden rounded">
              <button className="flex h-9 items-center bg-[#2563EB] px-3.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8]">New item</button>
              <button className="flex h-9 items-center border-l border-white/30 bg-[#2563EB] px-1.5 text-white hover:bg-[#1D4ED8]" aria-label="More"><ChevronDown className="h-5 w-5" /></button>
            </div>
            <div className="ml-1 flex h-9 shrink-0 items-center gap-2 rounded px-2 hover:bg-[#E6E9EF] focus-within:ring-2 focus-within:ring-[#2563EB]">
              <Search className="h-5 w-5" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-16 bg-transparent text-[14px] outline-none placeholder:text-[#323338] focus:w-36 sm:w-24" />
            </div>
            <button className={tb}><Users className="h-5 w-5" /><span className="hidden sm:inline">Person</span></button>
            <button className={tb}><Filter className="h-5 w-5" /><span className="hidden sm:inline">Filter</span></button>
            <button className={tb}><ArrowUpDown className="h-5 w-5" /><span className="hidden sm:inline">Sort</span></button>
            <button className={tb}><EyeOff className="h-5 w-5" /><span className="hidden sm:inline">Hide</span></button>
            <button className={tb}><Layers className="h-5 w-5" /><span className="hidden sm:inline">Group by</span></button>
          </div>
        </div>

        {/* GROUPS */}
        <div className="flex-1 overflow-auto px-4 pb-32 sm:px-6">
          <div className="space-y-8 md:min-w-[940px]">
            {filtered.map((g) => (
              <section key={g.id}>
                <div className="mb-1.5 flex items-center gap-1">
                  <button onClick={() => update(g.id, (x) => ({ ...x, open: !x.open }))} className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#E6E9EF]" style={{ color: g.color }} aria-label="Toggle group">
                    <ChevronDown className={`h-6 w-6 transition-transform ${g.open ? "" : "-rotate-90"}`} />
                  </button>
                  <h2 className="rounded px-1 text-[19px] font-medium" style={{ color: g.color }}>{g.title}</h2>
                  <span className="ml-1 text-[14px] text-[#9699A6]">{g.items.length} items</span>
                </div>

                {g.open && (
                  <>
                    {/* DESKTOP / TABLET TABLE */}
                    <div className="hidden rounded-l border-y border-r border-[#E6E9EF] md:block">
                      <div className={`grid ${cols} border-b border-[#E6E9EF] bg-white text-[14px]`}>
                        <div className="flex items-center justify-center border-l-[6px] py-2.5" style={{ borderColor: g.color }}><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" /></div>
                        {["Item", "Person", "Status", "Due date", "Priority", "Progress"].map((h, i) => (
                          <div key={h} className={`border-l border-[#E6E9EF] px-3 py-2.5 ${i === 0 ? "" : "text-center"}`}>{h}</div>
                        ))}
                      </div>
                      {g.items.map((it) => (
                        <div key={it.id} className={`row grid ${cols} border-b border-[#E6E9EF] bg-white text-[15px] transition-colors hover:bg-[#F5F6F8]`}>
                          <div className="flex items-center justify-center border-l-[6px]" style={{ borderColor: g.color }}>
                            <input type="checkbox" checked={!!it.checked} onChange={(e) => patchItem(g.id, it.id, { checked: e.target.checked })} className="h-4 w-4 accent-[#2563EB]" />
                          </div>
                          <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
                            <span className="truncate">{it.name}</span>
                            <button className="rowact ml-auto text-[#9699A6] opacity-0 transition-opacity hover:text-[#2563EB]" aria-label="Add update"><MessageSquarePlus className="h-5 w-5" /></button>
                          </div>
                          <div className="flex items-center justify-center border-l border-[#E6E9EF]">
                            <span title={it.owner} className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: ownerColor(it.owner) }}>{initials(it.owner)}</span>
                          </div>
                          <Pill<Status> id={`s${it.id}`} value={it.status} colors={STATUS} onPick={(s) => setStatus(g.id, it, s)} menu={menu} setMenu={setMenu} className="border-l border-[#E6E9EF] p-1" />
                          <div className="flex items-center justify-center border-l border-[#E6E9EF] text-[14px]">
                            <span className="rounded-full border border-[#E6E9EF] px-3 py-0.5">{it.due}</span>
                          </div>
                          <Pill<Priority> id={`p${it.id}`} value={it.priority} colors={PRIORITY} onPick={(p) => patchItem(g.id, it.id, { priority: p })} menu={menu} setMenu={setMenu} className="border-l border-[#E6E9EF] p-1" />
                          <div className="flex items-center gap-2 border-l border-[#E6E9EF] px-3">
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E6E9EF]"><div className="h-full rounded-full bg-[#00C875] transition-[width] duration-300" style={{ width: `${it.progress}%` }} /></div>
                            <span className="w-10 text-right text-[13px] text-[#676879]">{it.progress}%</span>
                          </div>
                        </div>
                      ))}
                      <div className={`grid ${cols} border-b border-[#E6E9EF] bg-white`}>
                        <div className="border-l-[6px] opacity-50" style={{ borderColor: g.color }} />
                        <div className="col-span-6 flex items-center px-3">
                          <input value={draft[g.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [g.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addItem(g.id)}
                            placeholder="+ Add item" className="h-10 w-full rounded bg-transparent px-1 text-[15px] outline-none placeholder:text-[#676879] focus:ring-2 focus:ring-[#2563EB]" />
                        </div>
                      </div>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="space-y-3 md:hidden">
                      {g.items.map((it) => (
                        <div key={it.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: `6px solid ${g.color}` }}>
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={!!it.checked} onChange={(e) => patchItem(g.id, it.id, { checked: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-[#2563EB]" />
                            <p className="min-w-0 flex-1 text-[16px] font-medium leading-snug">{it.name}</p>
                            <span title={it.owner} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: ownerColor(it.owner) }}>{initials(it.owner)}</span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Pill<Status> id={`ms${it.id}`} value={it.status} colors={STATUS} onPick={(s) => setStatus(g.id, it, s)} menu={menu} setMenu={setMenu} />
                            <Pill<Priority> id={`mp${it.id}`} value={it.priority} colors={PRIORITY} onPick={(p) => patchItem(g.id, it.id, { priority: p })} menu={menu} setMenu={setMenu} />
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-[13px] text-[#676879]">
                            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {it.due}</span>
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E6E9EF]"><div className="h-full rounded-full bg-[#00C875] transition-[width] duration-300" style={{ width: `${it.progress}%` }} /></div>
                            <span className="w-9 text-right">{it.progress}%</span>
                          </div>
                        </div>
                      ))}
                      <div className="rounded-lg border border-dashed border-[#C5C7D0] px-3">
                        <input value={draft[g.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [g.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addItem(g.id)}
                          placeholder="+ Add item" className="h-11 w-full bg-transparent text-[16px] outline-none placeholder:text-[#676879]" />
                      </div>
                    </div>
                  </>
                )}
              </section>
            ))}
            <button className="flex h-10 items-center gap-2 rounded border border-[#C5C7D0] px-4 text-[14px] hover:bg-[#F5F6F8]">
              <Plus className="h-5 w-5" /> Add new group
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
