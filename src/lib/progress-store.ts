"use client";

// Learning progress — which Learn topics and strategy quizzes a visitor has
// marked as done. Browser-first: lives in localStorage so it works with no
// account, read through useSyncExternalStore so every component showing a
// tick updates together. When the visitor is signed in, account-sync.ts
// mirrors the same set to their Supabase row and back; this store doesn't
// know or care whether that's happening.
//
// Every localStorage read/write is wrapped in try/catch: private windows and
// blocked storage must never break the page, they just forget.

import { useSyncExternalStore } from "react";

export type ProgressKind = "learn" | "quiz";

export type ProgressEntry = { kind: ProgressKind; id: string; doneAt: string };

const STORAGE_KEY = "tradox:progress";
const EVENT = "tradox:progress-change";

let cache: ProgressEntry[] | null = null;

function read(): ProgressEntry[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter(
          (e): e is ProgressEntry =>
            !!e && typeof e === "object" && (e as ProgressEntry).kind != null && typeof (e as ProgressEntry).id === "string",
        )
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: ProgressEntry[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked — the in-memory copy still drives this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const EMPTY: ProgressEntry[] = [];

export function getProgress(): ProgressEntry[] {
  return typeof window === "undefined" ? EMPTY : read();
}

export function isDone(kind: ProgressKind, id: string): boolean {
  return getProgress().some((e) => e.kind === kind && e.id === id);
}

export function setDone(kind: ProgressKind, id: string, done: boolean) {
  const current = read().filter((e) => !(e.kind === kind && e.id === id));
  write(done ? [...current, { kind, id, doneAt: new Date().toISOString() }] : current);
}

/** Adds entries from another source (an account) without dropping local ones. */
export function mergeProgress(incoming: ProgressEntry[]) {
  const current = read();
  const seen = new Set(current.map((e) => `${e.kind}:${e.id}`));
  const added = incoming.filter((e) => !seen.has(`${e.kind}:${e.id}`));
  if (added.length) write([...current, ...added]);
}

/** Forces a re-read from localStorage (after another tab or a sync wrote it). */
export function invalidateProgress() {
  cache = null;
  window.dispatchEvent(new Event(EVENT));
}

/** All progress entries, live. Empty on the server and before hydration. */
export function useProgress(): ProgressEntry[] {
  return useSyncExternalStore(subscribe, getProgress, () => EMPTY);
}

export function useIsDone(kind: ProgressKind, id: string): boolean {
  const all = useProgress();
  return all.some((e) => e.kind === kind && e.id === id);
}
