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
  TierView,
} from "./propfirm-types";

// ---- Shape of the JSON files ------------------------------------------------

type RawForexRules = {
  unit: "percent";
  phase1_target: number | null;
  phase2_target: number | null;
  /** Only for 3-step evaluations. */
  phase3_target?: number | null;
  funded_target: number | null;
  /** "none" = the firm has no daily loss limit (shown as "None"). */
  daily_loss: number | "none" | null;
  max_loss: number | null;
  drawdown_type?: string | null;
  profit_split_max: number | null;
  min_trading_days: number | null;
  consistency: string | null;
  trading_period: string | null;
  fee_refund: boolean | null;
};

type RawFuturesRules = {
  unit: "usd";
  drawdown_type?: string | null;
  consistency_pct: number | null;
  min_trading_days: number | null;
  profit_split_max: number | null;
  fee_refund?: boolean | null;
};

type RawAccount = {
  size: number;
  promo: number | null;
  standard: number | null;
  // Futures only: rules are fixed USD amounts per account size.
  profit_target?: number | null;
  daily_loss?: number | "none" | null;
  max_loss?: number | null;
  max_contracts?: number | null;
  payout_cap?: number | null;
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

type RawFile = {
  firm: {
    id: string;
    name: string;
    name_note?: string | null;
    about?: string | null;
    about_note?: string | null;
    currency: string;
    affiliate_link?: string | null;
    platforms: string[] | null;
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
    nameNote: firm.name_note || null,
    about: firm.about || null,
    aboutNote: firm.about_note || null,
    currency: firm.currency,
    affiliateLink: safeLink(firm.affiliate_link),
    platforms: firm.platforms,
    markets,
  };
}

// Forex: the challenge type is the program (1-Step / 2-Step / Instant) and the
// tiers sit underneath it.
function forexChallenge(p: RawProgram, currency: string, discountLabel: string): ChallengeView {
  return {
    key: p.program,
    label: PROGRAM_LABELS[p.program] ?? p.program,
    tagline: null,
    tiers: p.tiers.map((t) => buildTier(t, p.program, currency, discountLabel)),
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
        tiers: p.tiers.map((t) => buildTier(t, p.program, currency, discountLabel)),
      },
    ];
  }
  return p.tiers.map((t) => ({
    key: `${p.program}-${t.tier}`,
    label: t.tier,
    tagline: t.tagline,
    tiers: [buildTier(t, p.program, currency, discountLabel)],
  }));
}

function buildTier(
  t: RawTier,
  program: string,
  currency: string,
  discountLabel: string,
): TierView {
  const accounts = [...t.accounts].sort((a, b) => a.size - b.size);
  const n = accounts.length;
  const same = (v: Cell): Cell[] => Array(n).fill(v);
  const isInstant = program === "instant";
  const monthly = t.billing === "monthly";
  const period = monthly ? "/month" : "";
  const rows: TierView["rows"] = [];

  if (t.rules.unit === "percent") {
    // Forex: rules are a % of account size, the same for every size.
    const r = t.rules;
    const pct = (v: number | null) => (v == null ? null : `${v}%`);
    const noTarget = isInstant && r.phase1_target == null && r.phase2_target == null;

    if (r.phase2_target != null) {
      rows.push({ label: "Profit target (Phase 1)", values: same(pct(r.phase1_target)) });
      rows.push({ label: "Profit target (Phase 2)", values: same(pct(r.phase2_target)) });
      if (r.phase3_target != null) {
        rows.push({ label: "Profit target (Phase 3)", values: same(pct(r.phase3_target)) });
      }
    } else {
      rows.push({
        label: "Profit target",
        values: same(noTarget ? "None" : pct(r.phase1_target)),
      });
    }
    if (r.funded_target != null) {
      rows.push({ label: "Profit target (Funded)", values: same(pct(r.funded_target)) });
    }
    rows.push({
      label: "Daily loss",
      values: same(r.daily_loss === "none" ? NO_LIMIT : pct(r.daily_loss)),
    });
    rows.push({ label: "Max loss", values: same(pct(r.max_loss)) });
    if (r.drawdown_type) rows.push({ label: "Drawdown type", values: same(capitalise(r.drawdown_type)) });
    rows.push({ label: "Profit split", values: same(split(r.profit_split_max)) });
    rows.push({ label: "Min trading days", values: same(days(r.min_trading_days)) });
    rows.push({ label: "Consistency", values: same(consistency(r.consistency)) });
    if (r.trading_period) {
      rows.push({ label: "Trading period", values: same(capitalise(r.trading_period)) });
    }
    rows.push({ label: "Fee refund", values: same(yesNo(r.fee_refund)) });
  } else {
    // Futures: rules are fixed USD amounts that change with account size.
    const r = t.rules;
    const col = (key: keyof RawAccount) =>
      accounts.map((a) =>
        a[key] == null ? null : a[key] === "none" ? NO_LIMIT : usd(a[key] as number),
      );

    rows.push({
      label: "Profit target",
      values: isInstant && accounts.every((a) => a.profit_target == null)
        ? same("None")
        : col("profit_target"),
    });
    rows.push({ label: "Daily loss", values: col("daily_loss") });
    rows.push({ label: "Max loss", values: col("max_loss") });
    if (r.drawdown_type) rows.push({ label: "Drawdown type", values: same(capitalise(r.drawdown_type)) });
    rows.push({ label: "Profit split", values: same(split(r.profit_split_max)) });
    rows.push({ label: "Min trading days", values: same(days(r.min_trading_days)) });
    rows.push({
      label: "Consistency",
      values: same(r.consistency_pct == null ? null : `${r.consistency_pct}%`),
    });
    if (accounts.some((a) => a.max_contracts != null)) {
      rows.push({
        label: "Max contracts",
        values: accounts.map((a) => (a.max_contracts == null ? null : String(a.max_contracts))),
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
    profitSplit: t.rules.profit_split_max,
    feeRefund: t.rules.fee_refund ?? null,
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

// Shown where a data file says a limit is "none" (as opposed to null = not stated).
const NO_LIMIT = "None";

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

function split(v: number | null): Cell {
  return v == null ? null : `Up to ${v}%`;
}

function days(v: number | null): Cell {
  if (v == null) return null;
  return v === 0 ? "No minimum" : String(v);
}

function consistency(v: string | null): Cell {
  if (v == null) return null;
  return v.toLowerCase() === "none" ? "None" : v;
}

function yesNo(v: boolean | null): Cell {
  return v == null ? null : v ? "Yes" : "No";
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Read once when the module loads (build time for a static page).
export const propFirms: FirmView[] = loadFirms();

export function getPropFirm(id: string): FirmView | undefined {
  return propFirms.find((f) => f.id === id);
}
