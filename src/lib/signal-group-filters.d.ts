import type { SignalExtra, SignalGroupView, SignalMarket, SignalPrice, SignalStyle } from "./signal-group-types";

export type SignalFilterSelection = {
  market: SignalMarket | "all";
  styles: SignalStyle[];
  prices: SignalPrice[];
  extras: SignalExtra[];
  languages: string[];
  query: string;
};

export function emptySignalFilters(): SignalFilterSelection;

export function signalFiltersFromSearch(search: string): SignalFilterSelection;

export function signalFiltersToSearch(filters: SignalFilterSelection): string;

export function signalFilterTickCount(filters: Pick<SignalFilterSelection, "styles" | "prices" | "extras" | "languages">): number;

export function signalGroupMatchesFilters(
  group: Pick<SignalGroupView, "markets" | "styles" | "price" | "extras" | "language">,
  filters: Pick<SignalFilterSelection, "market" | "styles" | "prices" | "extras" | "languages">,
): boolean;
