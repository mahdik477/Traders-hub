"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Users, X } from "lucide-react";
import { WordReveal } from "@/components/hero/AuroraHero";
import SaveButton from "@/components/SaveButton";
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

/** Decorative identity only. Not a score, and not used on buttons. */
const INK: Record<SignalMarket, string> = {
  gold: "#e0b44a",
  "forex-majors": "#7eb6ff",
  "forex-minors": "#c4a1ff",
  indices: "#7dcea0",
  crypto: "#f0a35e",
  oil: "#6ec6e6",
  "stocks-options": "#e07a7a",
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
      <ScrollGlow />
      <CursorGlow />
      <div key={landing ? "land" : "room"} className="sg-swap">
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
                  style={{ ["--sg-ink-raw" as string]: INK[id], animationDelay: `${index * 70}ms` }}
                  onClick={() => commit({ ...room, market: id, page: 1, panel: null }, true)}
                >
                  <MarketMotif id={id} />
                  <span className="sg-tile-line" aria-hidden="true" />
                  <span className="sg-display relative mt-3 text-2xl sm:text-3xl">{SHORT[id]}</span>
                  <span className="sg-pulse relative" aria-hidden="true">
                    {Array.from({ length: 7 }, (_, dot) => (
                      <span key={dot} style={{ animationDelay: `${dot * 0.12}s` }} />
                    ))}
                  </span>
                  <span className="relative mt-auto pt-4 font-mono text-sm text-muted">
                    <span className="text-foreground">
                      <CountUp to={counts.get(id) ?? 0} />
                    </span>{" "}
                    groups
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
            <ul key={`${room.market}-${page}-${room.query}-${room.sort}`} className="sg-page mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      </div>
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
        <MeshField />
        <span className="hero-fade absolute inset-x-0 bottom-0 h-32" />
      </div>
      <div className="relative max-w-3xl pb-4 pt-6 sm:pt-10">
        <p className="eyebrow">Telegram directory</p>
        <h1 id="signal-hero-heading" className="sg-display mt-4 text-[clamp(3.2rem,8vw,6rem)] leading-[0.92]">
          <WordReveal text="Signal Groups" />
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{lede}</p>
        <p className="mt-5 font-mono text-sm text-subtle">
          <CountUp to={total} /> groups · shown nine at a time
        </p>
        <label className="sg-search mt-8 block max-w-xl">
          <span className="sr-only">Search signal groups</span>
          <span className="flex items-center gap-3 px-4 py-3">
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
          <span className="sg-search flex items-center gap-3 px-4 py-2.5">
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
      <PriceRail
        prices={room.prices}
        onChange={(prices) => onChange({ prices })}
      />
      <details className="sg-sheet group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
          Style, language and extras
        </summary>
        <div className="sg-sheet-body mt-3 flex flex-col gap-3">
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
  const scroller = useRef<HTMLDivElement>(null);
  const pause = useRef(false);

  function stepBy(direction: number) {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = (card?.getBoundingClientRect().width ?? 280) + 16;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 8) return;
    const next = el.scrollLeft + direction * step;
    const left = next > max + 4 ? 0 : next < -4 ? max : next;
    el.scrollTo({ left, behavior: "smooth" });
  }

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (pause.current) return;
      if (window.matchMedia("(max-width: 639px)").matches) return;
      const card = el.querySelector("li");
      const step = (card?.getBoundingClientRect().width ?? 280) + 16;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 8) return;
      const next = el.scrollLeft + step;
      el.scrollTo({ left: next > max - 4 ? 0 : next, behavior: "smooth" });
    }, 2800);
    return () => window.clearInterval(id);
  }, [groups]);

  return (
    <section aria-labelledby="sg-look-heading" className="mt-16 sm:mt-24">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="eyebrow">A first look</p>
          <h2 id="sg-look-heading" className="sg-display mt-2 text-[1.75rem] sm:text-4xl">
            Six from the list
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            These are the first six in listed order. That order is not a score of results. The member number on each
            card is a snapshot, not a ranking.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <IconButton label="Previous groups" onClick={() => stepBy(-1)}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton label="Next groups" onClick={() => stepBy(1)}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>
      <div
        ref={scroller}
        className="sg-look mt-6"
        onMouseEnter={() => {
          pause.current = true;
        }}
        onMouseLeave={() => {
          pause.current = false;
        }}
        onFocus={() => {
          pause.current = true;
        }}
        onBlur={() => {
          pause.current = false;
        }}
      >
        <ul className="sg-look-row">
          {groups.map((group) => (
            <li key={group.slug} className="w-[min(78vw,18rem)] shrink-0 snap-start">
              <MiniCard group={group} onOpen={() => onOpen(group.slug)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MiniCard({ group, onOpen }: { group: SignalGroupView; onOpen: () => void }) {
  const market = SIGNAL_MARKET_ORDER.find((id) => group.markets.includes(id));
  const ink = market ? INK[market] : "var(--color-gold)";
  return (
    <article
      className="sg-card relative flex h-full min-h-44 flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5"
      style={{ ["--sg-ink-raw" as string]: ink }}
    >
      <span className="sg-card-stripe" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <Monogram name={group.name} ink={ink} />
        <p className="text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">
          {market ? SHORT[market] : "Telegram"}
        </p>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight">
        <button type="button" onClick={onOpen} className="card-stretch rounded-2xl text-left">
          <span className="line-clamp-2">{group.name}</span>
          <span className="sr-only">. Open details</span>
        </button>
      </h3>
      <p className="mt-3 flex items-center gap-1.5 font-mono text-sm text-muted">
        <Users className="size-3.5" aria-hidden="true" />
        {group.memberCount ?? "Members not listed"}
      </p>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-36 sm:px-8">
          <Monogram name={group.name} ink={markets[0] ? INK[markets[0]] : "var(--color-gold)"} large />
          <h2 id={titleId} className="sg-display mt-5 break-words text-3xl leading-tight sm:text-4xl">
            {group.name}
          </h2>
          <p className="mt-2 text-sm text-muted">
            This is the group&apos;s own name. It is not a result we checked. The letters are a placeholder, not the
            group&apos;s logo.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
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
          <dl className="mt-8 grid grid-cols-2 gap-2">
            <Stat label="Members" value={group.memberCount ?? "Not stated"} note={membersAsOf ? `As of ${membersAsOf}. Not a ranking.` : "Not a ranking."} />
            <Stat label="Price" value={group.priceLabel || "Not stated"} />
            <Stat label="Language" value={group.language || "Not stated"} />
            <Stat label="Style" value={group.styles.length ? group.styles.map((id) => SIGNAL_STYLE_LABELS[id]).join(", ") : "Not stated"} />
            <Stat label="Platform" value="Telegram" />
            <Stat label="Posting" value={group.signalsPerDay || "Not stated"} />
          </dl>
          <p className="mt-4 text-sm leading-6 text-muted">
            <span className="font-medium text-foreground">Category. </span>
            {markets.length ? markets.map((id) => SIGNAL_MARKET_LABELS[id]).join(", ") : "Not stated"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            <span className="font-medium text-foreground">Also listed. </span>
            {group.extras.length ? group.extras.map((id) => SIGNAL_EXTRA_LABELS[id]).join(", ") : "Not stated"}
          </p>
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
        <div className="sg-joinbar absolute inset-x-0 bottom-0 border-t border-border bg-background/90 px-5 py-3 backdrop-blur-md sm:px-8">
          <p className="mb-2 text-center text-[11px] leading-4 text-subtle">
            Opens their Telegram. Some Join links pay us a commission.
          </p>
          <JoinLink group={group} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <dt className="text-[11px] font-medium tracking-[0.12em] text-subtle uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-5 text-foreground">{value}</dd>
      {note && <p className="mt-1 text-[11px] leading-4 text-subtle">{note}</p>}
    </div>
  );
}

function Monogram({ name, ink, large = false }: { name: string; ink: string; large?: boolean }) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  const letters = (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "SG").slice(0, 2)).toUpperCase();
  return (
    <span
      className={`sg-monogram ${large ? "sg-monogram-lg" : ""}`}
      style={{ ["--sg-ink-raw" as string]: ink }}
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}

function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return <span className="tabular-nums">{value.toLocaleString("en-US")}</span>;
}

function MeshField() {
  return (
    <div className="sg-mesh" aria-hidden="true">
      <span className="sg-mesh-orb sg-mesh-orb-a" />
      <span className="sg-mesh-orb sg-mesh-orb-b" />
      <span className="sg-mesh-orb sg-mesh-orb-c" />
      <span className="sg-mesh-shimmer" />
    </div>
  );
}

function MarketMotif({ id }: { id: SignalMarket }) {
  return (
    <svg className="sg-motif" viewBox="0 0 120 120" aria-hidden="true">
      {id === "gold" && <rect x="28" y="36" width="64" height="18" rx="3" />}
      {id === "gold" && <rect x="34" y="58" width="52" height="16" rx="3" />}
      {id === "forex-majors" && <text x="14" y="78" fontSize="42" fontFamily="ui-monospace, monospace">€$</text>}
      {id === "forex-minors" && <text x="18" y="78" fontSize="42" fontFamily="ui-monospace, monospace">£¥</text>}
      {id === "indices" && <rect x="22" y="46" width="16" height="48" rx="3" />}
      {id === "indices" && <rect x="52" y="46" width="16" height="48" rx="3" />}
      {id === "indices" && <rect x="82" y="46" width="16" height="48" rx="3" />}
      {id === "crypto" && <text x="22" y="82" fontSize="64" fontFamily="ui-sans-serif, system-ui">₿</text>}
      {id === "oil" && <path d="M60 16c18 24 28 36 28 52a28 28 0 1 1-56 0c0-16 10-28 28-52z" />}
      {id === "stocks-options" && <circle cx="48" cy="62" r="26" fill="none" stroke="currentColor" strokeWidth="6" />}
      {id === "stocks-options" && <circle cx="74" cy="62" r="26" fill="none" stroke="currentColor" strokeWidth="6" />}
    </svg>
  );
}

function PriceRail({ prices, onChange }: { prices: SignalPrice[]; onChange: (prices: SignalPrice[]) => void }) {
  const options: Array<SignalPrice | "all"> = ["all", ...SIGNAL_PRICE_ORDER];
  return (
    <div className="sg-pills" role="group" aria-label="Price">
      {options.map((option) => {
        const on = option === "all" ? prices.length === 0 : prices.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option === "all" ? [] : [option])}
            className={on ? "is-on" : ""}
          >
            {option === "all" ? "Any price" : SIGNAL_PRICE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

function ScrollGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? window.scrollY / height : 0;
      bar.style.transform = `scaleX(${progress})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref} className="sg-progress" aria-hidden="true" />;
}

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    const move = (event: PointerEvent) => {
      el.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} className="sg-cursor" aria-hidden="true" />;
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
