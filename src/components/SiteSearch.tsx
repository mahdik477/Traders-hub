"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CATALOG_KIND_LABELS,
  type CatalogItem,
  type CatalogKind,
} from "@/lib/catalog-types";
import { flattenGroups, groupHits, searchCatalog } from "@/lib/search";
import { getCachedCatalog, loadCatalog } from "@/lib/catalog-client";
import { SearchIcon } from "@/components/icons";

// Site-wide search: a button in the header plus Ctrl/⌘+K anywhere. The
// index is one static JSON file (/api/search-index) fetched the first time
// the dialog opens and kept for the rest of the visit, so typing is instant
// and no page has to carry the whole catalogue in its HTML.
//
// Everything here is keyboard-first: arrows move through the flat list of
// results across groups, Enter opens, Esc closes, and focus comes back to
// the button that opened it.

// Shown before the visitor has typed anything — one way in to each section.
const QUICK_LINKS: { label: string; href: string; hint: string }[] = [
  { label: "Find my firm", href: "/funded-accounts/find-my-firm", hint: "Answer five quick questions" },
  { label: "Compare prop firms", href: "/funded-accounts/compare", hint: "Up to 3 plans side by side" },
  { label: "Deals & promo codes", href: "/deals", hint: "Every active code we've verified" },
  { label: "Start here", href: "/start-here", hint: "New to trading? The guided path" },
  { label: "Learn", href: "/learn", hint: "Free 9-part intro" },
  { label: "Strategies", href: "/strategies", hint: "58 strategies with live simulators" },
];

const KIND_TINT: Record<CatalogKind, string> = {
  firm: "bg-accent/12 text-accent",
  course: "bg-success/12 text-success",
  broker: "bg-surface-2 text-foreground",
  tool: "bg-surface-2 text-foreground",
  signal: "bg-warning/12 text-warning",
  strategy: "bg-accent/12 text-accent",
  learn: "bg-success/12 text-success",
  glossary: "bg-surface-2 text-muted",
};

function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}

