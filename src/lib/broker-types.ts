// Types shared by the broker data loader (server) and the directory/detail
// pages (may render on the client). Keep this file free of Node-only imports.

import type { PricingTier, TrustpilotRating } from "./course-types";

/**
 * Which Brokers tab a listing belongs on. These three are the whole
 * directory: CFD is the only tab with listings (VT Markets and PU Prime).
 * Stock brokers and crypto exchanges stay empty until a real listing exists.
 */
export type BrokerCategory = "cfd" | "stocks" | "crypto";

export const BROKER_CATEGORY_ORDER: BrokerCategory[] = ["cfd", "stocks", "crypto"];

export const BROKER_CATEGORY_LABELS: Record<BrokerCategory, string> = {
  cfd: "CFD brokers",
  stocks: "Stock brokers",
  crypto: "Crypto exchanges",
};

/** Singular label for one row, such as the homepage preview. */
export const BROKER_CATEGORY_ITEM_LABELS: Record<BrokerCategory, string> = {
  cfd: "CFD broker",
  stocks: "Stock broker",
  crypto: "Crypto exchange",
};

/**
 * Canonical page for each tab. CFD lives at /brokers. The other two are
 * their own addresses so a tab can be shared. /brokers?type=stocks and
 * /brokers/cfd redirect to these (see src/proxy.ts).
 */
export const BROKER_CATEGORY_PATHS: Record<BrokerCategory, string> = {
  cfd: "/brokers",
  stocks: "/brokers/stocks",
  crypto: "/brokers/crypto",
};

export const BROKER_CATEGORY_DESCRIPTIONS: Record<BrokerCategory, string> = {
  cfd: "Two CFD brokers side by side: deposit, leverage and regulators. VT Markets is listed first. We do not score trading results.",
  stocks: "Stock brokers for trading your own capital. None are listed yet.",
  crypto: "Crypto exchanges for trading your own capital. None are listed yet.",
};

/** Route segments that are tabs, not broker pages. A listing id must not use one. */
export const BROKER_RESERVED_IDS = ["cfd", "stocks", "crypto"] as const;

export function isBrokerCategory(value: string | null | undefined): value is BrokerCategory {
  return value === "cfd" || value === "stocks" || value === "crypto";
}

// What you can trade through the broker — used for the directory filter.
export type BrokerMarket =
  | "stocks"
  | "options"
  | "futures"
  | "forex"
  | "bonds"
  | "funds"
  | "crypto"
  | "cfds";

export const BROKER_MARKET_LABELS: Record<BrokerMarket, string> = {
  stocks: "Stocks & ETFs",
  options: "Options",
  futures: "Futures",
  forex: "Forex",
  bonds: "Bonds",
  funds: "Funds",
  crypto: "Crypto",
  cfds: "CFDs",
};

/** One regulator the broker is licensed by, through one of its companies.
 *  Big brokers have several — which one a client gets depends on where they
 *  live. */
export type BrokerRegulator = {
  /** Short name, e.g. "FCA". Used for the directory filter. */
  regulator: string;
  /** ISO 3166-1 alpha-2, e.g. "GB". */
  country: string;
  /** The broker's company that holds this licence, e.g. "Interactive
   *  Brokers (U.K.) Limited". Null if we couldn't confirm it. */
  entity: string | null;
};

/** One line in a costs/fees table, e.g. "IBKR Pro — Fixed: $0.005 per share". */
export type CostRow = {
  label: string;
  value: string;
  /** Minimums, caps and what's charged on top — in plain English. */
  note: string | null;
};

/** A group of cost rows for one market, e.g. "US stocks & ETFs". */
export type CostGroup = {
  title: string;
  rows: CostRow[];
};

export type LeverageRow = {
  market: string;
  value: string;
  note: string | null;
};

/** Interest charged on borrowed money, by loan size — one column per
 *  account plan, since plans often have different rates. */
export type MarginRates = {
  columns: string[];
  rows: { tier: string; values: string[] }[];
  note: string | null;
};

export type BrokerView = {
  /** Also the page address: /brokers/<id>. */
  id: string;
  name: string;
  /** Which tab this listing appears on. */
  category: BrokerCategory;
  /** Path under /public. Null falls back to a lettermark. */
  logo: string | null;
  logoBg: "white" | "dark";
  tagline: string | null;
  about: string | null;
  founded: number | null;
  headquarters: string | null;
  /** Plain number in `currency`. Null = not stated by the broker. */
  minDeposit: number | null;
  currency: string;
  markets: BrokerMarket[];
  regulators: BrokerRegulator[];
  regulatorsNote: string | null;
  /** A company registration, when the broker does not publish a conduct licence. */
  companyRegistration: string | null;
  platforms: string[];
  /** Account plans/types, shown as clickable cards like course pricing. */
  plans: PricingTier[];
  costs: CostGroup[];
  costsNote: string | null;
  leverage: LeverageRow[];
  /** One line for cards and the compare table. Null falls back to the first leverage row. */
  leverageSummary: string | null;
  /** Always shown with the leverage table. Leverage magnifies losses. */
  leverageNote: string;
  marginRates: MarginRates | null;
  otherFees: CostRow[];
  trustpilot: TrustpilotRating | null;
  /**
   * A published offer, in our own words. Null if we did not see one.
   * The page always adds a line that offers change and must be checked
   * on the broker's site.
   */
  promotions: string | null;
  website: string | null;
  /**
   * Featured listing. Pinned to the top of the brokers directory, with an
   * "Our choice" badge. Not a score of trading results.
   */
  ourChoice: boolean;
  /**
   * Slot in the default name sort, after every Our choice broker.
   * 2 means second when one broker is already Our choice. Not a badge.
   */
  directoryPin: number | null;
  /**
   * The only place an affiliate URL goes. Null until the owner supplies one.
   * Visit buttons use affiliateLink, then website. Swap this field later
   * and every outbound button for the broker updates.
   */
  affiliateLink: string | null;
};

/** The single outbound URL for a broker. Affiliate link wins once it exists. */
export function brokerOutboundUrl(broker: {
  affiliateLink: string | null;
  website: string | null;
}): string | null {
  return broker.affiliateLink ?? broker.website;
}

/** "$0", "$2,000" — in the broker's own currency, no conversion. */
export function formatDeposit(amount: number | null, currency: string): string | null {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
