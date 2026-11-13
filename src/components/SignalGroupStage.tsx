"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { WordReveal } from "@/components/hero/AuroraHero";
import SaveButton from "@/components/SaveButton";
import SignalGroupLogo from "@/components/SignalGroupLogo";
import { signalGroupSummary } from "@/lib/signal-group-summary";
import { signalFiltersFromSearch, signalGroupMatchesFilters } from "@/lib/signal-group-filters";
import { savedStore } from "@/lib/local-store";
import {
  formatSignalDate,
  SIGNAL_EXTRA_LABELS,
  SIGNAL_EXTRA_ORDER,
  SIGNAL_MARKET_LABELS,
  SIGNAL_MARKET_ORDER,
  SIGNAL_PRICE_LABELS,
  SIGNAL_PRICE_ORDER,
  SIGNAL_STYLE_LABELS,
  SIGNAL_STYLE_ORDER,
  type SignalExtra,
  type SignalGroupView,
  type SignalMarket,
  type SignalPrice,
  type SignalStyle,
} from "@/lib/signal-group-types";

const PAGE = 9;
const SPOTLIGHT = 6;

const SHORT: Record<SignalMarket, string> = {
  gold: "Gold",
  "forex-majors": "Forex majors",
  "forex-minors": "Forex minors",
  indices: "Indices",
  crypto: "Crypto",
  oil: "Oil",
  "stocks-options": "Stocks & options",
};

type SortKey = "listed" | "name" | "members";

type Room = {
  market: SignalMarket | "all";
  query: string;
  sort: SortKey;
  page: number;
  styles: SignalStyle[];
  prices: SignalPrice[];
  extras: SignalExtra[];
  languages: string[];
  savedOnly: boolean;
  panel: string | null;
};

export default function SignalGroupStage({
  groups,
  lede,
}: {
  groups: SignalGroupView[];
  lede: string;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading groups…</p>}>
      <Stage groups={groups} lede={lede} />
    </Suspense>
  );
}