export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mac, setMac] = useState(false);

  useEffect(() => {
    // Platform sniff for the shortcut hint only — has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMac(isMac());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to where the visitor was.
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        aria-keyshortcuts="Control+K Meta+K"
        className="search-trigger flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-muted transition-colors hover:border-accent hover:text-foreground sm:pr-2"
      >
        <SearchIcon className="size-4.5" />
        <span className="hidden md:inline">Search</span>
        <kbd
          aria-hidden="true"
          className="hidden rounded-md border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-subtle md:inline"
        >
          {mac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
      {open && <SearchDialog onClose={close} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<CatalogItem[] | null>(getCachedCatalog());
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const openedOn = useRef(pathname);

  // Load the index once, focus the box, lock the page behind.
  useEffect(() => {
    inputRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!getCachedCatalog()) {
      loadCatalog().then(setIndex, () => setFailed(true));
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Close when the route changes underneath us (a result was opened).
  useEffect(() => {
    if (pathname !== openedOn.current) onClose();
  }, [pathname, onClose]);

  const groups = useMemo(() => (index ? groupHits(searchCatalog(index, query)) : []), [index, query]);
  const flat = useMemo(() => flattenGroups(groups), [groups]);
  const showQuickLinks = query.trim() === "";
  const total = showQuickLinks ? QUICK_LINKS.length : flat.length;

  useEffect(() => {
    // Reset the highlighted row whenever the results change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(0);
  }, [query]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(href: string) {
    if (href === pathname) {
      onClose();
      return;
    }
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total) setActive((a) => (a + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total) setActive((a) => (a - 1 + total) % total);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(total - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const href = showQuickLinks ? QUICK_LINKS[active]?.href : flat[active]?.href;
      if (href) go(href);
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog: the input is the only focusable thing
      // that needs it, so Tab just cycles the highlighted row.
      e.preventDefault();
      if (total) setActive((a) => (e.shiftKey ? (a - 1 + total) % total : (a + 1) % total));
    }
  }

  const activeId = total ? `${listId}-opt-${active}` : undefined;

  return (
    <div
      className="search-overlay fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-3 pt-[8vh] backdrop-blur-sm sm:px-6 sm:pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        onKeyDown={onKeyDown}
        className="search-panel flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-glow"
        style={{ maxHeight: "min(72vh, 40rem)" }}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon className="size-5 shrink-0 text-accent" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search firms, courses, strategies, terms…"
            className="search-input min-w-0 flex-1 bg-transparent py-4 text-base text-foreground outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-muted hover:text-foreground"
          >
            <span className="sm:hidden">Close</span>
            <kbd aria-hidden="true" className="hidden rounded-md border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] sm:inline">
              Esc
            </kbd>
            <span className="sr-only">Close search</span>
          </button>
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
          {showQuickLinks ? (
            <>
              <p className="eyebrow px-3 pb-1 pt-2">Jump to</p>
              {QUICK_LINKS.map((q, i) => (
                <ResultRow
                  key={q.href}
                  id={`${listId}-opt-${i}`}
                  index={i}
                  active={i === active}
                  onHover={() => setActive(i)}
                  onPick={() => go(q.href)}
                  title={q.label}
                  subtitle={q.hint}
                  badge={null}
                />
              ))}
            </>
          ) : failed ? (
            <p className="p-6 text-center text-sm text-muted">
              The search index couldn&apos;t load. Try again in a moment, or use the menu above.
            </p>
          ) : !index ? (
            <div className="space-y-2 p-3" aria-live="polite">
              <p className="sr-only">Loading search index</p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : flat.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted" role="status">
              Nothing matches &ldquo;{query}&rdquo;. Try a firm, course or strategy name, or a term like
              &ldquo;drawdown&rdquo;.
            </p>
          ) : (
            (() => {
              let i = -1;
              return groups.map((g) => (
                <div key={g.kind} role="group" aria-label={CATALOG_KIND_LABELS[g.kind]}>
                  <p className="eyebrow px-3 pb-1 pt-3">{CATALOG_KIND_LABELS[g.kind]}</p>
                  {g.hits.map(({ item }) => {
                    i += 1;
                    const idx = i;
                    return (
                      <ResultRow
                        key={`${item.kind}:${item.id}`}
                        id={`${listId}-opt-${idx}`}
                        index={idx}
                        active={idx === active}
                        onHover={() => setActive(idx)}
                        onPick={() => go(item.href)}
                        title={item.title}
                        subtitle={item.subtitle}
                        badge={<KindBadge item={item} />}
                      />
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-[0.7rem] text-subtle sm:flex">
          <span>
            <kbd className="font-mono">↑↓</kbd> move
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> open
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> close
          </span>
          <span className="ml-auto">We list, we don&apos;t rank.</span>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  id,
  index,
  active,
  onHover,
  onPick,
  title,
  subtitle,
  badge,
}: {
  id: string;
  index: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
  title: string;
  subtitle: string | null;
  badge: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      data-index={index}
      onMouseMove={onHover}
      onClick={onPick}
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        active ? "bg-accent/12" : "hover:bg-surface-2"
      }`}
    >
      {badge}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${active ? "text-accent" : "text-foreground"}`}>{title}</p>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      <span aria-hidden="true" className={`text-xs ${active ? "text-accent" : "text-transparent"}`}>
        ↵
      </span>
    </div>
  );
}

function KindBadge({ item }: { item: CatalogItem }) {
  if (item.logo) {
    return (
      <span
        className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border p-1 ${
          item.logoBg === "dark" ? "bg-black" : "bg-white"
        }`}
      >
        <Image src={item.logo} alt="" width={36} height={36} className="size-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold uppercase tracking-wide ${KIND_TINT[item.kind]}`}
    >
      {item.kind === "glossary" ? "Aa" : item.title.slice(0, 2)}
    </span>
  );
}
