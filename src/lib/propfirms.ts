// Loads every `propfirms-data-*.json` file in the project root and organises it
// the way the firms' own pricing pages are laid out:
// firm → market → challenge type → tier → one column per account size.
// To add a firm, drop a new `propfirms-data-<NAME>.json` file next to the others
// and redeploy — no code changes needed.
//
// Files are read at build time, so the published page is static and the server
// never reads them at runtime (hence the turbopackIgnore hints below).

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type {
  Cell,
  ChallengeView,
  FirmView,
  MarketView,
  ReviewRating,
  TierView,
} from "./propfirm-types";

// ---- Shape of the JSON files ------------------------------------------------

// Every rule value can be one of three kinds of "empty":
//   "n/a"  = doesn't apply to this account type (e.g. Phase 2 target on a
//            1-step challenge) — shown as "N/A".
//   "none" = the firm's own page says there is no such rule/limit — shown
//            as "None".
//   null   = not confirmed from the firm's own pages yet — shown as "—".
type Empty = "n/a" | "none" | null;

type RawForexRules = {
  unit: "percent";
  phase1_target: number | Empty;
  phase2_target: number | Empty;
  /** Only for 3-step evaluations. */
  phase3_target?: number | Empty;
  funded_target: number | Empty;
  daily_loss: number | Empty;
  max_loss: number | Empty;
  drawdown_type?: string | null;
  profit_split_max: number | Empty;
  min_trading_days: number | Empty;
  consistency: string | null;
  trading_period: string | null;
  fee_refund: boolean | Empty;
};

type RawFuturesRules = {
  unit: "usd";
  drawdown_type?: string | null;
  consistency_pct: number | Empty;
  min_trading_days: number | Empty;
  profit_split_max: number | Empty;
  fee_refund?: boolean | Empty;
};

type RawAccount = {
  size: number;
  promo: number | null;
  standard: number | null;
  // Futures only: rules are fixed USD amounts per account size.
  profit_target?: number | Empty;
  daily_loss?: number | Empty;
  max_loss?: number | Empty;
  max_contracts?: number | Empty;
  payout_cap?: number | Empty;
};

type RawTier = {
  tier: string;
  tagline: string | null;
  /** "monthly" for subscription pricing (shown as "/month"). Default: one-time. */
  billing?: "one-time" | "monthly" | null;
  rules: RawForexRules | RawFuturesRules;
  accounts: RawAccount[];
};

type RawProgram = { program: string; tiers: RawTier[] };

type RawRating = {
  rating: number;
  review_count?: number | null;
  url?: string | null;
  checked?: string | null;
};

type RawFile = {
  firm: {
    id: string;
    name: string;
    logo?: string | null;
    logo_bg?: "white" | "dark" | null;
    name_note?: string | null;
    about?: string | null;
    about_note?: string | null;
    currency: string;
    affiliate_link?: string | null;
    platforms: string[] | null;
    reviews?: {
      checked?: string | null;
      trustpilot?: RawRating | null;
      trustpilot_note?: string | null;
      google?: RawRating | null;
      google_note?: string | null;
      trustpilot_quotes?: {
        quote: string;
        author: string;
        stars?: number | null;
        date?: string | null;
        url?: string | null;
      }[];
    } | null;
    review_alert?: { summary: string; checked: string; url?: string | null } | null;
    markets: {
      market: string;
      partner?: string;
      promo_code?: string;
      programs: RawProgram[];
    }[];
  };
};

const DATA_FILE_PATTERN = /^propfirms-data-.+\.json$/i;

const PROGRAM_LABELS: Record<string, string> = {
  "1-step": "1-Step",
  "2-step": "2-Step",
  "3-step": "3-Step",
  instant: "Instant",
};

function loadFirms(): FirmView[] {
  const dir = process.cwd();
  const files = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => DATA_FILE_PATTERN.test(f))
    .sort();

  const firms = files.map((file) => {
    let data: RawFile;
    try {
      data = JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf-8"));
    } catch (err) {
      throw new Error(`Could not read prop firm data file "${file}": ${err}`);
    }
    if (!data?.firm?.markets) {
      throw new Error(`Prop firm data file "${file}" is missing "firm.markets".`);
    }
    // The id becomes the page address, so keep it to lowercase letters,
    // numbers and dashes.
    if (!/^[a-z0-9-]+$/.test(data.firm.id ?? "")) {
      throw new Error(
        `Prop firm data file "${file}": "id" must use only lowercase letters, numbers and dashes.`,
      );
    }
    return buildFirm(data.firm);
  });

  const ids = firms.map((f) => f.id);
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) throw new Error(`Two prop firm data files use the id "${duplicate}".`);
  return firms;
}

