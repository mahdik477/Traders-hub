// Detail-page links back to the directory. Only known filter keys are kept,
// so a crafted `from` value cannot send the back link off this site.

import { signalFiltersFromSearch, signalFiltersToSearch } from "./signal-group-filters";

const SORTS = new Set(["listed", "name", "members", "category"]);

export function signalGroupDetailHref(slug: string, listingSearch: string): string {
  const path = `/signal-groups/${slug}`;
  if (!listingSearch) return path;
  return `${path}?from=${encodeURIComponent(listingSearch)}`;
}

export function signalGroupListingHref(from: string | null | undefined): string {
  if (!from) return "/signal-groups";
  const raw = from.startsWith("?") ? from.slice(1) : from;
  if (!raw || raw.length > 500) return "/signal-groups";

  const filters = signalFiltersFromSearch(raw);
  const params = new URLSearchParams(signalFiltersToSearch(filters));
  const incoming = new URLSearchParams(raw);
  const sort = incoming.get("sort");
  if (sort && sort !== "listed" && SORTS.has(sort)) params.set("sort", sort);
  if (incoming.get("view") === "grid") params.set("view", "grid");
  const page = Number(incoming.get("page"));
  if (Number.isInteger(page) && page > 1 && page < 1000) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/signal-groups?${qs}` : "/signal-groups";
}
