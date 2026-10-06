"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, CalendarCheck, Star, LayoutGrid, Search, Bell, Inbox, UserPlus, Puzzle, HelpCircle,
  ChevronDown, ChevronRight, Plus, Users, Wallet, GraduationCap, BarChart3, Bus,
  Filter, ArrowUpDown, EyeOff, Layers, MoreHorizontal, MessageSquarePlus, Table2, Kanban,
  CalendarDays, Sparkles, PanelLeftClose, Menu, X, Banknote, CircleCheck, Clock, TriangleAlert,
} from "lucide-react";

type Status = "Paid" | "Partial" | "Pending" | "Overdue";
type Item = { id: number; student: string; cls: string; amount: number; paid: number; status: Status; due: string; checked?: boolean };
type Group = { id: string; title: string; color: string; open: boolean; items: Item[] };

const STATUS: Record<Status, string> = { Paid: "var(--theme-success)", Partial: "var(--theme-warning)", Pending: "var(--theme-pending)", Overdue: "var(--theme-danger)" };
const OWNER_COLORS = ["var(--theme-info)", "var(--theme-accent-2)", "var(--theme-success)", "#FF158A", "var(--theme-warning)", "var(--theme-success-text)"];
const rs = (n: number) => "Rs " + n.toLocaleString("en-PK");
const initials = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2);
const color = (n: string) => OWNER_COLORS[n.length % OWNER_COLORS.length];

const rail = [
  { k: "home", Icon: Home, label: "Home" }, { k: "work", Icon: CalendarCheck, label: "My work" },
  { k: "fav", Icon: Star, label: "Favorites" }, { k: "apps", Icon: LayoutGrid, label: "Apps" },
];
const boards = [
  { k: "students", label: "Student management", Icon: Users }, { k: "attendance", label: "Attendance", Icon: CalendarCheck },
  { k: "fees", label: "Fee management", Icon: Wallet }, { k: "exams", label: "Exams & results", Icon: GraduationCap },
  { k: "transport", label: "Transport routes", Icon: Bus }, { k: "reports", label: "Reports dashboard", Icon: BarChart3 },
];

const seed: Group[] = [
  { id: "g1", title: "Overdue", color: "var(--theme-danger)", open: true, items: [
    { id: 1, student: "Hamza Khan", cls: "10-A", amount: 18000, paid: 0, status: "Overdue", due: "Sep 10" },
    { id: 2, student: "Sara Ahmed", cls: "9-B", amount: 16500, paid: 6000, status: "Overdue", due: "Sep 12" },
    { id: 3, student: "Bilal Raza", cls: "8-A", amount: 15000, paid: 0, status: "Overdue", due: "Sep 15" },
  ]},
  { id: "g2", title: "Due this month", color: "var(--theme-warning)", open: true, items: [
    { id: 4, student: "Ayesha Malik", cls: "10-A", amount: 18000, paid: 9000, status: "Partial", due: "Oct 05" },
    { id: 5, student: "Usman Tariq", cls: "7-C", amount: 14000, paid: 0, status: "Pending", due: "Oct 07" },
    { id: 6, student: "Zainab Fatima", cls: "9-A", amount: 16500, paid: 0, status: "Pending", due: "Oct 10" },
    { id: 7, student: "Ali Hassan", cls: "6-B", amount: 13000, paid: 5000, status: "Partial", due: "Oct 10" },
  ]},
  { id: "g3", title: "Paid", color: "var(--theme-success)", open: false, items: [
    { id: 8, student: "Fatima Noor", cls: "10-B", amount: 18000, paid: 18000, status: "Paid", due: "Sep 05" },
    { id: 9, student: "Omar Farooq", cls: "8-B", amount: 15000, paid: 15000, status: "Paid", due: "Sep 05" },
  ]},
];