function buildFirm(firm: RawFile["firm"]): FirmView {
  const markets: MarketView[] = [];
  for (const m of firm.markets) {
    if (m.market !== "forex" && m.market !== "futures") continue;
    const discountLabel = m.promo_code ? `with code ${m.promo_code}` : "current promo";
    markets.push({
      market: m.market,
      partner: m.partner ?? null,
      promoCode: m.promo_code ?? null,
      challenges:
        m.market === "forex"
          ? m.programs.map((p) => forexChallenge(p, firm.currency, discountLabel))
          : m.programs.flatMap((p) => futuresChallenges(p, firm.currency, discountLabel)),
    });
  }
  return {
    id: firm.id,
    name: firm.name,
    // Only local files under /public — never a remote image URL.
    logo: firm.logo?.startsWith("/") ? firm.logo : null,
    logoBg: firm.logo_bg === "dark" ? "dark" : "white",
    nameNote: firm.name_note || null,
    about: firm.about || null,
    aboutNote: firm.about_note || null,
    currency: firm.currency,
    affiliateLink: safeLink(firm.affiliate_link),
    platforms: firm.platforms,
    reviews: firm.reviews
      ? {
          checked: firm.reviews.checked ?? null,
          trustpilot: rating(firm.reviews.trustpilot),
          trustpilotNote: firm.reviews.trustpilot_note || null,
          google: rating(firm.reviews.google),
          googleNote: firm.reviews.google_note || null,
          trustpilotQuotes: (firm.reviews.trustpilot_quotes ?? []).map((q) => ({
            quote: q.quote,
            author: q.author,
            stars: q.stars ?? null,
            date: q.date ?? null,
            url: safeLink(q.url),
          })),
        }
      : null,
    reviewAlert: firm.review_alert?.summary
      ? {
          summary: firm.review_alert.summary,
          checked: firm.review_alert.checked,
          url: safeLink(firm.review_alert.url),
        }
      : null,
    markets,
  };
}

function rating(r: RawRating | null | undefined): ReviewRating | null {
  if (!r) return null;
  return {
    rating: r.rating,
    reviewCount: r.review_count ?? null,
    url: safeLink(r.url),
    checked: r.checked ?? null,
  };
}

// Forex: the challenge type is the program (1-Step / 2-Step / Instant) and the
// tiers sit underneath it.
function forexChallenge(p: RawProgram, currency: string, discountLabel: string): ChallengeView {
  return {
    key: p.program,
    label: PROGRAM_LABELS[p.program] ?? p.program,
    tagline: null,
    tiers: p.tiers.map((t) => buildTier(t, currency, discountLabel)),
  };
}

// Futures: each evaluation tier is its own challenge type (Flex / PRO), plus
// Instant — matching how futures firms present them.
function futuresChallenges(
  p: RawProgram,
  currency: string,
  discountLabel: string,
): ChallengeView[] {
  if (p.program === "instant") {
    return [
      {
        key: "instant",
        label: "Instant",
        tagline: p.tiers.length === 1 ? p.tiers[0].tagline : null,
        tiers: p.tiers.map((t) => buildTier(t, currency, discountLabel)),
      },
    ];
  }
  return p.tiers.map((t) => ({
    key: `${p.program}-${t.tier}`,
    label: t.tier,
    tagline: t.tagline,
    tiers: [buildTier(t, currency, discountLabel)],
  }));
}