function Stage({ groups, lede }: { groups: SignalGroupView[]; lede: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const saved = savedStore.use();
  const savedIds = useMemo(
    () => new Set(saved.filter((item) => item.kind === "signal").map((item) => item.id)),
    [saved],
  );

  const [room, setRoom] = useState<Room>(() => readRoom(key));
  const written = useRef(key);
  const resultsRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const skipScroll = useRef(true);

  useEffect(() => {
    if (key === written.current) return;
    written.current = key;
    setRoom(readRoom(key));
  }, [key]);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function commit(next: Room, scroll?: boolean) {
    const qs = writeRoom(next);
    written.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setRoom(next);
    if (scroll) {
      skipScroll.current = false;
    }
  }

  useEffect(() => {
    if (skipScroll.current) return;
    skipScroll.current = true;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [room.page, room.market, room.savedOnly]);

  const counts = useMemo(() => {
    const map = new Map<SignalMarket, number>();
    for (const id of SIGNAL_MARKET_ORDER) map.set(id, 0);
    for (const group of groups) {
      for (const id of group.markets) {
        if (map.has(id)) map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [groups]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const group of groups) {
      const language = group.language.trim();
      if (language) set.add(language);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [groups]);

  const filtered = useMemo(() => {
    const list = groups.filter((group) => {
      if (room.savedOnly && !savedIds.has(group.slug)) return false;
      if (!signalGroupMatchesFilters(group, room)) return false;
      return matchesQuery(group, room.query);
    });
    list.sort((a, b) => compareGroups(a, b, room.sort));
    return list;
  }, [groups, room, savedIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const page = Math.min(room.page, pageCount);
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);
  const spotlight = useMemo(
    () => [...groups].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)).slice(0, SPOTLIGHT),
    [groups],
  );

  const landing =
    room.market === "all" &&
    !room.query.trim() &&
    !room.savedOnly &&
    room.styles.length === 0 &&
    room.prices.length === 0 &&
    room.extras.length === 0 &&
    room.languages.length === 0;

  const open = room.panel ? groups.find((group) => group.slug === room.panel) ?? null : null;

  function openPanel(slug: string) {
    commit({ ...room, panel: slug });
  }

  function closePanel() {
    commit({ ...room, panel: null });
  }

  return (
    <div className="sg-stage">
      {landing ? (
        <Landing
          lede={lede}
          total={groups.length}
          query={room.query}
          searchRef={searchRef}
          onQuery={(query) => commit({ ...room, query, page: 1, panel: null })}
        />
      ) : (
        <RoomBar
          room={room}
          total={filtered.length}
          searchRef={searchRef}
          onQuery={(query) => commit({ ...room, query, page: 1 })}
          onBack={() =>
            commit(
              {
                ...room,
                market: "all",
                query: "",
                page: 1,
                savedOnly: false,
                styles: [],
                prices: [],
                extras: [],
                languages: [],
                panel: null,
              },
              true,
            )
          }
        />
      )}

      {landing ? (
        <>
          <section aria-labelledby="sg-markets-heading" className="mt-14 sm:mt-20">
            <div className="max-w-xl">
              <p className="eyebrow">Markets</p>
              <h2 id="sg-markets-heading" className="sg-display mt-2 text-[1.75rem] sm:text-4xl">
                One room at a time
              </h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Pick a market. Each room shows nine groups, then the next nine. Nothing here is a score of results.
              </p>
            </div>
            <div className="sg-gallery mt-8">
              {SIGNAL_MARKET_ORDER.map((id, index) => (
                <button
                  key={id}
                  type="button"
                  className={`sg-tile sg-in ${index === 0 ? "sg-tile-lead" : ""} ${index === 1 ? "sg-tile-wide" : ""}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => commit({ ...room, market: id, page: 1, panel: null }, true)}
                >
                  <span className="sg-tile-line" aria-hidden="true" />
                  <span className="font-mono text-[11px] tracking-[0.16em] text-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="sg-display mt-3 text-2xl sm:text-3xl">{SHORT[id]}</span>
                  <span className="mt-auto pt-6 font-mono text-sm text-muted">
                    <span className="text-foreground">{counts.get(id) ?? 0}</span> groups
                  </span>
                </button>
              ))}
            </div>
          </section>

          <Spotlight groups={spotlight} onOpen={openPanel} />

          {savedIds.size > 0 && (
            <div className="mt-10">
              <button
                type="button"
                className="text-sm font-medium text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground"
                onClick={() => commit({ ...room, savedOnly: true, page: 1, panel: null }, true)}
              >
                Saved in this browser ({savedIds.size})
              </button>
            </div>
          )}
        </>
      ) : (
        <section ref={resultsRef} aria-labelledby="sg-results-heading" className="mt-8 scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{room.savedOnly ? "Saved" : "Room"}</p>
              <h2 id="sg-results-heading" className="sg-display mt-2 text-3xl sm:text-4xl">
                {room.savedOnly ? "Saved groups" : room.market === "all" ? "Search" : SHORT[room.market]}
              </h2>
            </div>
            <p className="font-mono text-sm text-muted">
              {filtered.length === 0
                ? "0 groups"
                : `${(page - 1) * PAGE + 1}–${Math.min(page * PAGE, filtered.length)} of ${filtered.length}`}
            </p>
          </div>

          <MarketSwitch
            active={room.market}
            counts={counts}
            onPick={(market) => commit({ ...room, market, savedOnly: false, page: 1, panel: null })}
          />

          <Filters
            room={room}
            languages={languages}
            onChange={(patch) => commit({ ...room, ...patch, page: 1 })}
          />

          {slice.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center text-muted">
              {room.savedOnly ? "Nothing is saved in this browser yet." : "No groups match."}
            </p>
          ) : (
            <ul key={`${room.market}-${page}-${room.query}-${room.sort}`} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slice.map((group, index) => (
                <li key={group.slug} className="sg-in" style={{ animationDelay: `${index * 45}ms` }}>
                  <MiniCard group={group} onOpen={() => openPanel(group.slug)} />
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <Pager
              page={page}
              pageCount={pageCount}
              onPage={(next) => commit({ ...room, page: next }, true)}
            />
          )}
          <p className="mt-6 max-w-xl text-[13px] leading-5 text-subtle">
            Member counts are snapshots. A larger number is not a better group, and listed order is not a score of
            results.
          </p>
        </section>
      )}

      {open && <GroupDrawer group={open} onClose={closePanel} />}
    </div>
  );
}

function Landing({
  lede,
  total,
  query,
  searchRef,
  onQuery,
}: {
  lede: string;
  total: number;
  query: string;
  searchRef: RefObject<HTMLInputElement | null>;
  onQuery: (query: string) => void;
}) {
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => el.classList.toggle("is-offscreen", !entry.isIntersecting),
      { rootMargin: "80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      aria-labelledby="signal-hero-heading"
      className="aurora-hero relative -mx-4 overflow-hidden px-4 pb-16 pt-10 sm:-mx-6 sm:px-6 sm:pb-20 sm:pt-16 lg:-mx-8 lg:px-8"
    >
      <div aria-hidden="true" className="aurora-layer pointer-events-none absolute inset-0">
        <span className="aurora-blob aurora-blob-a" />
        <span className="aurora-blob aurora-blob-b" />
        <span className="aurora-blob aurora-blob-c" />
        <span className="hero-grid absolute inset-0" />
        <span className="hero-fade absolute inset-x-0 bottom-0 h-32" />
      </div>
      <div className="relative max-w-3xl">
        <p className="eyebrow">Telegram directory</p>
        <h1 id="signal-hero-heading" className="sg-display mt-4 text-[clamp(3rem,8vw,5.5rem)] leading-[0.95]">
          <WordReveal text="Signal Groups" />
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{lede}</p>
        <p className="mt-4 font-mono text-sm text-subtle">{total} groups · shown nine at a time</p>
        <label className="mt-8 block max-w-xl">
          <span className="sr-only">Search signal groups</span>
          <span className="flex items-center gap-3 border-b border-border-strong py-3">
            <Search className="size-4 text-subtle" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search by name"
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-subtle"
            />
          </span>
        </label>
      </div>
    </section>
  );
}

function RoomBar({
  room,
  total,
  searchRef,
  onQuery,
  onBack,
}: {
  room: Room;
  total: number;
  searchRef: RefObject<HTMLInputElement | null>;
  onQuery: (query: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        All markets
      </button>
      <label className="block max-w-xl">
        <span className="sr-only">Search signal groups</span>
        <span className="flex items-center gap-3 border-b border-border py-2">
          <Search className="size-4 text-subtle" aria-hidden="true" />
          <input
            ref={searchRef}
            value={room.query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={room.market === "all" ? "Search by name" : `Search ${SHORT[room.market]}`}
            className="w-full bg-transparent text-base outline-none placeholder:text-subtle"
          />
        </span>
      </label>
      <p className="sr-only" aria-live="polite">
        {total} groups
      </p>
    </div>
  );
}

function MarketSwitch({
  active,
  counts,
  onPick,
}: {
  active: SignalMarket | "all";
  counts: Map<SignalMarket, number>;
  onPick: (market: SignalMarket) => void;
}) {
  return (
    <div className="nav-scroll -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Markets">
      {SIGNAL_MARKET_ORDER.map((id) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onPick(id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-2 text-sm ${
              selected ? "border-foreground font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {SHORT[id]}
            <span className="font-mono text-xs text-subtle">{counts.get(id) ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function Filters({
  room,
  languages,
  onChange,
}: {
  room: Room;
  languages: string[];
  onChange: (patch: Partial<Room>) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="sg-sort">
          Sort
        </label>
        <select
          id="sg-sort"
          value={room.sort}
          onChange={(event) => onChange({ sort: event.target.value as SortKey })}
          className="field h-11 w-auto min-w-36"
        >
          <option value="listed">Listed order</option>
          <option value="name">Name</option>
          <option value="members">Member count</option>
        </select>
        <button
          type="button"
          aria-pressed={room.savedOnly}
          onClick={() => onChange({ savedOnly: !room.savedOnly })}
          className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${
            room.savedOnly ? "border-foreground text-foreground" : "border-border text-muted"
          }`}
        >
          Saved
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SIGNAL_PRICE_ORDER.map((price) => {
          const on = room.prices.includes(price);
          return (
            <button
              key={price}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange({
                  prices: on ? room.prices.filter((item) => item !== price) : [...room.prices, price],
                })
              }
              className={`inline-flex min-h-10 items-center rounded-full border px-3 text-sm ${
                on ? "border-foreground bg-foreground text-background" : "border-border text-muted"
              }`}
            >
              {SIGNAL_PRICE_LABELS[price]}
            </button>
          );
        })}
      </div>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
          Style, language and extras
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {SIGNAL_STYLE_ORDER.map((style) => {
              const on = room.styles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange({
                      styles: on ? room.styles.filter((item) => item !== style) : [...room.styles, style],
                    })
                  }
                  className={`inline-flex min-h-10 items-center rounded-full border px-3 text-sm ${
                    on ? "border-foreground text-foreground" : "border-border text-muted"
                  }`}
                >
                  {SIGNAL_STYLE_LABELS[style]}
                </button>
              );
            })}
          </div>
          <label className="block max-w-xs text-sm text-muted">
            Language
            <select
              value={room.languages[0] ?? ""}
              onChange={(event) => onChange({ languages: event.target.value ? [event.target.value] : [] })}
              className="field mt-1 h-11 w-full"
            >
              <option value="">Any</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {SIGNAL_EXTRA_ORDER.map((extra) => {
              const on = room.extras.includes(extra);
              return (
                <button
                  key={extra}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange({
                      extras: on ? room.extras.filter((item) => item !== extra) : [...room.extras, extra],
                    })
                  }
                  className={`inline-flex min-h-10 items-center rounded-full border px-3 text-sm ${
                    on ? "border-foreground text-foreground" : "border-border text-muted"
                  }`}
                >
                  {SIGNAL_EXTRA_LABELS[extra]}
                </button>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}

function Spotlight({
  groups,
  onOpen,
}: {
  groups: SignalGroupView[];
  onOpen: (slug: string) => void;
}) {
  const scroller = useRef<HTMLUListElement>(null);

  function nudge(direction: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 320), behavior: "smooth" });
  }

  return (
    <section aria-labelledby="sg-look-heading" className="mt-16 sm:mt-24">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="eyebrow">A first look</p>
          <h2 id="sg-look-heading" className="sg-display mt-2 text-[1.75rem] sm:text-4xl">
            Six from the list
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            These are the first six in listed order. That order is not a score of results.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <IconButton label="Previous groups" onClick={() => nudge(-1)}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton label="Next groups" onClick={() => nudge(1)}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>
      <ul
        ref={scroller}
        className="sg-rail nav-scroll mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {groups.map((group) => (
          <li key={group.slug} className="w-[min(100%,18rem)] shrink-0 snap-start">
            <MiniCard group={group} onOpen={() => onOpen(group.slug)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MiniCard({ group, onOpen }: { group: SignalGroupView; onOpen: () => void }) {
  const market = SIGNAL_MARKET_ORDER.find((id) => group.markets.includes(id));
  return (
    <article className="sg-card relative flex h-full min-h-40 flex-col rounded-2xl border border-border bg-surface p-5">
      <p className="text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">
        {market ? SHORT[market] : "Telegram"}
      </p>
      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">
        <button type="button" onClick={onOpen} className="card-stretch rounded-2xl text-left">
          <span className="line-clamp-2">{group.name}</span>
          <span className="sr-only">. Open details</span>
        </button>
      </h3>
      <p className="mt-3 font-mono text-sm text-muted">{group.memberCount ?? "Members not listed"}</p>
      <div className="relative z-10 mt-auto pt-5">
        <JoinLink group={group} />
      </div>
    </article>
  );
}

function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-foreground disabled:text-subtle"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Previous
      </button>
      <p className="font-mono text-sm text-muted">
        {page} / {pageCount}
      </p>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-foreground disabled:text-subtle"
      >
        Next 9
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function GroupDrawer({ group, onClose }: { group: SignalGroupView; onClose: () => void }) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const summary = signalGroupSummary(group);
  const markets = SIGNAL_MARKET_ORDER.filter((id) => group.markets.includes(id));
  const membersAsOf = formatSignalDate(group.memberCountAsOf);
  const checked = formatSignalDate(group.checkedOn);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !ref.current) return;
    const items = ref.current.querySelectorAll<HTMLElement>("a, button, input, select, textarea");
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("group", group.slug);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button type="button" aria-label="Close details" className="sg-backdrop absolute inset-0" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`sg-panel relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-glow outline-none sm:max-h-none sm:rounded-none sm:border-y-0 sm:border-r-0 ${
          ready ? "is-in" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-8">
          <p className="text-[11px] font-medium tracking-[0.16em] text-subtle uppercase">Group details</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-full border border-border text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="flex items-start gap-3">
            <SignalGroupLogo name={group.name} logo={group.logo} size="lg" />
            <div className="min-w-0">
              <h2 id={titleId} className="sg-display break-words text-3xl leading-tight">
                {group.name}
              </h2>
              <p className="mt-2 text-sm text-muted">This is the group&apos;s own name. It is not a result we checked.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <JoinLink group={group} />
            <SaveButton kind="signal" id={group.slug} name={group.name} variant="label" />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm text-foreground"
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-8 text-base leading-7 text-muted">{summary.text}</p>
          {summary.generated && (
            <p className="mt-3 text-sm text-subtle">
              No description was recorded. This summary uses only the fields on the listing.
            </p>
          )}
          <dl className="mt-8 divide-y divide-border border-y border-border">
            <Row label="Category">
              {markets.length ? markets.map((id) => SIGNAL_MARKET_LABELS[id]).join(", ") : "Not stated"}
            </Row>
            <Row label="Platform">Telegram</Row>
            <Row label="Members">
              {group.memberCount
                ? `${group.memberCount}${membersAsOf ? ` · as of ${membersAsOf}` : ""}. Not a ranking.`
                : "Not stated"}
            </Row>
            <Row label="Price">{group.priceLabel || "Not stated"}</Row>
            <Row label="Style">
              {group.styles.length ? group.styles.map((id) => SIGNAL_STYLE_LABELS[id]).join(", ") : "Not stated"}
            </Row>
            <Row label="Language">{group.language || "Not stated"}</Row>
            <Row label="Posting">{group.signalsPerDay || "Not stated"}</Row>
            <Row label="Also listed">
              {group.extras.length ? group.extras.map((id) => SIGNAL_EXTRA_LABELS[id]).join(", ") : "Not stated"}
            </Row>
          </dl>
          {checked && group.checkedOn && (
            <p className="mt-4 text-sm text-subtle">
              Listing checked <time dateTime={group.checkedOn}>{checked}</time>.
            </p>
          )}
          <a
            href={`/signal-groups/${group.slug}`}
            className="mt-6 inline-flex min-h-11 items-center text-sm font-medium underline decoration-border-strong underline-offset-4"
          >
            Open the full page
          </a>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-[11px] font-medium tracking-[0.12em] text-subtle uppercase">{label}</dt>
      <dd className="text-sm leading-6 text-foreground">{children}</dd>
    </div>
  );
}

function JoinLink({ group }: { group: SignalGroupView }) {
  if (!group.telegramUrl) return <span className="text-sm text-muted">No Telegram link</span>;
  return (
    <a
      href={group.telegramUrl}
      target="_blank"
      rel="noopener sponsored"
      className="btn btn-primary relative z-10"
    >
      Join
      <span className="sr-only"> {group.name} on Telegram (opens in a new tab)</span>
    </a>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-full border border-border text-foreground hover:border-foreground"
    >
      {children}
    </button>
  );
}

function readRoom(search: string): Room {
  const filters = signalFiltersFromSearch(search);
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const sortRaw = params.get("sort");
  const sort: SortKey = sortRaw === "name" || sortRaw === "members" ? sortRaw : "listed";
  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return {
    market: filters.market,
    query: filters.query,
    sort,
    page,
    styles: filters.styles,
    prices: filters.prices,
    extras: filters.extras,
    languages: filters.languages,
    savedOnly: params.get("saved") === "1",
    panel: params.get("group"),
  };
}

function writeRoom(room: Room): string {
  const params = new URLSearchParams();
  if (room.market !== "all") params.set("market", room.market);
  if (room.query.trim()) params.set("q", room.query.trim());
  if (room.sort !== "listed") params.set("sort", room.sort);
  if (room.page > 1) params.set("page", String(room.page));
  if (room.styles.length) params.set("style", room.styles.join(","));
  if (room.prices.length) params.set("price", room.prices.join(","));
  if (room.extras.length) params.set("extras", room.extras.join(","));
  if (room.languages.length) params.set("language", room.languages.join(","));
  if (room.savedOnly) params.set("saved", "1");
  if (room.panel) params.set("group", room.panel);
  return params.toString();
}

function matchesQuery(group: SignalGroupView, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    group.name,
    group.description,
    group.language,
    group.priceLabel,
    group.memberCount ?? "",
    ...group.markets.map((id) => SIGNAL_MARKET_LABELS[id]),
    ...group.styles.map((id) => SIGNAL_STYLE_LABELS[id]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function compareGroups(a: SignalGroupView, b: SignalGroupView, sort: SortKey): number {
  if (sort === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (sort === "members") {
    const av = memberValue(a.memberCount);
    const bv = memberValue(b.memberCount);
    if (av == null && bv == null) return a.name.localeCompare(b.name);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (bv !== av) return bv - av;
    return a.name.localeCompare(b.name);
  }
  return a.rank - b.rank || a.name.localeCompare(b.name);
}

function memberValue(raw: string | null): number | null {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*([KkMm])?/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = (match[2] || "").toLowerCase();
  if (unit === "k") return value * 1000;
  if (unit === "m") return value * 1_000_000;
  return value;
}