function Pill({ id, value, onPick, menu, setMenu, className = "" }: {
  id: string; value: Status; onPick: (v: Status) => void; menu: string | null; setMenu: (v: string | null) => void; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <button onClick={(e) => { e.stopPropagation(); setMenu(menu === id ? null : id); }}
        className="pill h-full min-h-9 w-full rounded-sm px-2 text-[14px] font-medium text-white" style={{ background: STATUS[value] }}>{value}</button>
      {menu === id && (
        <div className="absolute left-1/2 top-full z-30 mt-1 w-40 -translate-x-1/2 space-y-1 rounded-lg bg-[var(--theme-surface)] p-2 shadow-xl ring-1 ring-[var(--theme-border)]">
          {(Object.keys(STATUS) as Status[]).map((o) => (
            <button key={o} onClick={(e) => { e.stopPropagation(); onPick(o); setMenu(null); }}
              className="pill block h-9 w-full rounded text-[14px] font-medium text-white" style={{ background: STATUS[o] }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const boardRoutes: Record<string, string> = {
  students: "/",
  fees: "/free",
};

export default function Page() {
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(true);
  const [activeRail, setActiveRail] = useState("work");
  const [activeBoard, setActiveBoard] = useState("fees");
  const [view, setView] = useState("Main table");
  const [groups, setGroups] = useState<Group[]>(seed);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => { if (window.innerWidth < 1024) setSideOpen(false); }, []);

  const selectBoard = (k: string) => {
    const route = boardRoutes[k];
    if (route && route !== "/free") {
      router.push(route);
      return;
    }
    setActiveBoard(k);
    if (window.innerWidth < 1024) setSideOpen(false);
  };

  const update = (gid: string, fn: (g: Group) => Group) => setGroups((p) => p.map((g) => (g.id === gid ? fn(g) : g)));
  const patch = (gid: string, id: number, p: Partial<Item>) => update(gid, (g) => ({ ...g, items: g.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  const setStatus = (gid: string, it: Item, s: Status) => patch(gid, it.id, { status: s, paid: s === "Paid" ? it.amount : s === "Pending" || s === "Overdue" ? Math.min(it.paid, it.amount) : it.paid });
  const addItem = (gid: string) => {
    const student = (draft[gid] || "").trim();
    if (!student) return;
    update(gid, (g) => ({ ...g, items: [...g.items, { id: Date.now(), student, cls: "—", amount: 15000, paid: 0, status: "Pending", due: "—" }] }));
    setDraft((d) => ({ ...d, [gid]: "" }));
  };

  const all = groups.flatMap((g) => g.items);
  const billed = all.reduce((s, i) => s + i.amount, 0);
  const collected = all.reduce((s, i) => s + i.paid, 0);
  const overdue = all.filter((i) => i.status === "Overdue").reduce((s, i) => s + (i.amount - i.paid), 0);
  const stats = [
    { label: "Total billed", value: rs(billed), Icon: Banknote, c: "var(--theme-primary)", bg: "var(--theme-info-soft)" },
    { label: "Collected", value: rs(collected), Icon: CircleCheck, c: "var(--theme-success)", bg: "var(--theme-success-soft)" },
    { label: "Pending", value: rs(billed - collected), Icon: Clock, c: "var(--theme-warning)", bg: "var(--theme-warning-soft)" },
    { label: "Overdue", value: rs(overdue), Icon: TriangleAlert, c: "var(--theme-danger)", bg: "var(--theme-danger-soft)" },
  ];

  const filtered = useMemo(() => groups.map((g) => ({ ...g, items: g.items.filter((i) => i.student.toLowerCase().includes(q.toLowerCase())) })), [groups, q]);

  const cols = "grid-cols-[44px_minmax(220px,1fr)_80px_120px_120px_140px_110px_170px]";
  const tb = "flex h-9 shrink-0 items-center gap-2 rounded px-2.5 text-[14px] text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-border)]";
  const bar = (it: Item) => Math.round((it.paid / it.amount) * 100);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.pill{transition:filter .15s}.pill:hover{filter:brightness(.92)}.row:hover .rowact{opacity:1}@media (hover:none){.rowact{opacity:1!important}}@media (prefers-reduced-motion:reduce){*{transition:none!important}}`}</style>

      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--theme-chrome)] font-[Figtree,ui-sans-serif,system-ui,sans-serif] text-[var(--theme-text)] antialiased" onClick={() => setMenu(null)}>
        {/* TOP BAR */}
        <header className="flex h-14 shrink-0 items-center gap-2 px-3 text-white sm:gap-3 sm:px-4">
          <button onClick={(e) => { e.stopPropagation(); setSideOpen((v) => !v); }} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Toggle menu">
            {sideOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[3px]"><span className="h-5 w-2.5 rounded-full bg-[var(--theme-badge)]" /><span className="h-6 w-2.5 rounded-full bg-[var(--theme-star)]" /><span className="h-4 w-2.5 rounded-full bg-[var(--theme-success)]" /></div>
            <span className="text-[20px] font-bold">edu<span className="hidden font-normal text-white/80 sm:inline"> work management</span></span>
          </div>
          <button className="ml-2 hidden items-center gap-2 rounded-md bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] px-3.5 py-2 text-[14px] font-semibold md:flex"><Sparkles className="h-4 w-4" /> See plans</button>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[{ I: Bell, c: "" }, { I: Inbox, c: "hidden sm:flex" }, { I: UserPlus, c: "hidden md:flex" }, { I: Puzzle, c: "hidden md:flex" }, { I: Search, c: "" }, { I: HelpCircle, c: "hidden sm:flex" }].map(({ I, c }, i) => (
              <button key={i} className={`relative h-10 w-10 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white ${c || "flex"}`}>
                <I className="h-[22px] w-[22px]" />
                {i === 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--theme-badge)] px-1 text-[10px] font-bold">1</span>}
              </button>
            ))}
            <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--theme-accent-2)] text-[13px] font-bold sm:ml-2">AR</button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {/* RAIL */}
          <nav className="hidden w-16 shrink-0 flex-col items-center gap-1.5 py-2 md:flex">
            {rail.map(({ k, Icon, label }) => (
              <button key={k} title={label} onClick={() => setActiveRail(k)} className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${activeRail === k ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                <Icon className="h-6 w-6" strokeWidth={1.8} />
              </button>
            ))}
            <div className="flex-1" />
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-[var(--theme-accent)] text-base font-extrabold text-white">B</div>
          </nav>

          {sideOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSideOpen(false)} />}

          {/* SIDEBAR */}
          <aside onClick={(e) => e.stopPropagation()}
            className={`z-40 shrink-0 overflow-hidden bg-[var(--theme-sidebar)] transition-[width] duration-200 max-lg:fixed max-lg:bottom-16 max-lg:left-0 max-lg:top-14 md:max-lg:bottom-0 md:max-lg:left-16 lg:relative lg:rounded-tl-xl ${sideOpen ? "w-[288px] max-w-[85vw]" : "w-0"}`}>
            <div className="flex h-full w-[288px] max-w-[85vw] flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <p className="text-[22px] font-bold">Work</p>
                <button onClick={() => setSideOpen(false)} className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]" aria-label="Collapse sidebar"><PanelLeftClose className="h-5 w-5" /></button>
              </div>
              <div className="px-3">
                <button className="flex w-full items-center gap-2.5 rounded-lg bg-[var(--theme-surface)] px-3 py-2.5 text-left shadow-sm ring-1 ring-[var(--theme-border)] hover:ring-[var(--theme-border-strong)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--theme-accent)] text-[14px] font-bold text-white">B</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">BisonsEduCore360</span>
                  <ChevronDown className="h-5 w-5 text-[var(--theme-text-muted)]" />
                </button>
              </div>
              <div className="flex gap-2 px-3 pt-3">
                <div className="flex h-10 flex-1 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 focus-within:border-[var(--theme-primary)]">
                  <Search className="h-[18px] w-[18px] text-[var(--theme-text-muted)]" />
                  <input placeholder="Search" className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--theme-text-faint)]" />
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]" aria-label="Add board"><Plus className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1 px-4 text-[13px] font-semibold text-[var(--theme-text-muted)]"><ChevronDown className="h-4 w-4" /> School boards</div>
              <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
                {boards.map(({ k, label, Icon }) => (
                  <button key={k} onClick={() => selectBoard(k)}
                    className={`flex h-10 w-full items-center gap-2.5 rounded px-2.5 text-[15px] transition-colors ${activeBoard === k ? "bg-[var(--theme-primary-soft)] font-medium text-[var(--theme-primary-hover)]" : "hover:bg-[var(--theme-border)]"}`}>
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} /> <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className={`relative flex min-w-0 flex-1 flex-col bg-[var(--theme-surface)] max-md:rounded-t-xl ${sideOpen ? "" : "md:rounded-tl-xl"}`}>
            {!sideOpen && (
              <button onClick={() => setSideOpen(true)} className="absolute left-0 top-6 z-10 hidden h-8 w-6 items-center justify-center rounded-r bg-[var(--theme-surface)] text-[var(--theme-text-muted)] shadow ring-1 ring-[var(--theme-border)] hover:text-[var(--theme-primary)] lg:flex" aria-label="Expand sidebar"><ChevronRight className="h-5 w-5" /></button>
            )}

            <div className="shrink-0 px-4 pt-4 sm:px-6">
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 truncate text-[22px] font-bold leading-tight sm:text-[30px]">Fee management</h1>
                <ChevronDown className="h-6 w-6 shrink-0 text-[var(--theme-text-muted)]" />
                <Star className="hidden h-5 w-5 shrink-0 text-[var(--theme-text-muted)] hover:text-[var(--theme-star)] sm:block" />
                <div className="flex-1" />
                <div className="hidden -space-x-2 md:flex">
                  {["Priya Nair", "Amara Reyes", "Liam Bennett"].map((n) => (
                    <span key={n} title={n} className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-white" style={{ background: color(n) }}>{initials(n)}</span>
                  ))}
                </div>
                <button className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] px-3 text-[14px] hover:bg-[var(--theme-hover)] md:flex"><UserPlus className="h-[18px] w-[18px]" /> Invite / 3</button>
                <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-[var(--theme-hover)]" aria-label="More"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
              <p className="mt-1 text-[14px] text-[var(--theme-text-muted)] sm:text-[15px]">Track monthly fee collection, partial payments, and overdue balances.</p>

              <div className="mt-3 flex gap-1 overflow-x-auto border-b border-[var(--theme-border)]">
                {[["Main table", Table2], ["Kanban", Kanban], ["Calendar", CalendarDays]].map(([t, I]: any) => (
                  <button key={t} onClick={() => setView(t)} className={`relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t px-3 pb-3 pt-2 text-[15px] transition-colors hover:bg-[var(--theme-hover)] ${view === t ? "font-medium text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}>
                    <I className="h-5 w-5" /> {t}
                    {view === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[var(--theme-primary)]" />}
                  </button>
                ))}
                <button className="flex shrink-0 items-center px-2 pb-3 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]" aria-label="Add view"><Plus className="h-5 w-5" /></button>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto py-3">
                <div className="flex shrink-0 overflow-hidden rounded">
                  <button className="flex h-9 items-center bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">New fee</button>
                  <button className="flex h-9 items-center border-l border-white/30 bg-[var(--theme-primary)] px-1.5 text-white hover:bg-[var(--theme-primary-hover)]" aria-label="More"><ChevronDown className="h-5 w-5" /></button>
                </div>
                <div className="ml-1 flex h-9 shrink-0 items-center gap-2 rounded px-2 hover:bg-[var(--theme-border)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
                  <Search className="h-5 w-5" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-16 bg-transparent text-[14px] outline-none placeholder:text-[var(--theme-text)] focus:w-36 sm:w-24" />
                </div>
                {[[Users, "Person"], [Filter, "Filter"], [ArrowUpDown, "Sort"], [EyeOff, "Hide"], [Layers, "Group by"]].map(([I, t]: any) => (
                  <button key={t} className={tb}><I className="h-5 w-5" /><span className="hidden sm:inline">{t}</span></button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto px-4 pb-32 sm:px-6">
              {/* SUMMARY CARDS */}
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(({ label, value, Icon, c, bg }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 sm:p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12" style={{ background: bg, color: c }}><Icon className="h-5 w-5 sm:h-6 sm:w-6" /></span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-[var(--theme-text-muted)] sm:text-[14px]">{label}</span>
                      <span className="block truncate text-[16px] font-bold sm:text-[20px]">{value}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-8 md:min-w-[1040px]">
                {filtered.map((g) => (
                  <section key={g.id}>
                    <div className="mb-1.5 flex items-center gap-1">
                      <button onClick={() => update(g.id, (x) => ({ ...x, open: !x.open }))} className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--theme-border)]" style={{ color: g.color }} aria-label="Toggle group">
                        <ChevronDown className={`h-6 w-6 transition-transform ${g.open ? "" : "-rotate-90"}`} />
                      </button>
                      <h2 className="px-1 text-[19px] font-medium" style={{ color: g.color }}>{g.title}</h2>
                      <span className="ml-1 text-[14px] text-[var(--theme-text-faint)]">{g.items.length} items</span>
                    </div>

                    {g.open && (
                      <>
                        {/* TABLE */}
                        <div className="hidden rounded-l border-y border-r border-[var(--theme-border)] md:block">
                          <div className={`grid ${cols} border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px]`}>
                            <div className="flex items-center justify-center border-l-[6px] py-2.5" style={{ borderColor: g.color }}><input type="checkbox" className="h-4 w-4 accent-[var(--theme-primary)]" /></div>
                            {["Student", "Class", "Amount", "Paid", "Status", "Due date", "Collected"].map((h, i) => (
                              <div key={h} className={`border-l border-[var(--theme-border)] px-3 py-2.5 ${i === 0 ? "" : "text-center"}`}>{h}</div>
                            ))}
                          </div>
                          {g.items.map((it) => (
                            <div key={it.id} className={`row grid ${cols} border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[15px] transition-colors hover:bg-[var(--theme-hover)]`}>
                              <div className="flex items-center justify-center border-l-[6px]" style={{ borderColor: g.color }}>
                                <input type="checkbox" checked={!!it.checked} onChange={(e) => patch(g.id, it.id, { checked: e.target.checked })} className="h-4 w-4 accent-[var(--theme-primary)]" />
                              </div>
                              <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: color(it.student) }}>{initials(it.student)}</span>
                                <span className="truncate">{it.student}</span>
                                <button className="rowact ml-auto text-[var(--theme-text-faint)] opacity-0 transition-opacity hover:text-[var(--theme-primary)]" aria-label="Add update"><MessageSquarePlus className="h-5 w-5" /></button>
                              </div>
                              <div className="flex items-center justify-center border-l border-[var(--theme-border)] text-[14px] text-[var(--theme-text-muted)]">{it.cls}</div>
                              <div className="flex items-center justify-center border-l border-[var(--theme-border)] text-[14px]">{rs(it.amount)}</div>
                              <div className="flex items-center justify-center border-l border-[var(--theme-border)] text-[14px] font-medium">{rs(it.paid)}</div>
                              <Pill id={`s${it.id}`} value={it.status} onPick={(s) => setStatus(g.id, it, s)} menu={menu} setMenu={setMenu} className="border-l border-[var(--theme-border)] p-1" />
                              <div className="flex items-center justify-center border-l border-[var(--theme-border)] text-[14px]"><span className="rounded-full border border-[var(--theme-border)] px-3 py-0.5">{it.due}</span></div>
                              <div className="flex items-center gap-2 border-l border-[var(--theme-border)] px-3">
                                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--theme-border)]"><div className="h-full rounded-full bg-[var(--theme-success)] transition-[width] duration-300" style={{ width: `${bar(it)}%` }} /></div>
                                <span className="w-10 text-right text-[13px] text-[var(--theme-text-muted)]">{bar(it)}%</span>
                              </div>
                            </div>
                          ))}
                          <div className={`grid ${cols} border-b border-[var(--theme-border)] bg-[var(--theme-surface)]`}>
                            <div className="border-l-[6px] opacity-50" style={{ borderColor: g.color }} />
                            <div className="col-span-7 flex items-center px-3">
                              <input value={draft[g.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [g.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addItem(g.id)}
                                placeholder="+ Add student fee" className="h-10 w-full rounded bg-transparent px-1 text-[15px] outline-none placeholder:text-[var(--theme-text-muted)] focus:ring-2 focus:ring-[var(--theme-primary)]" />
                            </div>
                          </div>
                        </div>

                        {/* MOBILE CARDS */}
                        <div className="space-y-3 md:hidden">
                          {g.items.map((it) => (
                            <div key={it.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: `6px solid ${g.color}` }}>
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={!!it.checked} onChange={(e) => patch(g.id, it.id, { checked: e.target.checked })} className="h-5 w-5 shrink-0 accent-[var(--theme-primary)]" />
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: color(it.student) }}>{initials(it.student)}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[16px] font-medium">{it.student}</p>
                                  <p className="text-[13px] text-[var(--theme-text-muted)]">Class {it.cls} · Due {it.due}</p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-[12px] text-[var(--theme-text-muted)]">Paid / Amount</p>
                                  <p className="text-[15px] font-semibold">{rs(it.paid)} <span className="font-normal text-[var(--theme-text-muted)]">/ {rs(it.amount)}</span></p>
                                </div>
                                <Pill id={`m${it.id}`} value={it.status} onPick={(s) => setStatus(g.id, it, s)} menu={menu} setMenu={setMenu} className="w-32" />
                              </div>
                              <div className="mt-3 flex items-center gap-3 text-[13px] text-[var(--theme-text-muted)]">
                                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--theme-border)]"><div className="h-full rounded-full bg-[var(--theme-success)] transition-[width] duration-300" style={{ width: `${bar(it)}%` }} /></div>
                                <span className="w-9 text-right">{bar(it)}%</span>
                              </div>
                            </div>
                          ))}
                          <div className="rounded-lg border border-dashed border-[var(--theme-border-strong)] px-3">
                            <input value={draft[g.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [g.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addItem(g.id)}
                              placeholder="+ Add student fee" className="h-11 w-full bg-transparent text-[16px] outline-none placeholder:text-[var(--theme-text-muted)]" />
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                ))}
                <button className="flex h-10 items-center gap-2 rounded border border-[var(--theme-border-strong)] px-4 text-[14px] hover:bg-[var(--theme-hover)]"><Plus className="h-5 w-5" /> Add new group</button>
              </div>
            </div>
          </main>
        </div>

        {/* BOTTOM NAV */}
        <nav className="flex h-16 shrink-0 items-center justify-around border-t border-white/10 bg-[var(--theme-chrome)] text-white md:hidden">
          {rail.map(({ k, Icon, label }) => (
            <button key={k} onClick={() => setActiveRail(k)} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 text-[12px] ${activeRail === k ? "text-white" : "text-white/60"}`}>
              <Icon className="h-6 w-6" strokeWidth={1.8} /> {label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}