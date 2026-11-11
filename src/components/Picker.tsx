"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import FirmBadge from "@/components/FirmBadge";

// The one dropdown on the site (DESIGN.md → "Picker"). It replaces every
// native <select>: a button that opens a searchable list — a floating card
// on desktop, a bottom sheet on phones. No library; the panel is rendered
// only while open, so a closed picker costs one button.
//
// Accessibility: the trigger is a button (aria-haspopup="listbox"); inside
// the panel the search box is the combobox that owns the listbox through
// aria-controls / aria-activedescendant. Arrow keys, Home/End, Enter, Esc
// and Tab all work; focus goes back to the trigger on close; the number of
// results is announced. Order is whatever the caller passes (A–Z for
// firms) — the picker never sorts or promotes anything.

export type PickerOption = {
  value: string;
  label: string;
  /** Extra text the search should match (e.g. "forex futures"). */
  keywords?: string;
  /** A firm-style logo tile; pass `logo: null` for the lettermark fallback. */
  badge?: { logo: string | null; logoBg?: "white" | "dark" };
  /** A flag or other emoji shown in place of a logo. */
  emoji?: string;
  /** Small pills after the name, e.g. ["Forex", "Futures"]. */
  tags?: string[];
  /** Right-aligned figure, e.g. "from $39.50". */
  meta?: string;
  /** Amber badge under the name — used for the payout-complaints note. */
  warning?: string;
  /** Shown dimmed and can't be chosen, with this note (e.g. "Added"). */
  disabledNote?: string;
};

type Props = {
  options: PickerOption[];
  /** Current value; "" when nothing is chosen (the placeholder shows). */
  value: string;
  onChange: (value: string) => void;
  /** Visible label above the trigger. Omit and pass `ariaLabel` instead to hide it. */
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  /** "search" = the tall homepage-search look; "field" = compact form control. */
  variant?: "search" | "field";
  /** Show the search box. Defaults to on when there are more than 8 options. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Small note on the right of the trigger, e.g. "2 of 3 added". */
  note?: string;
  disabled?: boolean;
  /** Title of the phone sheet; defaults to the label. */
  sheetTitle?: string;
  className?: string;
};

const PHONE = "(max-width: 767px)";

export default function Picker({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  placeholder = "Choose…",
  variant = "field",
  searchable,
  searchPlaceholder = "Search",
  note,
  disabled = false,
  sheetTitle,
  className = "",
}: Props) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const valueId = `${uid}-value`;
  const listId = `${uid}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const showSearch = searchable ?? options.length > 8;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  return (
    <div className={`picker ${className}`}>
      {label && (
        <span id={labelId} className="eyebrow mb-1 block">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-disabled={disabled || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
        aria-label={label ? undefined : `${ariaLabel ?? placeholder}${selected ? `: ${selected.label}` : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`picker-trigger ${variant === "search" ? "picker-trigger-search" : ""} ${open ? "is-open" : ""}`}
      >
        {variant === "search" && <Search className="size-4 shrink-0 text-accent" aria-hidden="true" />}
        {selected?.emoji && (
          <span aria-hidden="true" className="shrink-0 text-base leading-none">
            {selected.emoji}
          </span>
        )}
        <span id={valueId} className={`min-w-0 flex-1 truncate text-left ${selected ? "text-foreground" : "text-subtle"}`}>
          {selected ? selected.label : placeholder}
        </span>
        {note && <span className="readout hidden shrink-0 sm:inline">{note}</span>}
        <ChevronDown className="picker-chevron size-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
      {open && !disabled && (
        <PickerPanel
          options={options}
          value={value}
          listId={listId}
          title={sheetTitle ?? label ?? ariaLabel ?? placeholder}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          triggerRef={triggerRef}
          onPick={(v) => {
            onChange(v);
            close();
          }}
          onClose={close}
        />
      )}
    </div>
  );
}

