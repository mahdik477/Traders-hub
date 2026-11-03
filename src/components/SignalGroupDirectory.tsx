"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  LayoutGrid,
  Rows3,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import SignalGroupLogo from "@/components/SignalGroupLogo";
import { signalGroupDetailHref } from "@/lib/signal-group-links";
import {
  signalFilterTickCount,
  signalFiltersFromSearch,
  signalFiltersToSearch,
  signalGroupMatchesFilters,
  type SignalFilterSelection,
} from "@/lib/signal-group-filters";
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

type MarketFilter = SignalMarket | "all";
type SortKey = "listed" | "name" | "members" | "category";
type ViewKey = "table" | "grid";

const PAGE_SIZE = 40;
const SORTS: SortKey[] = ["listed", "name", "members", "category"];
const SORT_LABELS: Record<SortKey, string> = {
  listed: "Listed order",
  name: "Name (A–Z)",
  members: "Members",
  category: "Category",
};

const SEGMENT_LABEL: Record<SignalMarket, string> = {
  gold: "Gold",
  "forex-majors": "Forex majors",
  "forex-minors": "Forex minors",
  indices: "Indices",
  crypto: "Crypto",
  oil: "Oil & commodities",
  "stocks-options": "Stocks & options",
};

const TAG_LABEL: Record<SignalMarket, string> = {
  gold: "Gold",
  "forex-majors": "Majors",
  "forex-minors": "Minors",
  indices: "Indices",
  crypto: "Crypto",
  oil: "Oil",
  "stocks-options": "Stocks",
};

const TABLE_COLS =
  "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)_minmax(4.25rem,0.5fr)_minmax(4.5rem,0.55fr)_minmax(0,1.05fr)_minmax(0,0.75fr)_minmax(3.25rem,0.55fr)_5.25rem]";

