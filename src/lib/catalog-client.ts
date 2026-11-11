"use client";

import type { CatalogItem } from "./catalog-types";

// Fetches the static catalogue JSON (/api/search-index) once per visit and
// shares it between the search dialog and My Hub, so neither page has to
// carry ~700 entries in its HTML.

let cache: CatalogItem[] | null = null;
let pending: Promise<CatalogItem[]> | null = null;

export function getCachedCatalog(): CatalogItem[] | null {
  return cache;
}

export function loadCatalog(): Promise<CatalogItem[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch("/api/search-index")
      .then((r) => (r.ok ? (r.json() as Promise<CatalogItem[]>) : Promise.reject(new Error(String(r.status)))))
      .then((items) => {
        cache = items;
        return items;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