function PickerPanel({
  options,
  value,
  listId,
  title,
  showSearch,
  searchPlaceholder,
  triggerRef,
  onPick,
  onClose,
}: {
  options: PickerOption[];
  value: string;
  listId: string;
  title: string;
  showSearch: boolean;
  searchPlaceholder: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onPick: (value: string) => void;
  onClose: (refocus?: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [isPhone] = useState(() => window.matchMedia(PHONE).matches);
  const [place, setPlace] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => (q ? options.filter((o) => `${o.label} ${o.keywords ?? ""}`.toLowerCase().includes(q)) : options),
    [options, q],
  );
  const firstEnabled = (list: PickerOption[], from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < list.length; i += step) if (!list[i].disabledNote) return i;
    return -1;
  };
  const [active, setActive] = useState(() => {
    const at = options.findIndex((o) => o.value === value && !o.disabledNote);
    return at >= 0 ? at : firstEnabled(options, 0, 1);
  });
  // Typing starts the highlight again from the first match.
  const [lastQuery, setLastQuery] = useState(q);
  if (lastQuery !== q) {
    setLastQuery(q);
    setActive(firstEnabled(shown, 0, 1));
  }

  // Desktop: sit under the trigger (or above it when there's more room),
  // and follow it if the page scrolls or resizes.
  useLayoutEffect(() => {
    if (isPhone) return;
    function measure(e?: Event) {
      // The list's own scrolling doesn't move the trigger.
      if (e?.target instanceof Node && panelRef.current?.contains(e.target)) return;
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const gap = 6;
      const below = window.innerHeight - r.bottom - gap - 12;
      const above = r.top - gap - 12;
      const up = below < 240 && above > below;
      const width = Math.min(Math.max(r.width, 288), window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12));
      const next: { left: number; width: number; top?: number; bottom?: number; maxHeight: number } = {
        left,
        width,
        maxHeight: Math.max(180, Math.min(440, up ? above : below)),
        ...(up ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
      };
      setPlace((prev) =>
        prev && prev.left === next.left && prev.width === next.width && prev.maxHeight === next.maxHeight && prev.top === next.top && prev.bottom === next.bottom
          ? prev
          : next,
      );
    }
    measure();
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [isPhone, triggerRef]);

  // Phone: lock the page behind the sheet.
  useEffect(() => {
    if (!isPhone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isPhone]);

  // Focus moves into the panel; clicking or tabbing outside closes it.
  useEffect(() => {
    (showSearch ? inputRef.current : listRef.current)?.focus({ preventScroll: true });
    function onDown(e: PointerEvent) {
      // Phones: the dimmed backdrop closes on click (finger up), so the tap
      // can't fall through to whatever is underneath.
      if (isPhone) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      onClose(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isPhone, onClose, showSearch, triggerRef]);

  // Keep the highlighted row in view.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, shown.length]);

  function onKeyDown(e: React.KeyboardEvent) {
    const move = (to: number, step: 1 | -1) => {
      e.preventDefault();
      const next = firstEnabled(shown, to, step);
      if (next >= 0) setActive(next);
    };
    switch (e.key) {
      case "ArrowDown":
        return move(active + 1, 1);
      case "ArrowUp":
        return move(active - 1, -1);
      case "Home":
        return move(0, 1);
      case "End":
        return move(shown.length - 1, -1);
      case " ":
        if (showSearch) return; // a space is a character in the search box
      // falls through
      case "Enter": {
        e.preventDefault();
        const o = shown[active];
        if (o && !o.disabledNote) onPick(o.value);
        return;
      }
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        return onClose();
      case "Tab":
        // Leaving the panel closes it; focus continues from the trigger.
        e.preventDefault();
        return onClose();
    }
  }

  const activeId = active >= 0 && shown[active] ? `${listId}-o${active}` : undefined;
  const count = shown.length;

  const body = (
    <div
      ref={panelRef}
      className={isPhone ? `picker-sheet ${showSearch ? "is-searchable" : ""}` : "picker-pop"}
      style={isPhone ? undefined : place ? { ...place } : { top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
      role={isPhone ? "dialog" : undefined}
      aria-modal={isPhone ? true : undefined}
      aria-label={isPhone ? title : undefined}
      onKeyDown={onKeyDown}
    >
      {isPhone && (
        <div className="picker-sheet-head">
          <span aria-hidden="true" className="picker-grab" />
          <div className="flex items-center justify-between gap-3">
            <p className="section-title truncate">{title}</p>
            <button type="button" onClick={() => onClose()} aria-label="Close" className="picker-close">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      {showSearch && (
        <div className="picker-search">
          <Search className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={count > 0}
            aria-controls={count > 0 ? listId : undefined}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label={`Search ${title}`}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="picker-search-input"
          />
          {query && (
            <button type="button" onClick={() => (setQuery(""), inputRef.current?.focus())} aria-label="Clear search" className="picker-clear">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {count === 0 ? "No results" : `${count} result${count === 1 ? "" : "s"}`}
      </p>
      {count === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted">Nothing matches &ldquo;{query.trim()}&rdquo;. Try a shorter word.</p>
          <button type="button" onClick={() => (setQuery(""), inputRef.current?.focus())} className="btn btn-outline mt-4">
            Clear search
          </button>
        </div>
      ) : (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={title}
          tabIndex={showSearch ? undefined : -1}
          aria-activedescendant={showSearch ? undefined : activeId}
          className="picker-list"
        >
          {shown.map((o, i) => {
            const isSelected = o.value === value;
            const isActive = i === active;
            return (
              <li
                key={o.value || "__empty"}
                id={`${listId}-o${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={o.disabledNote ? true : undefined}
                data-active={isActive}
                onPointerMove={() => !o.disabledNote && !isActive && setActive(i)}
                onClick={() => !o.disabledNote && onPick(o.value)}
                className={`picker-row ${isActive ? "is-active" : ""} ${o.disabledNote ? "is-disabled" : ""}`}
              >
                {o.badge && <FirmBadge name={o.label} logo={o.badge.logo} logoBg={o.badge.logoBg} size="sm" />}
                {o.emoji && (
                  <span aria-hidden="true" className="w-6 shrink-0 text-center text-lg leading-none">
                    {o.emoji}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`picker-name min-w-0 ${o.badge ? "font-semibold" : "font-medium"} text-foreground`}>
                      <Highlight text={o.label} query={q} />
                    </span>
                    {o.tags?.map((t) => (
                      <span key={t} className="pill px-2 text-[0.6875rem] leading-4">
                        {t}
                      </span>
                    ))}
                  </span>
                  {o.warning && <span className="badge badge-warning mt-1 whitespace-normal text-[0.6875rem]">{o.warning}</span>}
                </span>
                {o.disabledNote ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
                    <Check className="size-4" aria-hidden="true" />
                    {o.disabledNote}
                  </span>
                ) : (
                  <>
                    {o.meta && <span className="picker-meta">{o.meta}</span>}
                    {isSelected && <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return createPortal(
    isPhone ? (
      <div className="picker-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {body}
      </div>
    ) : (
      body
    ),
    document.body,
  );
}

/** The part of a name that matches the search, in gold. */
function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  if (!query) return text;
  const at = text.toLowerCase().indexOf(query);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="picker-mark">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}