const MARKET_NOTE =
  "Indices includes NQ, US30, the S&P 500 and DAX. Oil & commodities includes silver and other metals, not only crude oil. A group can sit in more than one market, so category counts overlap.";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function SignalGroupDirectory({ groups }: { groups: SignalGroupView[] }) {
  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <DirectoryFromAddress groups={groups} />
    </Suspense>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="signal-directory" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading signal groups</p>
      <div className="signal-filter-bar" aria-hidden="true">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="h-11 flex-1 animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none sm:h-9" />
            <div className="flex gap-2">
              <div className="h-11 w-full animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none sm:h-9 sm:w-40" />
              <div className="h-11 w-24 animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none sm:h-9" />
              <div className="h-11 w-[4.75rem] animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none sm:h-9" />
            </div>
          </div>
          <div className="h-10 animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none" />
        </div>
      </div>
      <div className="signal-results mt-4 flex flex-col gap-3 lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
        <div className={`hidden border-b border-border bg-surface-2 px-4 py-2 lg:grid lg:items-center lg:gap-x-3 ${TABLE_COLS}`}>
          {["Group", "Category", "Platform", "Members", "Price", "Style", "Language", ""].map((label) => (
            <span key={label || "join"} className="h-3 w-12 rounded bg-border" />
          ))}
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-surface p-4 lg:rounded-none lg:border-0 lg:border-b lg:border-border lg:px-4 lg:py-3 lg:last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 shrink-0 animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none lg:size-8" />
              <div className="h-4 w-40 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
            </div>
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-surface-2 motion-reduce:animate-none lg:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DirectoryFromAddress({ groups }: { groups: SignalGroupView[] }) {
  const searchParams = useSearchParams();
  return <Directory groups={groups} initialQuery={searchParams.toString()} />;
}

function Directory({ groups, initialQuery }: { groups: SignalGroupView[]; initialQuery: string }) {
  const initial = signalFiltersFromSearch(initialQuery);
  const chrome = readChrome(initialQuery);
  const [market, setMarket] = useState<MarketFilter>(initial.market);
  const [styles, setStyles] = useState<SignalStyle[]>(initial.styles);
  const [prices, setPrices] = useState<SignalPrice[]>(initial.prices);
  const [extras, setExtras] = useState<SignalExtra[]>(initial.extras);
  const [languages, setLanguages] = useState<string[]>(initial.languages);
  const [query, setQuery] = useState(initial.query);
  const [sort, setSort] = useState<SortKey>(chrome.sort);
  const [view, setView] = useState<ViewKey>(chrome.view);
  const [page, setPage] = useState(chrome.page);
  const [noteOpen, setNoteOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const seen = useRef(new Set<string>());
  const stagger = useMemo(() => createStagger(), []);
  const reduce = usePrefersReducedMotion();
  const headerOffset = useSiteHeaderHeight();
  const narrow = useNarrowScreen();
  const searchId = useId();
  const sortId = useId();
  const noteId = useId();

  const filters: SignalFilterSelection = useMemo(
    () => ({ market, styles, prices, extras, languages, query }),
    [market, styles, prices, extras, languages, query],
  );

  const marketCounts = useMemo(() => {
    const map = new Map<SignalMarket, number>();
    for (const group of groups) {
      for (const id of group.markets) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const languageOptions = useMemo(() => {
    return [...new Set([...languages, ...groups.map((group) => group.language).filter(Boolean)])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [groups, languages]);

  const matching = useMemo(() => {
    const list = groups.filter((group) => matches(group, filters));
    const copy = [...list];
    copy.sort((a, b) => compareGroups(a, b, sort));
    return copy;
  }, [groups, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE) || 1);
  const safePage = Math.min(page, pageCount);
  const pageStart = matching.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const pageItems = matching.slice(pageStart, pageStart + PAGE_SIZE);
  const pageEnd = pageStart + pageItems.length;
  const tickCount = signalFilterTickCount(filters);
  const listSignature = `${view}|${pageItems.map((group) => group.slug).join("|")}`;

  useListFlip(listRef, listSignature, reduce);

  const listingSearch = listingSearchFor(filters, sort, view, safePage);

  useEffect(() => {
    const qs = listingSearch;
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) window.history.replaceState(null, "", next);
  }, [listingSearch]);

  useEffect(() => {
    if (!filtersOpen && !noteOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (barRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setFiltersOpen(false);
      setNoteOpen(false);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setFiltersOpen(false);
      setNoteOpen(false);
      filtersButtonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen, noteOpen]);

  useEffect(() => {
    if (!filtersOpen) return;
    const root = panelRef.current;
    if (!root) return;
    const media = window.matchMedia("(max-width: 767px)");
    const applyLock = () => {
      document.body.style.overflow = media.matches ? "hidden" : "";
    };
    applyLock();
    if (media.matches) root.focus();
    media.addEventListener("change", applyLock);

    function onTab(event: globalThis.KeyboardEvent) {
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, [href], input, select, textarea")].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );
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
    root.addEventListener("keydown", onTab);
    return () => {
      media.removeEventListener("change", applyLock);
      root.removeEventListener("keydown", onTab);
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  function commit(next: SignalFilterSelection) {
    setMarket(next.market);
    setStyles(next.styles);
    setPrices(next.prices);
    setExtras(next.extras);
    setLanguages(next.languages);
    setQuery(next.query);
    setPage(1);
  }

  function toggleValue<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function clearAll() {
    commit({ market: "all", styles: [], prices: [], extras: [], languages: [], query: "" });
    setSort("listed");
  }

  function closeFilters() {
    setFiltersOpen(false);
    filtersButtonRef.current?.focus();
  }

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(1, next), pageCount);
    setPage(clamped);
    const behavior = reduce ? "auto" : "smooth";
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior, block: "start" });
    });
  }

  return (
    <div className="signal-directory">
      <div ref={barRef} className="signal-filter-bar" style={{ top: headerOffset }}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <label htmlFor={searchId} className="relative min-w-0 lg:w-72 lg:flex-none xl:w-80">
              <span className="sr-only">Search signal groups</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => commit({ ...filters, query: event.target.value })}
                placeholder="Search by name, market or language"
                autoComplete="off"
                className="signal-search h-11 w-full rounded-lg border border-border-strong bg-background pr-9 pl-9 text-sm text-foreground transition-colors duration-150 outline-none placeholder:text-subtle hover:border-subtle focus-visible:border-accent sm:h-9"
              />
              {query && (
                <button
                  type="button"
                  className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
                  onClick={() => commit({ ...filters, query: "" })}
                  aria-label="Clear search"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </label>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <label htmlFor={sortId} className="sr-only">
                Sort groups
              </label>
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <select
                  id={sortId}
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortKey);
                    setPage(1);
                  }}
                  className="signal-search h-11 w-full appearance-none rounded-lg border border-border-strong bg-background pr-8 pl-3 text-sm text-foreground transition-colors duration-150 outline-none hover:border-subtle focus-visible:border-accent sm:h-9 sm:w-44"
                >
                  {SORTS.map((id) => (
                    <option key={id} value={id}>
                      {SORT_LABELS[id]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              </div>

              <button
                ref={filtersButtonRef}
                type="button"
                className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 sm:h-9 ${
                  tickCount > 0 || filtersOpen
                    ? "border-border-strong bg-surface-2 text-foreground"
                    : "border-border-strong bg-background text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
                aria-expanded={filtersOpen}
                aria-controls="signal-filter-panel"
                onClick={() => {
                  setNoteOpen(false);
                  setFiltersOpen((open) => !open);
                }}
              >
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                Filters
                {tickCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-fill px-1 text-[10px] font-semibold text-gold-ink tabular-nums">
                    {tickCount}
                  </span>
                )}
              </button>

              <div role="group" aria-label="Layout" className="inline-flex h-11 shrink-0 items-center rounded-lg border border-border-strong bg-background p-0.5 sm:h-9">
                <ViewButton pressed={view === "table"} label="List" onClick={() => setView("table")}>
                  <Rows3 className="size-4" aria-hidden="true" />
                </ViewButton>
                <ViewButton pressed={view === "grid"} label="Grid" onClick={() => setView("grid")}>
                  <LayoutGrid className="size-4" aria-hidden="true" />
                </ViewButton>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-2">
            <MarketSegments
              market={market}
              counts={marketCounts}
              total={groups.length}
              onChange={(next) => commit({ ...filters, market: next })}
            />
            <p className="shrink-0 text-right text-xs leading-4 text-muted tabular-nums" aria-live="polite" aria-atomic="true">
              <span className="font-medium text-foreground">{matching.length}</span>
              <span className="hidden sm:inline"> of {groups.length}</span>
            </p>
            <div className="relative shrink-0">
              <button
                type="button"
                aria-expanded={noteOpen}
                aria-controls={noteId}
                onClick={() => {
                  setFiltersOpen(false);
                  setNoteOpen((open) => !open);
                }}
                className={`inline-flex size-9 items-center justify-center rounded-lg border text-muted transition-colors duration-150 hover:text-foreground ${
                  noteOpen ? "border-border-strong bg-surface-2 text-foreground" : "border-border-strong bg-background"
                }`}
              >
                <span className="sr-only">How market categories are counted</span>
                <Info className="size-4" aria-hidden="true" />
              </button>
              {noteOpen && (
                <div className="absolute top-full right-0 z-20 w-72 pt-2">
                  <p id={noteId} className="signal-popover rounded-lg p-3 text-xs leading-5 text-muted">
                    {MARKET_NOTE}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {filtersOpen && (
          <FilterPanel
            panelRef={panelRef}
            sheet={narrow}
            styles={styles}
            prices={prices}
            extras={extras}
            languages={languages}
            languageOptions={languageOptions}
            tickCount={tickCount}
            onToggleStyle={(id) => commit({ ...filters, styles: toggleValue(styles, id) })}
            onTogglePrice={(id) => commit({ ...filters, prices: toggleValue(prices, id) })}
            onToggleExtra={(id) => commit({ ...filters, extras: toggleValue(extras, id) })}
            onToggleLanguage={(name) => commit({ ...filters, languages: toggleValue(languages, name) })}
            onClear={() => commit({ ...filters, styles: [], prices: [], extras: [], languages: [] })}
            onClose={closeFilters}
          />
        )}
      </div>

      <div ref={resultsRef} className="signal-results mt-4">
        {groups.length === 0 ? (
          <EmptyDirectory />
        ) : matching.length === 0 ? (
          <NoResults query={query} onClear={clearAll} />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted tabular-nums">
              Showing <span className="font-medium text-foreground">{pageStart + 1}</span>
              {"–"}
              <span className="font-medium text-foreground">{pageEnd}</span>
              {" of "}
              <span className="font-medium text-foreground">{matching.length}</span>
            </p>

            <div className={view === "table" ? "lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface" : undefined}>
              {view === "table" && (
                <div
                  aria-hidden="true"
                  className={`hidden border-b border-border bg-surface-2 px-4 py-2 text-[11px] font-medium tracking-wide text-muted lg:grid lg:items-center lg:gap-x-3 ${TABLE_COLS}`}
                >
                  <span>Group</span>
                  <span>Category</span>
                  <span>Platform</span>
                  <span title="Approximate count from the day we checked. Not a ranking.">Members</span>
                  <span>Price</span>
                  <span>Style</span>
                  <span>Language</span>
                  <span className="text-right">Join</span>
                </div>
              )}
              <ul
                ref={listRef}
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-3 lg:gap-0"
                }
              >
                {pageItems.map((group) => (
                  <SignalRow
                    key={group.slug}
                    group={group}
                    view={view}
                    listingSearch={listingSearch}
                    seen={seen}
                    stagger={stagger}
                    reduce={reduce}
                  />
                ))}
              </ul>
            </div>

            <Pagination page={safePage} pageCount={pageCount} onPage={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}

function SignalRow({
  group,
  view,
  listingSearch,
  seen,
  stagger,
  reduce,
}: {
  group: SignalGroupView;
  view: ViewKey;
  listingSearch: string;
  seen: RefObject<Set<string>>;
  stagger: () => number;
  reduce: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const router = useRouter();
  useEnterMotion(ref, group.slug, reduce, seen, stagger);
  const headingId = `signal-${group.slug}`;
  const asOf = formatSignalDate(group.memberCountAsOf);
  const orderedMarkets = SIGNAL_MARKET_ORDER.filter((id) => group.markets.includes(id));
  const href = signalGroupDetailHref(group.slug, listingSearch);
  const openGroup = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest("a, button")) return;
    router.push(href);
  };

  if (view === "grid") {
    return (
      <li ref={ref} data-signal-slug={group.slug} className="min-w-0">
        <article
          onClick={openGroup}
          className="group flex h-full cursor-pointer flex-col rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:bg-surface-2 motion-reduce:transition-none"
        >
          <div className="flex items-start gap-3">
            <SignalGroupLogo name={group.name} logo={group.logo} size="md" />
            <div className="min-w-0 flex-1">
              <GroupName id={headingId} name={group.name} href={href} />
              <p className="mt-1 text-xs text-muted">Telegram</p>
            </div>
          </div>
          <CategoryTags markets={orderedMarkets} className="mt-3" />
          {group.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{group.description}</p>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <Meta label="Members">
              <MemberValue group={group} asOf={asOf} />
            </Meta>
            <Meta label="Price">
              <span className="line-clamp-2" title={group.priceLabel}>
                {group.priceLabel}
              </span>
            </Meta>
            <Meta label="Language">{group.language || <Dash />}</Meta>
            <Meta label="Style">
              <StyleValue group={group} />
            </Meta>
          </dl>
          <div className="mt-4">
            <JoinLink group={group} full />
          </div>
        </article>
      </li>
    );
  }

  return (
    <li
      ref={ref}
      data-signal-slug={group.slug}
      onClick={openGroup}
      className={`group grid min-w-0 cursor-pointer grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:bg-surface-2 motion-reduce:transition-none lg:items-center lg:gap-x-3 lg:rounded-none lg:border-0 lg:border-b lg:border-border lg:bg-transparent lg:px-4 lg:py-3 lg:hover:bg-surface-2 lg:last:border-b-0 ${TABLE_COLS}`}
    >
      <div className="col-span-2 flex min-w-0 items-start gap-3 lg:col-span-1">
        <SignalGroupLogo name={group.name} logo={group.logo} size="sm" />
        <div className="min-w-0 flex-1">
          <GroupName id={headingId} name={group.name} href={href} />
          {group.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted lg:hidden">{group.description}</p>
          )}
        </div>
      </div>
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <FieldLabel>Category</FieldLabel>
        <CategoryTags markets={orderedMarkets} limit={2} />
      </div>
      <div className="min-w-0">
        <FieldLabel>Platform</FieldLabel>
        <p className="text-sm text-foreground lg:text-[13px] lg:text-muted">Telegram</p>
      </div>
      <div className="min-w-0">
        <FieldLabel>Members</FieldLabel>
        <MemberValue group={group} asOf={asOf} />
      </div>
      <div className="min-w-0">
        <FieldLabel>Price</FieldLabel>
        <p className="line-clamp-2 text-sm text-foreground lg:text-[13px]" title={group.priceLabel}>
          {group.priceLabel}
        </p>
      </div>
      <div className="min-w-0">
        <FieldLabel>Style</FieldLabel>
        <StyleValue group={group} />
      </div>
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <FieldLabel>Language</FieldLabel>
        <p className="truncate text-sm text-foreground lg:text-[13px]">{group.language || <Dash />}</p>
      </div>
      <div className="col-span-2 lg:col-span-1 lg:justify-self-end">
        <JoinLink group={group} />
      </div>
    </li>
  );
}

function GroupName({ id, name, href }: { id: string; name: string; href: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1">
      <h3 id={id} title={name} className="line-clamp-2 min-w-0 text-sm font-semibold leading-5 tracking-tight text-foreground">
        <Link
          href={href}
          className="underline-offset-2 outline-none group-hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent"
        >
          {name}
        </Link>
      </h3>
      <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden="true" />
    </div>
  );
}

function listingSearchFor(
  filters: SignalFilterSelection,
  sort: SortKey,
  view: ViewKey,
  page: number,
): string {
  const params = new URLSearchParams(signalFiltersToSearch(filters));
  if (sort !== "listed") params.set("sort", sort);
  if (view === "grid") params.set("view", "grid");
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-[11px] font-medium leading-4 text-muted lg:sr-only">{children}</div>;
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium leading-4 text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function MemberValue({ group, asOf }: { group: SignalGroupView; asOf: string | null }) {
  if (!group.memberCount) return <Dash />;
  const figure = group.memberCount.replace(/\s+members$/i, "");
  return (
    <div title={asOf ? `${group.memberCount}, as of ${asOf}` : group.memberCount}>
      <p className="font-medium text-foreground tabular-nums lg:text-[13px]">{figure}</p>
      {asOf && <p className="text-[11px] leading-4 text-muted">as of {asOf}</p>}
    </div>
  );
}

function StyleValue({ group }: { group: SignalGroupView }) {
  const style = group.styles.map((id) => SIGNAL_STYLE_LABELS[id]).join(", ");
  const extra = [
    ...group.extras.map((id) => SIGNAL_EXTRA_LABELS[id]),
    group.signalsPerDay,
  ].filter(Boolean);
  if (!style && extra.length === 0) return <Dash />;
  return (
    <div className="min-w-0">
      <p className="truncate text-sm text-foreground lg:text-[13px]">{style || <Dash />}</p>
      {extra.length > 0 && <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted">{extra.join(" · ")}</p>}
    </div>
  );
}

function CategoryTags({
  markets,
  limit,
  className = "",
}: {
  markets: SignalMarket[];
  limit?: number;
  className?: string;
}) {
  if (markets.length === 0) return <Dash />;
  const shown = limit ? markets.slice(0, limit) : markets;
  const rest = limit ? markets.slice(limit) : [];
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`}>
      {shown.map((id) => (
        <li key={id}>
          <span
            title={SIGNAL_MARKET_LABELS[id]}
            className="inline-flex items-center rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-muted"
          >
            {TAG_LABEL[id]}
          </span>
        </li>
      ))}
      {rest.length > 0 && (
        <li>
          <span
            title={rest.map((id) => SIGNAL_MARKET_LABELS[id]).join(", ")}
            className="inline-flex items-center rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-muted tabular-nums"
          >
            +{rest.length}
          </span>
        </li>
      )}
    </ul>
  );
}

function Dash() {
  return (
    <span className="text-subtle">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not stated</span>
    </span>
  );
}

function JoinLink({ group, full = false }: { group: SignalGroupView; full?: boolean }) {
  if (!group.telegramUrl) {
    return <span className="text-xs text-muted">No link</span>;
  }
  return (
    <a
      href={group.telegramUrl}
      target="_blank"
      rel="noopener sponsored"
      aria-label={`Join ${group.name} on Telegram (opens in a new tab)`}
      className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-gold-fill px-3 text-sm font-semibold text-gold-ink transition-colors duration-150 hover:bg-[var(--color-gold-fill-hover)] active:brightness-95 ${
        full ? "w-full" : "w-full lg:h-8 lg:w-auto"
      }`}
    >
      <span aria-hidden="true">Join</span>
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function ViewButton({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${label} view`}
      onClick={onClick}
      className={`inline-flex size-10 items-center justify-center rounded-md transition-colors duration-150 sm:size-8 ${
        pressed ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function MarketSegments({
  market,
  counts,
  total,
  onChange,
}: {
  market: MarketFilter;
  counts: Map<SignalMarket, number>;
  total: number;
  onChange: (market: MarketFilter) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const reduce = usePrefersReducedMotion();
  const ids: MarketFilter[] = ["all", ...SIGNAL_MARKET_ORDER];

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      setEdges({
        left: scroller.scrollLeft > 2,
        right: max - scroller.scrollLeft > 2,
      });
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [total]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = Math.max(0, ids.indexOf(market));
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % ids.length;
    if (event.key === "ArrowLeft") next = (index - 1 + ids.length) % ids.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = ids.length - 1;
    const id = ids[next];
    onChange(id);
    const button = scrollerRef.current?.querySelector<HTMLButtonElement>(`[data-market="${id}"]`);
    button?.focus();
    button?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }

  function scrollByDir(dir: number) {
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="relative min-w-0 flex-1">
      {edges.left && (
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollByDir(-1)}
          className="absolute top-1/2 left-1 z-10 hidden size-7 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface text-muted hover:text-foreground sm:inline-flex"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
      )}
      <div
        ref={scrollerRef}
        role="radiogroup"
        aria-label="Category"
        onKeyDown={onKeyDown}
        className="nav-scroll flex h-10 items-center gap-0.5 overflow-x-auto rounded-lg border border-border-strong bg-background p-0.5"
      >
        <Segment
          marketId="all"
          label="All"
          count={total}
          pressed={market === "all"}
          onClick={() => onChange("all")}
        />
        {SIGNAL_MARKET_ORDER.map((id) => (
          <Segment
            key={id}
            marketId={id}
            label={SEGMENT_LABEL[id]}
            fullLabel={SIGNAL_MARKET_LABELS[id]}
            count={counts.get(id) ?? 0}
            pressed={market === id}
            onClick={() => onChange(id)}
          />
        ))}
      </div>
      {edges.right && (
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollByDir(1)}
          className="absolute top-1/2 right-1 z-10 hidden size-7 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface text-muted hover:text-foreground sm:inline-flex"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Segment({
  marketId,
  label,
  fullLabel,
  count,
  pressed,
  onClick,
}: {
  marketId: string;
  label: string;
  fullLabel?: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      data-market={marketId}
      aria-checked={pressed}
      tabIndex={pressed ? 0 : -1}
      title={fullLabel && fullLabel !== label ? fullLabel : undefined}
      onClick={onClick}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
        pressed ? "bg-surface text-foreground shadow-[inset_0_0_0_1px_var(--color-border-strong)]" : "text-muted hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      <span className={`text-[11px] tabular-nums ${pressed ? "text-foreground" : "text-subtle"}`}>{count}</span>
    </button>
  );
}

function FilterPanel({
  panelRef,
  sheet,
  styles,
  prices,
  extras,
  languages,
  languageOptions,
  tickCount,
  onToggleStyle,
  onTogglePrice,
  onToggleExtra,
  onToggleLanguage,
  onClear,
  onClose,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  sheet: boolean;
  styles: SignalStyle[];
  prices: SignalPrice[];
  extras: SignalExtra[];
  languages: string[];
  languageOptions: string[];
  tickCount: number;
  onToggleStyle: (id: SignalStyle) => void;
  onTogglePrice: (id: SignalPrice) => void;
  onToggleExtra: (id: SignalExtra) => void;
  onToggleLanguage: (name: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const choices = (
    <div className="flex flex-col gap-4">
      <FilterSection label="Trading style">
        {SIGNAL_STYLE_ORDER.map((id) => (
          <CheckPill key={id} checked={styles.includes(id)} onClick={() => onToggleStyle(id)} label={SIGNAL_STYLE_LABELS[id]} />
        ))}
      </FilterSection>
      <FilterSection label="Price">
        {SIGNAL_PRICE_ORDER.map((id) => (
          <CheckPill key={id} checked={prices.includes(id)} onClick={() => onTogglePrice(id)} label={SIGNAL_PRICE_LABELS[id]} />
        ))}
      </FilterSection>
      <FilterSection label="Extras">
        {SIGNAL_EXTRA_ORDER.map((id) => (
          <CheckPill key={id} checked={extras.includes(id)} onClick={() => onToggleExtra(id)} label={SIGNAL_EXTRA_LABELS[id]} />
        ))}
      </FilterSection>
      <FilterSection label="Language">
        {languageOptions.map((name) => (
          <CheckPill key={name} checked={languages.includes(name)} onClick={() => onToggleLanguage(name)} label={name} />
        ))}
        {languageOptions.length === 0 && <span className="text-sm text-muted">No languages listed yet.</span>}
      </FilterSection>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-3">
      <button
        type="button"
        onClick={onClear}
        disabled={tickCount === 0}
        className="inline-flex h-11 items-center px-2 text-sm font-medium text-accent underline-offset-2 hover:underline disabled:text-subtle disabled:no-underline disabled:opacity-40 sm:h-9"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-11 items-center rounded-lg bg-gold-fill px-3 text-sm font-semibold text-gold-ink transition-colors duration-150 hover:bg-[var(--color-gold-fill-hover)] sm:h-9"
      >
        Done
      </button>
    </div>
  );

  if (sheet) {
    if (typeof document === "undefined") return null;
    return createPortal(
      <>
        <button type="button" aria-label="Close filters" className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
        <div
          ref={panelRef}
          id="signal-filter-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signal-filter-panel-title"
          tabIndex={-1}
          className="signal-sheet-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85vh,40rem)] flex-col rounded-t-lg border border-border-strong bg-surface outline-none"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h2 id="signal-filter-panel-title" className="text-base font-semibold text-foreground">
              Filters
            </h2>
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center px-2 text-sm font-medium text-muted">
              Close
            </button>
          </div>
          <p className="px-4 text-xs leading-5 text-muted">
            Style, price and language match any ticked option. Extras must all match.
          </p>
          <div className="overflow-y-auto overscroll-contain px-4 py-3">{choices}</div>
          {footer}
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div className="absolute top-full left-0 z-30 pt-2">
      <div
        ref={panelRef}
        id="signal-filter-panel"
        role="dialog"
        aria-labelledby="signal-filter-panel-title"
        className="signal-popover flex max-h-[min(70vh,32rem)] w-[min(36rem,calc(100vw-2rem))] flex-col rounded-lg"
      >
        <h2 id="signal-filter-panel-title" className="px-3 pt-3 text-sm font-semibold text-foreground">
          Filters
        </h2>
        <p className="px-3 pt-1 text-xs leading-5 text-muted">
          Style, price and language match any ticked option. Extras must all match.
        </p>
        <div className="overflow-y-auto px-3 py-3">{choices}</div>
        {footer}
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-[11px] font-medium tracking-wide text-muted">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function CheckPill({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors duration-150 sm:min-h-8 ${
        checked
          ? "border-border-strong bg-surface-2 text-foreground"
          : "border-border-strong bg-background text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex size-3.5 items-center justify-center rounded-[3px] border ${
          checked ? "border-accent bg-gold-fill text-gold-ink" : "border-border-strong bg-background"
        }`}
      >
        {checked && <Check className="size-2.5" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const items = paginationItems(page, pageCount);
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted tabular-nums">
        Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="inline-flex size-11 items-center justify-center rounded-lg border border-border-strong text-foreground transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:size-9"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        {items.map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-subtle">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={`inline-flex size-11 items-center justify-center rounded-lg border text-sm tabular-nums transition-colors duration-150 sm:size-9 ${
                item === page
                  ? "border-border-strong bg-surface-2 font-semibold text-foreground"
                  : "border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          className="inline-flex size-11 items-center justify-center rounded-lg border border-border-strong text-foreground transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:size-9"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  const trimmed = query.trim();
  return (
    <div role="status" className="rounded-lg border border-border bg-surface px-6 py-14 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted">
        <SearchX className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">No groups match</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {trimmed
          ? `Nothing in this directory matches “${trimmed}”. Try a market, a language, or part of a name.`
          : "Nothing matches these filters. Clear one and try again."}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex h-11 items-center rounded-lg border border-border-strong bg-background px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-2"
      >
        Clear search and filters
      </button>
    </div>
  );
}

function EmptyDirectory() {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-8 sm:px-8">
      <h2 className="text-base font-semibold text-foreground">No groups listed yet</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        This directory is ready for Telegram signal groups. None are published yet. A group is added only after it
        meets the listing rules.
      </p>
      <ul className="mt-4 max-w-2xl list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-accent">
        <li>No guaranteed-return language, and no pressure to deposit more money.</li>
        <li>A free option or a trial is available.</li>
        <li>We do not score results, accuracy or how often a group&apos;s calls make money.</li>
      </ul>
    </div>
  );
}

function useEnterMotion(
  ref: RefObject<HTMLLIElement | null>,
  slug: string,
  reduce: boolean,
  seen: RefObject<Set<string>>,
  stagger: () => number,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduce || seen.current.has(slug)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let obs: IntersectionObserver | null = null;
    let anim: Animation | null = null;
    let cancelled = false;

    const play = () => {
      const node = ref.current;
      if (cancelled || !node || seen.current.has(slug)) return;
      node.style.opacity = "";
      node.style.transform = "";
      anim = node.animate(
        [
          { opacity: 0, transform: "translate3d(0, 10px, 0) scale(0.98)" },
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
        ],
        { duration: 460, delay: stagger(), easing: EASE, fill: "both" },
      );
      anim.finished.then(
        () => {
          if (cancelled) return;
          seen.current.add(slug);
          node.style.opacity = "";
          node.style.transform = "";
        },
        () => {},
      );
    };

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    const inView = rect.bottom > 0 && rect.top < vh * 0.96;
    if (inView) {
      play();
    } else {
      el.style.opacity = "0";
      el.style.transform = "translate3d(0, 10px, 0) scale(0.98)";
      obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          obs?.disconnect();
          play();
        },
        { threshold: 0.16, rootMargin: "0px 0px -4% 0px" },
      );
      obs.observe(el);
    }

    return () => {
      cancelled = true;
      obs?.disconnect();
      anim?.cancel();
      el.style.opacity = "";
      el.style.transform = "";
    };
  }, [ref, reduce, seen, slug, stagger]);
}

function useListFlip(listRef: RefObject<HTMLUListElement | null>, signature: string, reduce: boolean) {
  const prev = useRef(new Map<string, { top: number; left: number; parent: Element | null }>());
  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(":scope > [data-signal-slug]")];
    const next = new Map<string, { top: number; left: number; parent: Element | null }>();
    const motionOff = reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const node of nodes) {
      const slug = node.dataset.signalSlug;
      if (!slug) continue;
      const pos = { top: node.offsetTop, left: node.offsetLeft, parent: node.offsetParent };
      next.set(slug, pos);
      if (motionOff || node.getAnimations().length > 0) continue;
      const before = prev.current.get(slug);
      if (!before || before.parent !== pos.parent) continue;
      const dy = before.top - pos.top;
      const dx = before.left - pos.left;
      if (Math.abs(dy) < 2 && Math.abs(dx) < 2) continue;
      if (Math.abs(dy) > 420 || Math.abs(dx) > 640) continue;
      node.animate(
        [
          { transform: `translate3d(${dx}px, ${dy}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 280, easing: EASE, fill: "both" },
      );
    }
    prev.current = next;
  }, [listRef, reduce, signature]);
}

function createStagger() {
  let stamp = 0;
  let count = 0;
  return () => {
    const now = performance.now();
    if (now - stamp > 80) {
      stamp = now;
      count = 0;
    }
    const index = count;
    count += 1;
    return Math.min(index, 6) * 40;
  };
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduce;
}

function useNarrowScreen() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return narrow;
}

function useSiteHeaderHeight() {
  const [height, setHeight] = useState(72);
  useLayoutEffect(() => {
    const header = document.querySelector(".site-header");
    if (!(header instanceof HTMLElement)) return;
    const update = () => setHeight(Math.ceil(header.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return height;
}

function readChrome(search: string): { sort: SortKey; view: ViewKey; page: number } {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const sortRaw = params.get("sort");
  const sort = SORTS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : "listed";
  const view = params.get("view") === "grid" ? "grid" : "table";
  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return { sort, view, page };
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
  if (sort === "category") {
    const am = primaryMarketIndex(a);
    const bm = primaryMarketIndex(b);
    if (am !== bm) return am - bm;
    return a.name.localeCompare(b.name);
  }
  return a.rank - b.rank || a.name.localeCompare(b.name);
}

function primaryMarketIndex(group: SignalGroupView): number {
  const index = SIGNAL_MARKET_ORDER.findIndex((id) => group.markets.includes(id));
  return index === -1 ? SIGNAL_MARKET_ORDER.length : index;
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

function matches(group: SignalGroupView, filters: SignalFilterSelection): boolean {
  if (!signalGroupMatchesFilters(group, filters)) return false;
  const needle = filters.query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    group.name,
    group.description,
    group.language,
    group.priceLabel,
    group.memberCount ?? "",
    group.signalsPerDay ?? "",
    ...group.markets.map((id) => `${SIGNAL_MARKET_LABELS[id]} ${SEGMENT_LABEL[id]} ${TAG_LABEL[id]}`),
    ...group.styles.map((id) => SIGNAL_STYLE_LABELS[id]),
    ...group.extras.map((id) => SIGNAL_EXTRA_LABELS[id]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function paginationItems(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("gap");
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < total - 1) items.push("gap");
  items.push(total);
  return items;
}
