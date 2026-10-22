// How the Signal Groups directory combines ticks.
// Within Trading style, Price and Language, ticked options combine with OR.
// Across those groups, and with market and search, they combine with AND.
// Extras are the exception: a group must have every ticked extra.
// Nothing ticked in a group means that group does not filter.
// `style=any` / `price=any` / `language=any` from older links mean "no filter".

const MARKETS = new Set([
  "gold",
  "forex-majors",
  "forex-minors",
  "indices",
  "crypto",
  "oil",
  "stocks-options",
]);
const STYLES = ["scalping", "day-trading", "swing"];
const PRICES = ["free", "paid", "free-and-vip"];
const EXTRAS = ["education", "copy-trading", "prop-firm"];
const STYLE_SET = new Set(STYLES);
const PRICE_SET = new Set(PRICES);
const EXTRA_SET = new Set(EXTRAS);

export function emptySignalFilters() {
  return {
    market: "all",
    styles: [],
    prices: [],
    extras: [],
    languages: [],
    query: "",
  };
}

function parseAllowed(raw, allowed, order) {
  if (!raw) return [];
  const picked = new Set();
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (allowed.has(value)) picked.add(value);
  }
  return order.filter((value) => picked.has(value));
}

function parseLanguages(raw) {
  if (!raw) return [];
  const picked = [];
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (!value || value.toLowerCase() === "any" || picked.includes(value)) continue;
    picked.push(value);
  }
  return picked.sort((a, b) => a.localeCompare(b));
}

export function signalFiltersFromSearch(search) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const market = params.get("market") ?? "all";
  return {
    market: MARKETS.has(market) ? market : "all",
    styles: parseAllowed(params.get("style"), STYLE_SET, STYLES),
    prices: parseAllowed(params.get("price"), PRICE_SET, PRICES),
    extras: parseAllowed(params.get("extras"), EXTRA_SET, EXTRAS),
    languages: parseLanguages(params.get("language")),
    query: params.get("q") ?? "",
  };
}

export function signalFiltersToSearch(filters) {
  const params = new URLSearchParams();
  if (filters.market !== "all") params.set("market", filters.market);
  const styles = STYLES.filter((value) => filters.styles.includes(value));
  const prices = PRICES.filter((value) => filters.prices.includes(value));
  const extras = EXTRAS.filter((value) => filters.extras.includes(value));
  if (styles.length) params.set("style", styles.join(","));
  if (prices.length) params.set("price", prices.join(","));
  if (extras.length) params.set("extras", extras.join(","));
  if (filters.languages.length) {
    params.set("language", [...filters.languages].sort((a, b) => a.localeCompare(b)).join(","));
  }
  const query = filters.query.trim();
  if (query) params.set("q", query);
  return params.toString();
}

export function signalFilterTickCount(filters) {
  return filters.styles.length + filters.prices.length + filters.extras.length + filters.languages.length;
}

/** Structured filters only. Search text is applied by the directory. */
export function signalGroupMatchesFilters(group, filters) {
  if (filters.market !== "all" && !group.markets.includes(filters.market)) return false;
  if (filters.styles.length > 0 && !filters.styles.some((style) => group.styles.includes(style))) return false;
  if (filters.prices.length > 0 && !filters.prices.includes(group.price)) return false;
  if (filters.extras.some((extra) => !group.extras.includes(extra))) return false;
  if (filters.languages.length > 0 && !filters.languages.includes(group.language)) return false;
  return true;
}
