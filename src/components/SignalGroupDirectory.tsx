"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import SignalGroupLogo from "@/components/SignalGroupLogo";
import VisitSiteLink from "@/components/VisitSiteLink";
import {
  signalFilterTickCount,
  signalFiltersFromSearch,
  signalFiltersToSearch,
  signalGroupMatchesFilters,
  type SignalFilterSelection,
} from "@/lib/signal-group-filters";
import {
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

const MARKET_NOTE =
  "Indices includes NQ, US30, the S&P 500 and DAX. Oil & commodities includes silver and other metals, not only crude oil.";

export default function SignalGroupDirectory({ groups }: { groups: SignalGroupView[] }) {
  return (
    <Suspense fallback={<Directory groups={groups} initialQuery="" />}>
      <DirectoryFromAddress groups={groups} />
    </Suspense>
  );
}

function DirectoryFromAddress({ groups }: { groups: SignalGroupView[] }) {
  const searchParams = useSearchParams();
  return <Directory groups={groups} initialQuery={searchParams.toString()} />;
}

function Directory({ groups, initialQuery }: { groups: SignalGroupView[]; initialQuery: string }) {
  const initial = signalFiltersFromSearch(initialQuery);
  const [market, setMarket] = useState<MarketFilter>(initial.market);
  const [styles, setStyles] = useState<SignalStyle[]>(initial.styles);
  const [prices, setPrices] = useState<SignalPrice[]>(initial.prices);
  const [extras, setExtras] = useState<SignalExtra[]>(initial.extras);
  const [languages, setLanguages] = useState<string[]>(initial.languages);
  const [query, setQuery] = useState(initial.query);
  const [noteOpen, setNoteOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const headerOffset = useSiteHeaderHeight();
  const narrow = useNarrowScreen();

  const filters: SignalFilterSelection = { market, styles, prices, extras, languages, query };

  const marketCounts = useMemo(() => {
    const map = new Map<SignalMarket, number>();
    for (const group of groups) {
      for (const id of group.markets) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const matching = groups.filter((group) => matches(group, filters));
  const tickCount = signalFilterTickCount(filters);
  const languageOptions = useMemo(() => {
    return [...new Set([...languages, ...groups.map((group) => group.language).filter(Boolean)])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [groups, languages]);

  function commit(next: SignalFilterSelection) {
    setMarket(next.market);
    setStyles(next.styles);
    setPrices(next.prices);
    setExtras(next.extras);
    setLanguages(next.languages);
    setQuery(next.query);
    const qs = signalFiltersToSearch(next);
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  function toggleValue<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function clearTicks() {
    commit({ ...filters, styles: [], prices: [], extras: [], languages: [] });
  }

  function closeFilters() {
    setFiltersOpen(false);
    filtersButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!filtersOpen && !noteOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (barRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setFiltersOpen(false);
      setNoteOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
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
    const media = window.matchMedia("(max-width: 767px)");
    const applyLock = () => {
      document.body.style.overflow = media.matches ? "hidden" : "";
    };
    applyLock();
    if (media.matches) panelRef.current?.focus();
    media.addEventListener("change", applyLock);
    return () => {
      media.removeEventListener("change", applyLock);
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  return (
    <div>
      <div ref={barRef} className="signal-filter-bar" style={{ top: headerOffset }}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="min-w-0 md:w-64 md:flex-none">
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => commit({ ...filters, query: event.target.value })}
              onFocus={() => {
                setNoteOpen(false);
                setFiltersOpen(false);
              }}
              placeholder="Search by name, market or language"
              className="field signal-filter-search"
            />
          </label>

          <div className="flex min-w-0 items-center gap-2 md:flex-1">
            <MarketSegments
              market={market}
              counts={marketCounts}
              total={groups.length}
              onChange={(next) => commit({ ...filters, market: next })}
            />
            <NoteButton
              open={noteOpen}
              onClick={() => {
                setFiltersOpen(false);
                setNoteOpen((open) => !open);
              }}
              onHover={(hovering) => {
                if (hovering) {
                  setFiltersOpen(false);
                  setNoteOpen(true);
                } else setNoteOpen(false);
              }}
            />
          </div>
        </div>

        <div className="relative mt-2 flex items-center gap-2">
          <button
            ref={filtersButtonRef}
            type="button"
            className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium md:h-9 ${
              tickCount > 0 || filtersOpen
                ? "border-accent bg-accent/15 text-foreground"
                : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
            }`}
            aria-expanded={filtersOpen}
            aria-controls="signal-filter-panel"
            onClick={() => {
              setNoteOpen(false);
              setFiltersOpen((open) => !open);
            }}
          >
            <FilterIcon />
            Filters
            {tickCount > 0 && <CountBadge count={tickCount} />}
          </button>

          <p aria-live="polite" className="ml-auto shrink-0 text-right text-xs text-muted">
            <span className="font-semibold tabular-nums text-foreground">{matching.length}</span> of {groups.length}{" "}
            shown
          </p>

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
              onClear={clearTicks}
              onClose={closeFilters}
            />
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyDirectory />
      ) : matching.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center text-muted">
          No groups match these filters. Clear one and try again.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matching.map((group, index) => (
            <GroupCard key={group.slug} group={group} index={index} />
          ))}
        </ul>
      )}
    </div>
  );
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
  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!(header instanceof HTMLElement)) return;
    const update = () => setHeight(Math.ceil(header.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return height;
}

function MarketSegments({
  market,
  counts,
  total,
  onChange,
  tall = false,
}: {
  market: MarketFilter;
  counts: Map<SignalMarket, number>;
  total: number;
  onChange: (market: MarketFilter) => void;
  tall?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => setOverflowing(scroller.scrollWidth > scroller.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [total]);

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={scrollerRef}
        className={`nav-scroll flex items-center overflow-x-auto rounded-full border border-border-strong bg-background p-0.5 ${
          tall ? "h-11" : "h-9"
        }`}
        role="group"
        aria-label="Market"
      >
        <Segment tall={tall} label="All" count={total} pressed={market === "all"} onClick={() => onChange("all")} />
        {SIGNAL_MARKET_ORDER.map((id) => (
          <Segment
            key={id}
            tall={tall}
            label={SIGNAL_MARKET_LABELS[id]}
            count={counts.get(id) ?? 0}
            pressed={market === id}
            onClick={() => onChange(id)}
          />
        ))}
      </div>
      {overflowing && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-full bg-gradient-to-l from-background to-transparent"
        />
      )}
    </div>
  );
}

function Segment({
  label,
  count,
  pressed,
  onClick,
  tall = false,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
  tall?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
        tall ? "h-10" : "h-8"
      } ${
        pressed
          ? "bg-accent/15 text-foreground shadow-[inset_0_0_0_1px_var(--color-accent)]"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
      <span className={`text-xs tabular-nums ${pressed ? "text-accent" : "text-subtle"}`}>{count}</span>
    </button>
  );
}

function NoteButton({
  open,
  onClick,
  onHover,
}: {
  open: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}) {
  return (
    <div className="relative shrink-0" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="signal-market-note"
        onClick={onClick}
        className={`inline-flex size-9 items-center justify-center rounded-full border text-subtle transition-colors duration-150 hover:text-foreground ${
          open ? "border-accent text-foreground" : "border-border-strong"
        }`}
      >
        <span className="sr-only">What Indices and Oil and commodities include</span>
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 7.25v3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="5" r="0.7" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-20 w-72 pt-1.5">
          <p id="signal-market-note" className="signal-popover rounded-xl p-3 text-xs leading-relaxed text-muted">
            {MARKET_NOTE}
          </p>
        </div>
      )}
    </div>
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
    <FilterChoices
      styles={styles}
      prices={prices}
      extras={extras}
      languages={languages}
      languageOptions={languageOptions}
      onToggleStyle={onToggleStyle}
      onTogglePrice={onTogglePrice}
      onToggleExtra={onToggleExtra}
      onToggleLanguage={onToggleLanguage}
    />
  );
  const footer = (
    <div className={`flex items-center justify-end gap-2 border-t border-border px-4 py-3 ${sheet ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "px-3"}`}>
      <button
        type="button"
        onClick={onClear}
        disabled={tickCount === 0}
        className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-accent underline-offset-2 hover:underline disabled:text-subtle disabled:no-underline disabled:opacity-50 md:min-h-9"
      >
        Clear all
      </button>
      <button type="button" onClick={onClose} className="btn btn-primary md:min-h-9">
        Done
      </button>
    </div>
  );

  if (!sheet) {
    return (
      <div className="absolute top-full left-0 z-20 pt-1.5">
        <div
          ref={panelRef}
          id="signal-filter-panel"
          role="dialog"
          aria-labelledby="signal-filter-panel-title"
          className="signal-popover flex max-h-[min(70vh,32rem)] w-[min(36rem,calc(100vw-2rem))] flex-col rounded-xl"
        >
          <h2 id="signal-filter-panel-title" className="px-3 pt-3 text-sm font-semibold text-foreground">
            Filters
          </h2>
          <div className="overflow-y-auto px-3 py-3">{choices}</div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <>
      <button type="button" aria-label="Close filters" className="fixed inset-0 z-40 bg-black/65" onClick={onClose} />
      <div
        ref={panelRef}
        id="signal-filter-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signal-filter-panel-title"
        tabIndex={-1}
        className="signal-sheet-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85vh,40rem)] flex-col rounded-t-2xl border border-border-strong bg-surface outline-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <h2 id="signal-filter-panel-title" className="text-base font-semibold text-foreground">
            Filters
          </h2>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted">
            Close
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-3">{choices}</div>
        {footer}
      </div>
    </>
  );
}

function FilterChoices({
  styles,
  prices,
  extras,
  languages,
  languageOptions,
  onToggleStyle,
  onTogglePrice,
  onToggleExtra,
  onToggleLanguage,
}: {
  styles: SignalStyle[];
  prices: SignalPrice[];
  extras: SignalExtra[];
  languages: string[];
  languageOptions: string[];
  onToggleStyle: (id: SignalStyle) => void;
  onTogglePrice: (id: SignalPrice) => void;
  onToggleExtra: (id: SignalExtra) => void;
  onToggleLanguage: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
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
        {languageOptions.length === 0 && <span className="meta">No languages listed yet.</span>}
      </FilterSection>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="eyebrow">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
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
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-2.5 text-sm font-medium md:min-h-8 ${
        checked
          ? "border-accent bg-accent/15 text-foreground"
          : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
      }`}
    >
      <CheckboxMark checked={checked} />
      {label}
    </button>
  );
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
        checked ? "border-accent bg-gold-fill text-gold-ink" : "border-border-strong bg-background"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-2.5">
          <path
            d="M3.5 8.2 6.4 11.1 12.5 4.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0">
      <path
        d="M2.25 3.25h11.5L9.4 8.15V12.2L6.6 13.5V8.15L2.25 3.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-fill px-1 text-[10px] font-semibold tabular-nums text-gold-ink">
      {count}
    </span>
  );
}

function GroupCard({ group, index }: { group: SignalGroupView; index: number }) {
  return (
    <li
      className="signal-card lift-card flex flex-col rounded-xl border border-border bg-surface p-4 sm:p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <SignalGroupLogo name={group.name} logo={group.logo} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{group.name}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {group.markets.map((id) => (
              <li key={id} className="pill">
                {SIGNAL_MARKET_LABELS[id]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {group.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{group.description}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        {factsFor(group).map((fact) => (
          <Fact key={fact.label} label={fact.label} value={fact.value} note={fact.note} />
        ))}
      </dl>

      {group.telegramUrl && (
        <div className="mt-auto pt-4">
          <VisitSiteLink href={group.telegramUrl} firmName={group.name} label="Join" className="w-full" />
        </div>
      )}
    </li>
  );
}

function factsFor(group: SignalGroupView): { label: string; value: string; note?: string }[] {
  const facts: { label: string; value: string; note?: string }[] = [];
  if (group.memberCount) {
    const asOf = memberAsOfLabel(group.memberCountAsOf);
    facts.push({ label: "Members", value: group.memberCount, note: asOf ?? undefined });
  }
  facts.push({ label: "Price", value: group.priceLabel });
  if (group.styles.length) {
    facts.push({
      label: "Style",
      value: group.styles.map((id) => SIGNAL_STYLE_LABELS[id]).join(", "),
    });
  }
  if (group.signalsPerDay) facts.push({ label: "Signals", value: group.signalsPerDay });
  if (group.language) facts.push({ label: "Language", value: group.language });
  return facts;
}

function memberAsOfLabel(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const name = months[month - 1];
  if (!name || !year || !day) return null;
  return `as of ${day} ${name} ${year}`;
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
      {note && <p className="meta mt-0.5">{note}</p>}
    </div>
  );
}

function EmptyDirectory() {
  return (
    <div className="panel-accent mt-8 rounded-xl border border-border bg-surface px-5 py-8 sm:px-8 sm:py-10">
      <h2 className="section-title">No groups listed yet</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        This directory is ready for Telegram signal groups. None are published yet. A group is added
        only after it meets the listing rules, and the filters above are what you will use to narrow
        the list.
      </p>
      <ul className="mt-4 max-w-2xl list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-accent">
        <li>No guaranteed-return language, and no pressure to deposit more money.</li>
        <li>A free option or a trial is available.</li>
      </ul>
    </div>
  );
}

function matches(group: SignalGroupView, filters: SignalFilterSelection): boolean {
  if (!signalGroupMatchesFilters(group, filters)) return false;
  return matchesQuery(group, filters.query);
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
    group.signalsPerDay ?? "",
    ...group.markets.map((id) => SIGNAL_MARKET_LABELS[id]),
    ...group.styles.map((id) => SIGNAL_STYLE_LABELS[id]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