function buildTier(
  t: RawTier,
  currency: string,
  discountLabel: string,
): TierView {
  const accounts = [...t.accounts].sort((a, b) => a.size - b.size);
  const n = accounts.length;
  const same = (v: Cell): Cell[] => Array(n).fill(v);
  const monthly = t.billing === "monthly";
  const period = monthly ? "/month" : "";
  const rows: TierView["rows"] = [];

  if (t.rules.unit === "percent") {
    // Forex: rules are a % of account size, the same for every size.
    const r = t.rules;
    const pct = (v: number | Empty) => show(v, (n) => `${n}%`);

    rows.push({ label: "Profit target (Phase 1)", values: same(pct(r.phase1_target)) });
    rows.push({ label: "Profit target (Phase 2)", values: same(pct(r.phase2_target)) });
    // Only 3-step programs have a third phase; other files leave it out.
    if (r.phase3_target !== undefined) {
      rows.push({ label: "Profit target (Phase 3)", values: same(pct(r.phase3_target)) });
    }
    rows.push({ label: "Profit target (Funded)", values: same(pct(r.funded_target)) });
    rows.push({ label: "Daily loss", values: same(pct(r.daily_loss)) });
    rows.push({ label: "Max loss", values: same(pct(r.max_loss)) });
    if (r.drawdown_type) rows.push({ label: "Drawdown type", values: same(capitalise(r.drawdown_type)) });
    rows.push({ label: "Profit split", values: same(split(r.profit_split_max)) });
    rows.push({ label: "Min trading days", values: same(days(r.min_trading_days)) });
    rows.push({ label: "Consistency", values: same(text(r.consistency)) });
    rows.push({ label: "Trading period", values: same(text(r.trading_period)) });
    rows.push({ label: "Fee refund", values: same(yesNo(r.fee_refund)) });
  } else {
    // Futures: rules are fixed USD amounts that change with account size.
    const r = t.rules;
    const col = (key: "profit_target" | "daily_loss" | "max_loss" | "payout_cap") =>
      accounts.map((a) => show(a[key], usd));

    rows.push({ label: "Profit target", values: col("profit_target") });
    rows.push({ label: "Daily loss", values: col("daily_loss") });
    rows.push({ label: "Max loss", values: col("max_loss") });
    if (r.drawdown_type) rows.push({ label: "Drawdown type", values: same(capitalise(r.drawdown_type)) });
    rows.push({ label: "Profit split", values: same(split(r.profit_split_max)) });
    rows.push({ label: "Min trading days", values: same(days(r.min_trading_days)) });
    rows.push({
      label: "Consistency",
      values: same(show(r.consistency_pct, (n) => `${n}%`)),
    });
    if (accounts.some((a) => a.max_contracts != null)) {
      rows.push({
        label: "Max contracts",
        values: accounts.map((a) => show(a.max_contracts, String)),
      });
    }
    if (accounts.some((a) => a.payout_cap != null)) {
      rows.push({ label: "Payout cap", values: col("payout_cap") });
    }
    rows.push({ label: "Fee refund", values: same(yesNo(r.fee_refund ?? null)) });
  }

  return {
    name: t.tier,
    tagline: t.tagline,
    sizes: accounts.map((a) => compactMoney(a.size, currency)),
    rows,
    prices: accounts.map((a) => {
      const full = a.standard ?? a.promo;
      const hasDiscount = a.promo != null && a.standard != null;
      return {
        full: full == null ? null : money(full, currency) + period,
        discounted: hasDiscount ? money(a.promo!, currency) + period : null,
        discountLabel: hasDiscount ? discountLabel : null,
      };
    }),
    accounts: accounts.map((a) => ({ size: a.size, lowestPrice: a.promo ?? a.standard, monthly })),
    // The filters only compare real values; "n/a" / "none" count as unknown.
    profitSplit: typeof t.rules.profit_split_max === "number" ? t.rules.profit_split_max : null,
    feeRefund: typeof t.rules.fee_refund === "boolean" ? t.rules.fee_refund : null,
  };
}

// Only allow normal web links, so a typo in a data file can't produce a
// harmful link (e.g. "javascript:..."). Empty = no link.
function safeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

// ---- Formatting -------------------------------------------------------------

// What the tables show for the two kinds of "empty" that aren't unknown
// (unknown = null, shown as a dash by the table).
// (PropFirmPricing styles these two by their text.)
const NOT_APPLICABLE = "N/A";
const NO_LIMIT = "None";

/** Format a rule value, turning "n/a" / "none" into their labels. */
function show<T>(v: T | Empty | undefined, format: (v: T) => string): Cell {
  if (v == null) return null;
  if (v === "n/a") return NOT_APPLICABLE;
  if (v === "none") return NO_LIMIT;
  return format(v as T);
}

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function compactMoney(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
  }).format(n);
}

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function split(v: number | Empty): Cell {
  return show(v, (n: number) => `Up to ${n}%`);
}

function days(v: number | Empty): Cell {
  return show(v, (n: number) => (n === 0 ? "No minimum" : String(n)));
}

/** Free-text rules (consistency, trading period). */
function text(v: string | null): Cell {
  const lower = v?.toLowerCase();
  return show(lower === "none" || lower === "n/a" ? (lower as Empty) : v, capitalise);
}

function yesNo(v: boolean | Empty): Cell {
  return show(v, (b: boolean) => (b ? "Yes" : "No"));
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Read once when the module loads (build time for a static page).
export const propFirms: FirmView[] = loadFirms();

export function getPropFirm(id: string): FirmView | undefined {
  return propFirms.find((f) => f.id === id);
}
