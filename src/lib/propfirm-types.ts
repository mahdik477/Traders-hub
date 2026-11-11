// Types shared by the prop firm data loader (server) and the pricing table
// (browser). Keep this file free of Node-only imports.
//
// The data is organised the way the firms' own pricing pages are:
// firm → market → challenge type → tier → one column per account size.

export type Market = "forex" | "futures";

/** A table cell. null = not stated on the firm's pricing page (shown as a dash). */
export type Cell = string | null;

export type PriceCell = {
  /** Full (standard) price — the main number. Falls back to the promo price
   *  if the firm only lists one price. */
  full: string | null;
  /** Discounted price, only set when a promo is running. */
  discounted: string | null;
  /** e.g. "with code FALL" or "current promo". */
  discountLabel: string | null;
};

/** A raw rule value as written in the data file. "n/a" = doesn't apply to
 *  this account type, "none" = the firm says there is no such rule, null =
 *  not confirmed from the firm's own pages. Forex values are percentages of
 *  the account size; futures values are fixed USD amounts per account. */
export type RuleValue = number | "n/a" | "none" | null;

/** The rules behind a tier as plain numbers, so calculators, the compare
 *  page and the "rules in plain money" panel can do arithmetic instead of
 *  parsing the formatted table cells. Forex rules live here (one set for
 *  every size); futures per-size amounts live on each account instead. */
export type TierRules = {
  unit: "percent" | "usd";
  phase1Target: RuleValue;
  phase2Target: RuleValue;
  phase3Target: RuleValue;
  fundedTarget: RuleValue;
  dailyLoss: RuleValue;
  maxLoss: RuleValue;
  /** Free text from the firm, e.g. "EOD trailing", "static". */
  drawdownType: string | null;
  profitSplitMax: RuleValue;
  minTradingDays: RuleValue;
  consistency: string | null;
  tradingPeriod: string | null;
  feeRefund: boolean | "n/a" | "none" | null;
};

/** Our reading of a free-text drawdown_type string, for filters and the
 *  matcher. "mixed" = the firm uses different kinds at different stages. */
export type DrawdownKind = "static" | "eod-trailing" | "intraday-trailing" | "mixed" | "unknown";

export type AccountView = {
  size: number;
  /** promo ?? standard — what a visitor would actually pay today. */
  lowestPrice: number | null;
  /** Full (undiscounted) price. */
  standardPrice: number | null;
  /** Discounted price, null when there's no promo on this size. */
  promoPrice: number | null;
  /** The price is a monthly subscription. */
  monthly: boolean;
  /** Futures only: fixed USD rule amounts for this size. */
  profitTarget: RuleValue;
  dailyLoss: RuleValue;
  maxLoss: RuleValue;
};

export type TierView = {
  name: string;
  tagline: string | null;
  billing: "one-time" | "monthly";
  rules: TierRules;
  drawdownKind: DrawdownKind;
  /** Column headings, e.g. "$10K". */
  sizes: string[];
  /** Rule rows down the side; each has one value per account size. */
  rows: { label: string; values: Cell[] }[];
  prices: PriceCell[];
  /** Raw numbers, one per account size — used by the filter bar, the
   *  compare page, the cost calculator and the deals page. */
  accounts: AccountView[];
  profitSplit: number | null;
  /** null = not stated on the firm's pricing page. */
  feeRefund: boolean | null;
};

export type ChallengeView = {
  key: string;
  label: string;
  /** Small text under the button (used when the button stands for a single tier). */
  tagline: string | null;
  tiers: TierView[];
};

export type MarketView = {
  market: Market;
  partner: string | null;
  promoCode: string | null;
  challenges: ChallengeView[];
};

/** A rating as published on a review site (Trustpilot, Google). We don't
 *  verify it — the page names the source and the date it was checked. */
export type ReviewRating = {
  /** Out of 5. */
  rating: number;
  reviewCount: number | null;
  url: string | null;
  /** YYYY-MM-DD the rating was read from the site. */
  checked: string | null;
};

export type FirmReviews = {
  /** YYYY-MM-DD the review sites were last checked (even if they showed no
   *  rating). */
  checked: string | null;
  trustpilot: ReviewRating | null;
  /** Shown under the rating, or instead of it when there's none (e.g. why
   *  Trustpilot isn't showing a score). */
  trustpilotNote: string | null;
  google: ReviewRating | null;
  googleNote: string | null;
  /** Short excerpts from recent Trustpilot reviews, picked to show a range of
   *  opinions. Collected for firms with no Google rating. */
  trustpilotQuotes: ReviewQuote[];
};

export type ReviewQuote = {
  /** The reviewer's exact words (one continuous excerpt, may end in "…"). */
  quote: string;
  /** First name + last initial, e.g. "Sam K.". */
  author: string;
  /** The reviewer's own star rating, 1–5. */
  stars: number | null;
  /** YYYY-MM-DD. */
  date: string | null;
  url: string | null;
};

/** Where a firm does and doesn't accept traders, as published by the firm.
 *  Codes are ISO 3166-1 alpha-2 ("AE", "US"). restricted = blocked list;
 *  allowedOnly = the firm only serves these countries. Both null = the firm
 *  hasn't published a list we could find. */
export type FirmCountries = {
  restricted: string[] | null;
  allowedOnly: string[] | null;
  notes: string | null;
  source: string | null;
  /** YYYY-MM-DD the country rules were read. */
  lastChecked: string | null;
};

export type FirmView = {
  /** Also the page address: /funded-accounts/<id>. */
  id: string;
  name: string;
  /** YYYY-MM-DD the data file was last checked against the firm's live
   *  pricing page (from _notes.last_verified). Null if the file has none. */
  lastVerified: string | null;
  /** The firm's own website (not the affiliate link). */
  website: string | null;
  founded: number | null;
  hq: string | null;
  countries: FirmCountries | null;
  /** Path under /public, e.g. "/funded-accounts/ftmo-logo.png". Null = show
   *  the firm's initials instead. */
  logo: string | null;
  /** "dark" for a logo that's a white/light mark with no transparent
   *  background, so it doesn't look broken in the usual white tile. */
  logoBg: "white" | "dark";
  /** e.g. "not the same company as..." — shown under the firm name. */
  nameNote: string | null;
  about: string | null;
  /** Small caveat under the About text, e.g. "not yet verified". */
  aboutNote: string | null;
  currency: string;
  /** "Visit site" link. Only shown when filled in; null if empty or not a
   *  normal web address. */
  affiliateLink: string | null;
  platforms: string[] | null;
  /** null = no reviews block in the data file yet. */
  reviews: FirmReviews | null;
  /** Set when many recent Trustpilot reviews describe refused or withheld
   *  payouts. The card badge always reads "Payout complaints in recent
   *  reviews", so only use it for that. Shown as a warning box on the firm
   *  page and a badge on its card. null = no alert. */
  reviewAlert: ReviewAlert | null;
  markets: MarketView[];
};

export type ReviewAlert = {
  /** Factual summary in our own words, e.g. "About half of the 20 most recent
   *  Trustpilot reviews describe a refused payout." */
  summary: string;
  /** YYYY-MM-DD the reviews were read. */
  checked: string;
  /** Link to the reviews (sorted newest first). */
  url: string | null;
};
