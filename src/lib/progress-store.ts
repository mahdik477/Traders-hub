"use client";

// Learning progress — which Learn topics and strategy quizzes a visitor has
// marked as done. Built on the shared browser store (local-store.ts), so it
// works with no account; account-sync mirrors it to Supabase when signed in.

import { createListStore } from "./local-store";

export type ProgressKind = "learn" | "quiz";

export type ProgressEntry = { kind: ProgressKind; id: string; doneAt: string };

export const progressStore = createListStore<ProgressEntry>("tradox:progress", (e) => `${e.kind}:${e.id}`, {
  isValid: (e): e is ProgressEntry =>
    !!e && typeof e === "object" && ((e as ProgressEntry).kind === "learn" || (e as ProgressEntry).kind === "quiz") && typeof (e as ProgressEntry).id === "string",
});

export function getProgress(): ProgressEntry[] {
  return progressStore.get();
}

export function isDone(kind: ProgressKind, id: string): boolean {
  return progressStore.find(`${kind}:${id}`) != null;
}

export function setDone(kind: ProgressKind, id: string, done: boolean) {
  if (done) progressStore.upsert({ kind, id, doneAt: new Date().toISOString() });
  else progressStore.remove(`${kind}:${id}`);
}

export function mergeProgress(incoming: ProgressEntry[]) {
  progressStore.merge(incoming);
}

/** All progress entries, live. Empty on the server and before hydration. */
export function useProgress(): ProgressEntry[] {
  return progressStore.use();
}

export function useIsDone(kind: ProgressKind, id: string): boolean {
  const all = useProgress();
  return all.some((e) => e.kind === kind && e.id === id);
}
