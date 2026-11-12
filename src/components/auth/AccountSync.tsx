"use client";

import { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ListStore } from "@/lib/local-store";
import {
  alertsStore,
  comparisonsStore,
  recentsStore,
  savedStore,
  stackStore,
  SAVED_KINDS,
  STACK_KINDS,
  type AlertPref,
  type RecentItem,
  type RecentKind,
  type SavedKind,
  type SavedComparison,
  type SavedItem,
  type StackItem,
  type StackKind,
} from "@/lib/local-store";
import { progressStore, type ProgressEntry } from "@/lib/progress-store";

// Keeps the browser-side stores and the signed-in person's own Supabase rows
// in step. Runs once per sign-in:
//
//   1. Pull their rows and merge them into the browser (nothing local is
//      ever thrown away — merging means "union").
//   2. Push anything local that the account didn't have yet.
//   3. From then on, every local change is mirrored: new/changed entries are
//      upserted, removed entries are deleted, by comparing against the set
//      we last knew the server had.
//
// All queries are scoped by the row-level-security policies in
// supabase/schema.sql, so a person can only ever read or write their own
// rows. Errors are logged and swallowed: a sync hiccup must never break the
// page — the browser copy is always the one the UI shows.

type Spec<T> = {
  table: string;
  store: ListStore<T>;
  toRow: (entry: T, userId: string) => Record<string, unknown>;
  fromRow: (row: Record<string, unknown>) => T | null;
  /** Columns that identify a row for delete/upsert (besides user_id). */
  conflict: string;
  /** Alerts flip a boolean instead of being deleted. */
  neverDelete?: boolean;
};

function define<T>(s: Spec<T>): Spec<unknown> {
  return s as unknown as Spec<unknown>;
}

const str = (v: unknown) => (typeof v === "string" ? v : null);

const SPECS: Spec<unknown>[] = [
  define<SavedItem>({
    table: "saved_items",
    store: savedStore,
    toRow: (e, user_id) => ({ user_id, kind: e.kind, item_id: e.id, saved_at: e.savedAt }),
    fromRow: (r) => {
      const kind = str(r.kind), item_id = str(r.item_id);
      return kind && item_id && SAVED_KINDS.includes(kind as SavedKind)
        ? { kind: kind as SavedKind, id: item_id, savedAt: str(r.saved_at) ?? new Date().toISOString() }
        : null;
    },
    conflict: "user_id,kind,item_id",
  }),
  define<RecentItem>({
    table: "recently_viewed",
    store: recentsStore,
    toRow: (e, user_id) => ({ user_id, kind: e.kind, item_id: e.id, viewed_at: e.viewedAt }),
    fromRow: (r) => {
      const kind = str(r.kind), item_id = str(r.item_id);
      return kind && item_id && (kind === "learn" || SAVED_KINDS.includes(kind as SavedKind))
        ? { kind: kind as RecentKind, id: item_id, viewedAt: str(r.viewed_at) ?? new Date().toISOString() }
        : null;
    },
    conflict: "user_id,kind,item_id",
  }),
  define<ProgressEntry>({
    table: "learning_progress",
    store: progressStore,
    toRow: (e, user_id) => ({ user_id, kind: e.kind, item_id: e.id, completed_at: e.doneAt }),
    fromRow: (r) => {
      const kind = str(r.kind), item_id = str(r.item_id);
      return (kind === "learn" || kind === "quiz") && item_id ? { kind, id: item_id, doneAt: str(r.completed_at) ?? new Date().toISOString() } : null;
    },
    conflict: "user_id,kind,item_id",
  }),
  define<AlertPref>({
    table: "alert_preferences",
    store: alertsStore,
    toRow: (e, user_id) => ({ user_id, firm_id: e.firmId, opted_in: e.optedIn, updated_at: e.updatedAt }),
    fromRow: (r) => {
      const firm_id = str(r.firm_id);
      return firm_id ? { firmId: firm_id, optedIn: r.opted_in === true, updatedAt: str(r.updated_at) ?? new Date().toISOString() } : null;
    },
    conflict: "user_id,firm_id",
    neverDelete: true,
  }),
  define<SavedComparison>({
    table: "saved_comparisons",
    store: comparisonsStore,
    toRow: (e, user_id) => ({ user_id, kind: e.kind, query: e.query, title: e.title, created_at: e.createdAt }),
    fromRow: (r) => {
      const kind = str(r.kind), query = str(r.query);
      return query && (kind === "firms" || kind === "courses" || kind === "brokers")
        ? { kind, query, title: str(r.title) ?? "", createdAt: str(r.created_at) ?? new Date().toISOString() }
        : null;
    },
    conflict: "user_id,kind,query",
  }),
  // "What I'm using". If the founders haven't run the my_stack migration
  // yet, the first select fails, syncSpec returns false and this store simply
  // stays browser-only — nothing else is affected.
  define<StackItem>({
    table: "my_stack",
    store: stackStore,
    toRow: (e, user_id) => ({ user_id, kind: e.kind, item_id: e.id, since: e.since }),
    fromRow: (r) => {
      const kind = str(r.kind), item_id = str(r.item_id);
      return kind && item_id && STACK_KINDS.includes(kind as StackKind)
        ? { kind: kind as StackKind, id: item_id, since: str(r.since) ?? new Date().toISOString() }
        : null;
    },
    conflict: "user_id,kind,item_id",
  }),
];

