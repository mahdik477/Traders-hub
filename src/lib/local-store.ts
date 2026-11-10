"use client";

// A tiny localStorage-backed list store with a React hook. Saved listings,
// recently viewed, learning progress, alert preferences and saved
// comparisons are all "a list of small records keyed by something", so
// they share this one implementation instead of five copies of it.
//
// Browser-first by design: everything works with no account. When someone
// is signed in, account-sync mirrors each store to their own Supabase rows
// (and back) — the stores themselves never talk to the network.
//
// Every localStorage read/write is wrapped in try/catch: a private window or
// blocked storage must never break a page; it just forgets between visits.

import { useSyncExternalStore } from "react";

export type ListStore<T> = {
  /** Current entries (empty on the server). */
  get(): T[];
  /** Replace everything. */
  set(next: T[]): void;
  /** Insert or replace the entry with the same key. */
  upsert(entry: T): void;
  /** Remove the entry with this key, if any. */
  remove(key: string): void;
  find(key: string): T | undefined;
  /** Add entries from elsewhere (an account) without dropping local ones. */
  merge(incoming: T[]): void;
  key(entry: T): string;
  /** React hook: live entries. Empty on the server and before hydration. */
  use(): T[];
  subscribe(onChange: () => void): () => void;
};

const EMPTY: never[] = [];

export function createListStore<T>(
  storageKey: string,
  keyOf: (entry: T) => string,
  options: { isValid?: (e: unknown) => e is T; cap?: number; sort?: (a: T, b: T) => number } = {},
): ListStore<T> {
  const event = `tradox:store:${storageKey}`;
  let cache: T[] | null = null;

  function read(): T[] {
    if (cache) return cache;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      cache = (options.isValid ? list.filter(options.isValid) : (list as T[])).slice();
    } catch {
      cache = [];
    }
    return cache;
  }

  function write(next: T[]) {
    let list = next;
    if (options.sort) list = [...list].sort(options.sort);
    if (options.cap && list.length > options.cap) list = list.slice(0, options.cap);
    cache = list;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      // Storage blocked — the in-memory copy still drives this visit.
    }
    window.dispatchEvent(new Event(event));
  }

  function subscribe(onChange: () => void) {
    function onStorage(e: StorageEvent) {
      if (e.key === storageKey || e.key === null) {
        cache = null;
        onChange();
      }
    }
    window.addEventListener(event, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(event, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  const get = () => (typeof window === "undefined" ? (EMPTY as T[]) : read());

  return {
    get,
    set: write,
    upsert(entry) {
      const k = keyOf(entry);
      write([entry, ...read().filter((e) => keyOf(e) !== k)]);
    },
    remove(key) {
      write(read().filter((e) => keyOf(e) !== key));
    },
    find(key) {
      return get().find((e) => keyOf(e) === key);
    },
    merge(incoming) {
      const current = read();
      const seen = new Set(current.map(keyOf));
      const added = incoming.filter((e) => !seen.has(keyOf(e)));
      if (added.length) write([...current, ...added]);
    },
    key: keyOf,
    use() {
      return useSyncExternalStore(subscribe, get, () => EMPTY as T[]);
    },
    subscribe,
  };
}

function isRecord(e: unknown): e is Record<string, unknown> {
  return !!e && typeof e === "object";
}

// ---- Saved listings ---------------------------------------------------------

export type SavedKind = "firm" | "course" | "broker" | "tool" | "signal" | "strategy";
export type SavedItem = { kind: SavedKind; id: string; savedAt: string };

export const SAVED_KINDS: SavedKind[] = ["firm", "course", "broker", "tool", "signal", "strategy"];

export const savedStore = createListStore<SavedItem>("tradox:saved", (e) => `${e.kind}:${e.id}`, {
  isValid: (e): e is SavedItem => isRecord(e) && SAVED_KINDS.includes(e.kind as SavedKind) && typeof e.id === "string",
  sort: (a, b) => b.savedAt.localeCompare(a.savedAt),
});

export function useIsSaved(kind: SavedKind, id: string): boolean {
  const all = savedStore.use();
  return all.some((e) => e.kind === kind && e.id === id);
}

export function toggleSaved(kind: SavedKind, id: string): boolean {
  const key = `${kind}:${id}`;
  if (savedStore.find(key)) {
    savedStore.remove(key);
    return false;
  }
  savedStore.upsert({ kind, id, savedAt: new Date().toISOString() });
  return true;
}

// ---- Recently viewed --------------------------------------------------------

export type RecentKind = SavedKind | "learn";
export type RecentItem = { kind: RecentKind; id: string; viewedAt: string };

export const RECENTS_CAP = 24;

export const recentsStore = createListStore<RecentItem>("tradox:recent", (e) => `${e.kind}:${e.id}`, {
  isValid: (e): e is RecentItem => isRecord(e) && typeof e.kind === "string" && typeof e.id === "string",
  sort: (a, b) => b.viewedAt.localeCompare(a.viewedAt),
  cap: RECENTS_CAP,
});

export function recordView(kind: RecentKind, id: string) {
  recentsStore.upsert({ kind, id, viewedAt: new Date().toISOString() });
}

// ---- Alert preferences ------------------------------------------------------

export type AlertPref = { firmId: string; optedIn: boolean; updatedAt: string };

export const alertsStore = createListStore<AlertPref>("tradox:alerts", (e) => e.firmId, {
  isValid: (e): e is AlertPref => isRecord(e) && typeof e.firmId === "string" && typeof e.optedIn === "boolean",
});

export function useAlertPref(firmId: string): boolean {
  const all = alertsStore.use();
  return all.find((e) => e.firmId === firmId)?.optedIn ?? false;
}

export function setAlertPref(firmId: string, optedIn: boolean) {
  alertsStore.upsert({ firmId, optedIn, updatedAt: new Date().toISOString() });
}

// ---- Saved comparisons ------------------------------------------------------

export type ComparisonKind = "firms" | "courses" | "brokers";
export type SavedComparison = { kind: ComparisonKind; query: string; title: string; createdAt: string };

export const COMPARISON_PATHS: Record<ComparisonKind, string> = {
  firms: "/funded-accounts/compare",
  courses: "/courses/compare",
  brokers: "/brokers",
};

export const comparisonsStore = createListStore<SavedComparison>("tradox:comparisons", (e) => `${e.kind}:${e.query}`, {
  isValid: (e): e is SavedComparison => isRecord(e) && typeof e.kind === "string" && typeof e.query === "string",
  sort: (a, b) => b.createdAt.localeCompare(a.createdAt),
  cap: 50,
});

export function useIsComparisonSaved(kind: ComparisonKind, query: string): boolean {
  const all = comparisonsStore.use();
  return all.some((e) => e.kind === kind && e.query === query);
}

export function toggleComparison(kind: ComparisonKind, query: string, title: string): boolean {
  const key = `${kind}:${query}`;
  if (comparisonsStore.find(key)) {
    comparisonsStore.remove(key);
    return false;
  }
  comparisonsStore.upsert({ kind, query, title, createdAt: new Date().toISOString() });
  return true;
}
