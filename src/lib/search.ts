// Matching and ranking for the site-wide search. Pure functions, no React,
// so the logic is easy to test and the dialog component stays small.
//
// Scoring is deliberately simple: a title that starts with the query beats a
// title that contains it, which beats a keyword/subtitle hit. Every word in
// the query must match somewhere for an item to count at all.

import {
  CATALOG_KIND_ORDER,
  type CatalogItem,
  type CatalogKind,
} from "./catalog-types";

export type SearchHit = { item: CatalogItem; score: number };
export type SearchGroup = { kind: CatalogKind; hits: SearchHit[] };

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%$ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItem(item: CatalogItem, words: string[], full: string): number {
  const title = normalise(item.title);
  const subtitle = normalise(item.subtitle ?? "");
  const keywords = item.keywords.map(normalise);

  let score = 0;
  for (const w of words) {
    if (title === w) score += 120;
    else if (title.startsWith(w)) score += 80;
    else if (title.split(" ").some((part) => part.startsWith(w))) score += 55;
    else if (title.includes(w)) score += 35;
    else if (keywords.some((k) => k === w)) score += 30;
    else if (keywords.some((k) => k.startsWith(w) || k.includes(w))) score += 18;
    else if (subtitle.includes(w)) score += 10;
    else return 0; // every word has to land somewhere
  }
  if (full.length > 1 && title.startsWith(full)) score += 40;
  // Shorter titles are usually the more exact match.
  score -= Math.min(title.length, 60) / 10;
  return score;
}

/** Up to `limit` hits across all kinds, best first. */
export function searchCatalog(items: CatalogItem[], query: string, limit = 40): SearchHit[] {
  const full = normalise(query);
  if (!full) return [];
  const words = full.split(" ").filter(Boolean);
  const hits: SearchHit[] = [];
  for (const item of items) {
    const score = scoreItem(item, words, full);
    if (score > 0) hits.push({ item, score });
  }
  hits.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  return hits.slice(0, limit);
}

/** Groups hits by kind in the site's section order, keeping each group's
 *  own best-first order and capping each group so one big section (signal
 *  groups) can't crowd out the others. */
export function groupHits(hits: SearchHit[], perGroup = 6): SearchGroup[] {
  const byKind = new Map<CatalogKind, SearchHit[]>();
  for (const h of hits) {
    const list = byKind.get(h.item.kind) ?? [];
    if (list.length < perGroup) list.push(h);
    byKind.set(h.item.kind, list);
  }
  return CATALOG_KIND_ORDER.filter((k) => byKind.has(k)).map((kind) => ({ kind, hits: byKind.get(kind)! }));
}

/** Flat list in display order, for keyboard navigation across groups. */
export function flattenGroups(groups: SearchGroup[]): CatalogItem[] {
  return groups.flatMap((g) => g.hits.map((h) => h.item));
}
