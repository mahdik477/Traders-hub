"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import SignalGroupLogo from "@/components/SignalGroupLogo";
import VisitSiteLink from "@/components/VisitSiteLink";
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
type StyleFilter = SignalStyle | "any";
type PriceFilter = SignalPrice | "any";
type Panel = "note" | "style" | "price" | "extras" | "language" | null;

type Filters = {
  market: MarketFilter;
  style: StyleFilter;
  price: PriceFilter;
  extras: SignalExtra[];
  language: string;
  query: string;
};

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
  const initial = filtersFromQuery(initialQuery);
  const [market, setMarket] = useState<MarketFilter>(initial.market);
  const [style, setStyle] = useState<StyleFilter>(initial.style);
  const [price, setPrice] = useState<PriceFilter>(initial.price);
  const [extras, setExtras] = useState<SignalExtra[]>(initial.extras);
  const [language, setLanguage] = useState(initial.language);
  const [query, setQuery] = useState(initial.query);
  const [panel, setPanel] = useState<Panel>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const headerOffset = useSiteHeaderHeight();

  const filters: Filters = { market, style, price, extras, language, query };

  const marketCounts = useMemo(() => {
    const map = new Map<SignalMarket, number>();
    for (const group of groups) {
      for (const id of group.markets) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const languages = useMemo(() => {
    return [...new Set(groups.map((group) => group.language).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [groups]);

  const matching = groups.filter((group) => matches(group, filters));

  const filtersActive =
    market !== "all" || style !== "any" || price !== "any" || extras.length > 0 || language !== "any";
  const styleCount = style === "any" ? 0 : 1;
  const priceCount = price === "any" ? 0 : 1;
  const languageCount = language === "any" ? 0 : 1;
  const activeCount = styleCount + priceCount + extras.length + languageCount + (market === "all" ? 0 : 1);

  function commit(next: Filters) {
    setMarket(next.market);
    setStyle(next.style);
    setPrice(next.price);
    setExtras(next.extras);
    setLanguage(next.language);
    setQuery(next.query);
    const params = new URLSearchParams();
    if (next.market !== "all") params.set("market", next.market);
    if (next.style !== "any") params.set("style", next.style);
    if (next.price !== "any") params.set("price", next.price);
    if (next.extras.length) params.set("extras", next.extras.join(","));
    if (next.language !== "any") params.set("language", next.language);
    const trimmed = next.query.trim();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  function toggleExtra(extra: SignalExtra) {
    const nextExtras = extras.includes(extra) ? extras.filter((item) => item !== extra) : [...extras, extra];
    commit({ ...filters, extras: nextExtras });
  }

  function clearFilters() {
    commit({ ...filters, market: "all", style: "any", price: "any", extras: [], language: "any" });
    setPanel(null);
  }

  function togglePanel(next: Panel) {
    setPanel((current) => (current === next ? null : next));
  }

  useEffect(() => {
    if (!panel) return;
    function onPointerDown(event: PointerEvent) {
      if (barRef.current?.contains(event.target as Node)) return;
      setPanel(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) setSheetOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      media.removeEventListener("change", closeOnDesktop);
    };
  }, [sheetOpen]);

  return (
    <div>
      <div ref={barRef} className="signal-filter-bar" style={{ top: headerOffset }}>
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1 md:w-64 md:flex-none">
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => commit({ ...filters, query: event.target.value })}
              onFocus={() => setPanel(null)}
              placeholder="Search by name, market or language"
              className="field signal-filter-search"
            />
          </label>

          <button
            ref={filtersButtonRef}
            type="button"
            className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium md:hidden ${
              filtersActive
                ? "border-accent bg-accent/15 text-foreground"
                : "border-border-strong bg-surface text-muted"
            }`}
            aria-expanded={sheetOpen}
            aria-controls="signal-filter-sheet"
            onClick={() => {
              setPanel(null);
              setSheetOpen(true);
            }}
          >
            Filters
            {activeCount > 0 && <CountBadge count={activeCount} />}
          </button>

          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <MarketSegments
              market={market}
              counts={marketCounts}
              total={groups.length}
              onChange={(next) => commit({ ...filters, market: next })}
            />
            <NoteButton
              open={panel === "note"}
              onClick={() => togglePanel("note")}
              onHover={(hovering) => {
                if (hovering) setPanel("note");
                else setPanel((current) => (current === "note" ? null : current));
              }}
            />
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 md:mt-2">
          <div className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
            <FilterMenu
              id="signal-style-menu"
              label="Style"
              count={styleCount}
              open={panel === "style"}
              onToggle={() => togglePanel("style")}
            >
              <OptionButton
                pressed={style === "any"}
                onClick={() => {
                  commit({ ...filters, style: "any" });
                  setPanel(null);
                }}
              >
                Any
              </OptionButton>
              {SIGNAL_STYLE_ORDER.map((id) => (
                <OptionButton
                  key={id}
                  pressed={style === id}
                  onClick={() => {
                    commit({ ...filters, style: id });
                    setPanel(null);
                  }}
                >
                  {SIGNAL_STYLE_LABELS[id]}
                </OptionButton>
              ))}
            </FilterMenu>

            <FilterMenu
              id="signal-price-menu"
              label="Price"
              count={priceCount}
              open={panel === "price"}
              onToggle={() => togglePanel("price")}
            >
              <OptionButton
                pressed={price === "any"}
                onClick={() => {
                  commit({ ...filters, price: "any" });
                  setPanel(null);
                }}
              >
                Any
              </OptionButton>
              {SIGNAL_PRICE_ORDER.map((id) => (
                <OptionButton
                  key={id}
                  pressed={price === id}
                  onClick={() => {
                    commit({ ...filters, price: id });
                    setPanel(null);
                  }}
                >
                  {SIGNAL_PRICE_LABELS[id]}
                </OptionButton>
              ))}
            </FilterMenu>

            <FilterMenu
              id="signal-extras-menu"
              label="Extras"
              count={extras.length}
              open={panel === "extras"}
              onToggle={() => togglePanel("extras")}
              align="end"
            >
              {SIGNAL_EXTRA_ORDER.map((id) => (
                <OptionButton key={id} pressed={extras.includes(id)} onClick={() => toggleExtra(id)}>
                  {SIGNAL_EXTRA_LABELS[id]}
                </OptionButton>
              ))}
            </FilterMenu>

            <FilterMenu
              id="signal-language-menu"
              label="Language"
              count={languageCount}
              open={panel === "language"}
              onToggle={() => togglePanel("language")}
              align="end"
            >
              <OptionButton
                pressed={language === "any"}
                onClick={() => {
                  commit({ ...filters, language: "any" });
                  setPanel(null);
                }}
              >
                Any
              </OptionButton>
              {languages.map((name) => (
                <OptionButton
                  key={name}
                  pressed={language === name}
                  onClick={() => {
                    commit({ ...filters, language: name });
                    setPanel(null);
                  }}
                >
                  {name}
                </OptionButton>
              ))}
              {languages.length === 0 && <span className="meta block px-2.5 py-2">No languages listed yet.</span>}
            </FilterMenu>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex h-9 shrink-0 items-center px-1.5 text-sm font-medium text-accent underline-offset-2 hover:underline disabled:text-subtle disabled:no-underline disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <p aria-live="polite" className="ml-auto shrink-0 text-right text-xs text-muted">
            <span className="font-semibold tabular-nums text-foreground">{matching.length}</span> of {groups.length}{" "}
            shown
          </p>
        </div>
      </div>

      {sheetOpen && (
        <FilterSheet
          groups={groups}
          matchingCount={matching.length}
          market={market}
          style={style}
          price={price}
          extras={extras}
          language={language}
          languages={languages}
          marketCounts={marketCounts}
          filtersActive={filtersActive}
          onMarket={(next) => commit({ ...filters, market: next })}
          onStyle={(next) => commit({ ...filters, style: next })}
          onPrice={(next) => commit({ ...filters, price: next })}
          onToggleExtra={toggleExtra}
          onLanguage={(next) => commit({ ...filters, language: next })}
          onClear={clearFilters}
          onClose={() => {
            setSheetOpen(false);
            filtersButtonRef.current?.focus();
          }}
        />
      )}

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

function FilterMenu({
  id,
  label,
  count,
  open,
  onToggle,
  align = "start",
  children,
}: {
  id: string;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const active = count > 0;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="true"
        onClick={onToggle}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
          active || open
            ? "border-accent bg-accent/15 text-foreground"
            : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
        }`}
      >
        {label}
        {active && <CountBadge count={count} />}
        <Chevron open={open} />
      </button>
      {open && (
        <div id={id} className={`absolute top-full z-20 pt-1.5 ${align === "end" ? "right-0" : "left-0"}`}>
          <div className="signal-popover w-max min-w-44 rounded-xl p-1">{children}</div>
        </div>
      )}
    </div>
  );
}

function OptionButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-sm font-medium whitespace-nowrap ${
        pressed ? "bg-accent/15 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      <span>{children}</span>
      {pressed ? <Check /> : <span className="size-3.5 shrink-0" aria-hidden="true" />}
    </button>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-fill px-1 text-[10px] font-semibold tabular-nums text-gold-ink">
      {count}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`size-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6.25 8 10.25 12 6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0 text-accent">
      <path
        d="M3.5 8.2 6.4 11.1 12.5 4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterSheet({
  groups,
  matchingCount,
  market,
  style,
  price,
  extras,
  language,
  languages,
  marketCounts,
  filtersActive,
  onMarket,
  onStyle,
  onPrice,
  onToggleExtra,
  onLanguage,
  onClear,
  onClose,
}: {
  groups: SignalGroupView[];
  matchingCount: number;
  market: MarketFilter;
  style: StyleFilter;
  price: PriceFilter;
  extras: SignalExtra[];
  language: string;
  languages: string[];
  marketCounts: Map<SignalMarket, number>;
  filtersActive: boolean;
  onMarket: (market: MarketFilter) => void;
  onStyle: (style: StyleFilter) => void;
  onPrice: (price: PriceFilter) => void;
  onToggleExtra: (extra: SignalExtra) => void;
  onLanguage: (language: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>("button, input, [href], [tabindex]:not([tabindex='-1'])")].filter(
        (item) => !item.hasAttribute("disabled"),
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
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div
        ref={dialogRef}
        id="signal-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signal-filter-sheet-title"
        tabIndex={-1}
        className="signal-sheet-panel absolute inset-x-0 bottom-0 flex max-h-[min(85vh,40rem)] flex-col rounded-t-2xl border border-border-strong bg-surface outline-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          <h2 id="signal-filter-sheet-title" className="text-base font-semibold text-foreground">
            Filters
          </h2>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted">
            Close
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-4">
          <p className="eyebrow">Market</p>
          <div className="mt-2">
            <MarketSegments tall market={market} counts={marketCounts} total={groups.length} onChange={onMarket} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{MARKET_NOTE}</p>

          <SheetGroup label="Style">
            <SheetChoice pressed={style === "any"} onClick={() => onStyle("any")}>
              Any
            </SheetChoice>
            {SIGNAL_STYLE_ORDER.map((id) => (
              <SheetChoice key={id} pressed={style === id} onClick={() => onStyle(id)}>
                {SIGNAL_STYLE_LABELS[id]}
              </SheetChoice>
            ))}
          </SheetGroup>

          <SheetGroup label="Price">
            <SheetChoice pressed={price === "any"} onClick={() => onPrice("any")}>
              Any
            </SheetChoice>
            {SIGNAL_PRICE_ORDER.map((id) => (
              <SheetChoice key={id} pressed={price === id} onClick={() => onPrice(id)}>
                {SIGNAL_PRICE_LABELS[id]}
              </SheetChoice>
            ))}
          </SheetGroup>

          <SheetGroup label="Extras">
            {SIGNAL_EXTRA_ORDER.map((id) => (
              <SheetChoice key={id} pressed={extras.includes(id)} onClick={() => onToggleExtra(id)}>
                {SIGNAL_EXTRA_LABELS[id]}
              </SheetChoice>
            ))}
          </SheetGroup>

          <SheetGroup label="Language">
            <SheetChoice pressed={language === "any"} onClick={() => onLanguage("any")}>
              Any
            </SheetChoice>
            {languages.map((name) => (
              <SheetChoice key={name} pressed={language === name} onClick={() => onLanguage(name)}>
                {name}
              </SheetChoice>
            ))}
            {languages.length === 0 && <p className="meta px-3 py-3">No languages listed yet.</p>}
          </SheetGroup>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-xs text-muted" aria-hidden="true">
            <span className="font-semibold tabular-nums text-foreground">{matchingCount}</span> of {groups.length} shown
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-accent disabled:text-subtle disabled:opacity-50"
            >
              Clear
            </button>
            <button type="button" onClick={onClose} className="btn btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-4 border-0 p-0">
      <legend className="eyebrow">{label}</legend>
      <div className="mt-1.5 overflow-hidden rounded-xl border border-border">{children}</div>
    </fieldset>
  );
}

function SheetChoice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-border px-3 text-left text-sm font-medium last:border-b-0 ${
        pressed ? "bg-accent/15 text-foreground" : "bg-surface text-muted"
      }`}
    >
      <span>{children}</span>
      {pressed ? <Check /> : <span className="size-3.5 shrink-0" aria-hidden="true" />}
    </button>
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
        <li>We do not score results, accuracy or how often a group&apos;s calls make money.</li>
      </ul>
    </div>
  );
}

function matches(group: SignalGroupView, filters: Filters): boolean {
  if (filters.market !== "all" && !group.markets.includes(filters.market)) return false;
  if (filters.style !== "any" && !group.styles.includes(filters.style)) return false;
  if (filters.price !== "any" && group.price !== filters.price) return false;
  if (filters.extras.some((extra) => !group.extras.includes(extra))) return false;
  if (filters.language !== "any" && group.language !== filters.language) return false;
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

function filtersFromQuery(initialQuery: string): Filters {
  const params = new URLSearchParams(initialQuery);
  const market = params.get("market") ?? "all";
  const style = params.get("style") ?? "any";
  const price = params.get("price") ?? "any";
  const language = params.get("language") ?? "any";
  const extras = (params.get("extras") ?? "")
    .split(",")
    .filter((extra): extra is SignalExtra => extra in SIGNAL_EXTRA_LABELS);
  return {
    market: market in SIGNAL_MARKET_LABELS ? (market as SignalMarket) : "all",
    style: style in SIGNAL_STYLE_LABELS ? (style as SignalStyle) : "any",
    price: price in SIGNAL_PRICE_LABELS ? (price as SignalPrice) : "any",
    extras,
    language,
    query: params.get("q") ?? "",
  };
}