async function syncSpec<T>(spec: Spec<T>, supabase: SupabaseClient, userId: string, known: Map<string, T>) {
  const { data, error } = await supabase.from(spec.table).select("*").eq("user_id", userId);
  if (error) {
    console.warn(`[account-sync] ${spec.table}: ${error.message}`);
    return false;
  }
  const remote = ((data ?? []) as Record<string, unknown>[]).map(spec.fromRow).filter((e): e is T => e != null);
  known.clear();
  for (const e of remote) known.set(spec.store.key(e), e);

  // Pull: anything the account has that this browser doesn't.
  spec.store.merge(remote);

  // Push: anything this browser has that the account doesn't.
  const missing = spec.store.get().filter((e) => !known.has(spec.store.key(e)));
  if (missing.length) {
    const { error: upErr } = await supabase
      .from(spec.table)
      .upsert(missing.map((e) => spec.toRow(e, userId)), { onConflict: spec.conflict });
    if (upErr) console.warn(`[account-sync] push ${spec.table}: ${upErr.message}`);
    else for (const e of missing) known.set(spec.store.key(e), e);
  }
  return true;
}

async function reconcile<T>(spec: Spec<T>, supabase: SupabaseClient, userId: string, known: Map<string, T>) {
  const current = spec.store.get();
  const currentKeys = new Set(current.map(spec.store.key));
  const changed = current.filter((e) => JSON.stringify(known.get(spec.store.key(e))) !== JSON.stringify(e));
  const removed = [...known.keys()].filter((k) => !currentKeys.has(k));

  if (changed.length) {
    const { error } = await supabase.from(spec.table).upsert(changed.map((e) => spec.toRow(e, userId)), { onConflict: spec.conflict });
    if (error) console.warn(`[account-sync] upsert ${spec.table}: ${error.message}`);
    else for (const e of changed) known.set(spec.store.key(e), e);
  }
  if (removed.length && !spec.neverDelete) {
    for (const k of removed) {
      const entry = known.get(k);
      if (!entry) continue;
      const row = spec.toRow(entry, userId);
      let q = supabase.from(spec.table).delete().eq("user_id", userId);
      for (const col of spec.conflict.split(",")) if (col !== "user_id") q = q.eq(col, row[col] as string);
      const { error } = await q;
      if (error) console.warn(`[account-sync] delete ${spec.table}: ${error.message}`);
      else known.delete(k);
    }
  }
}

export default function AccountSync() {
  const { status, user, supabase } = useAuth();
  const active = useRef(false);

  useEffect(() => {
    if (status !== "signed-in" || !user || !supabase) return;
    let cancelled = false;
    active.current = true;
    const knownBySpec = SPECS.map(() => new Map<string, unknown>());
    const unsubs: (() => void)[] = [];
    // One pending reconcile per store, debounced so a burst of clicks is one
    // round-trip.
    const timers: (number | null)[] = SPECS.map(() => null);
    const pending: boolean[] = SPECS.map(() => false);

    (async () => {
      for (let i = 0; i < SPECS.length; i++) {
        if (cancelled) return;
        const spec = SPECS[i];
        const ok = await syncSpec(spec, supabase, user.id, knownBySpec[i]);
        if (!ok || cancelled) continue;
        unsubs.push(
          spec.store.subscribe(() => {
            if (timers[i]) window.clearTimeout(timers[i]!);
            pending[i] = true;
            timers[i] = window.setTimeout(() => {
              pending[i] = false;
              if (!cancelled) reconcile(spec, supabase, user.id, knownBySpec[i]);
            }, 400);
          }),
        );
      }
    })();

    return () => {
      // Push anything still waiting in a debounce before we stop listening,
      // so a Save made just before a sign-out/refresh isn't lost.
      for (let i = 0; i < SPECS.length; i++) {
        if (timers[i]) window.clearTimeout(timers[i]!);
        if (pending[i]) reconcile(SPECS[i], supabase, user.id, knownBySpec[i]);
      }
      cancelled = true;
      active.current = false;
      for (const u of unsubs) u();
    };
  }, [status, user, supabase]);

  return null;
}
