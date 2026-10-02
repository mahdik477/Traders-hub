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

export type TierView = {
  name: string;
  tagline: string | null;
  /** Column headings, e.g. "$10K". */
  sizes: string[];
  /** Rule rows down the side; each has one value per account size. */
  rows: { label: string; values: Cell[] }[];
  prices: PriceCell[];
  /** Raw numbers used by the filter bar, one per account size.
   *  `monthly` = the price is a monthly subscription. */
  accounts: { size: number; lowestPrice: number | null; monthly: boolean }[];
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

export type FirmView = {
  /** Also the page address: /funded-accounts/<id>. */
  id: string;
  name: string;
  /** Path under /public, e.g. "/funded-accounts/ftmo-logo.png". Null = show
   *  the firm's initials instead. */
  logo: string | null;
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
  markets: MarketView[];
};
