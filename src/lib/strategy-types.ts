// Types shared by the strategies data loader (server) and the directory/
// detail pages (may render on the client). Keep this file free of Node-only
// imports.
//
// Unlike courses/prop firms/brokers/tools, strategies aren't third-party
// businesses we're comparing — they're our own educational reference
// content, built from a single research pass covering the whole library at
// once. That's why this is one combined data file (strategies-data.json)
// instead of one file per entry: there's no "a new strategy shows up, add a
// file" workflow here, and the 56 entries are tightly ordered and
// cross-referenced (T1 free tier, T2 advanced, T3 intermediate).

import type { JSX } from "react";
import {
  TrendUpIcon,
  RevertIcon,
  BreakoutIcon,
  CandleIcon,
  BoltIcon,
  VolumeBarsIcon,
  WaveStructureIcon,
  GridIcon,
} from "@/components/icons";

export type StrategyPricingTier = "free" | "intermediate" | "advanced";

export const STRATEGY_TIER_LABELS: Record<StrategyPricingTier, string> = {
  free: "Free",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export type StrategyDifficulty = "beginner" | "intermediate" | "advanced";

export const STRATEGY_DIFFICULTY_LABELS: Record<StrategyDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export type StrategyMarket =
  | "forex"
  | "stocks"
  | "crypto"
  | "futures"
  | "commodities"
  | "etfs";

export const STRATEGY_MARKET_LABELS: Record<StrategyMarket, string> = {
  forex: "Forex",
  stocks: "Stocks",
  crypto: "Crypto",
  futures: "Futures/Indices",
  commodities: "Commodities",
  etfs: "ETFs",
};

export type StrategyTimeframe = "scalp" | "intraday" | "swing" | "position";

export const STRATEGY_TIMEFRAME_LABELS: Record<StrategyTimeframe, string> = {
  scalp: "Scalp (≤5m)",
  intraday: "Intraday (5m–1h)",
  swing: "Swing (4h–daily)",
  position: "Position (daily–weekly+)",
};

export type StrategyCategory =
  | "trend_following"
  | "mean_reversion"
  | "breakout"
  | "price_action"
  | "momentum"
  | "volume_order_flow"
  | "market_structure"
  | "quantitative";

export const STRATEGY_CATEGORY_LABELS: Record<StrategyCategory, string> = {
  trend_following: "Trend Following",
  mean_reversion: "Mean Reversion",
  breakout: "Breakout / Volatility",
  price_action: "Price Action / Patterns",
  momentum: "Momentum / Relative Strength",
  volume_order_flow: "Volume / Order Flow",
  market_structure: "Market Structure / Wave Theory",
  quantitative: "Multi-Market / Quantitative",
};

/** One icon per category so a directory card is recognisable at a glance,
 *  not just from small text underneath the name. */
export const STRATEGY_CATEGORY_ICONS: Record<StrategyCategory, (props: { className?: string }) => JSX.Element> = {
  trend_following: TrendUpIcon,
  mean_reversion: RevertIcon,
  breakout: BreakoutIcon,
  price_action: CandleIcon,
  momentum: BoltIcon,
  volume_order_flow: VolumeBarsIcon,
  market_structure: WaveStructureIcon,
  quantitative: GridIcon,
};

export type StrategyExecution = "mechanical" | "semi_mechanical" | "discretionary";

export const STRATEGY_EXECUTION_LABELS: Record<StrategyExecution, string> = {
  mechanical: "Mechanical (rule-based)",
  semi_mechanical: "Semi-mechanical",
  discretionary: "Discretionary",
};

export type StrategyEvidenceRating = "strong" | "mixed" | "weak" | "little";

export const STRATEGY_EVIDENCE_LABELS: Record<StrategyEvidenceRating, string> = {
  strong: "Strong",
  mixed: "Mixed",
  weak: "Weak",
  little: "Little independent evidence",
};

export type StrategyRules =
  | { kind: "structured"; entry: string; exit: string; stop: string }
  | { kind: "prose"; text: string };

export type StrategyImage = {
  /** "synthetic" = a chart-style image we generated ourselves from synthetic
   *  OHLC data to illustrate the setup (never presented as a real historical
   *  trade or real market data). "diagram" = a simpler schematic SVG. */
  kind: "synthetic" | "diagram";
  src: string;
  caption: string;
};

export type StrategySource = {
  label: string;
};

/** One step in a detailed, numbered "how to actually trade this" walkthrough
 *  — more granular than `rules` (which is the short traditional entry/exit/
 *  stop), written to teach a beginner the whole process in order. Optional:
 *  only the 10 Free-tier strategies have this depth so far. */
export type StrategyStep = {
  title: string;
  detail: string;
};

/** A YouTube video we're pointing to as further reading, not hosting or
 *  verifying — the `note` says why it's useful or what to watch for, since
 *  we haven't fact-checked everything said in someone else's video. */
export type StrategyVideo = {
  title: string;
  url: string;
  note: string | null;
};

/** YouTube's own public thumbnail CDN — no API key needed, this is the same
 *  image YouTube itself serves for embeds and link previews. Returns null
 *  for a URL we can't parse a video ID out of, so the card can fall back to
 *  a plain link instead of a broken image. */
export function youtubeThumbnail(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export type StrategyView = {
  /** The research doc's own ID, e.g. "T1-01". Shown for reference only. */
  refId: string;
  /** Also the page address: /strategies/<slug>. */
  slug: string;
  name: string;
  tier: StrategyPricingTier;
  category: StrategyCategory;
  summaryOneLine: string;
  /** Shown on the card and at the top of a locked page — must never promise
   *  results, only describe what the method is. */
  publicTeaser: string;
  coreConcept: string;
  toolsAndDefaults: string;
  rules: StrategyRules;
  typicalTimeframes: StrategyTimeframe[];
  /** Market name -> a short note on how the strategy plays out there. */
  assetClassNotes: Record<string, string>;
  marketConditions: { worksBest: string; struggles: string; failureModes: string };
  commonPitfalls: string[];
  difficulty: StrategyDifficulty;
  executionType: StrategyExecution;
  winRateNote: string;
  evidence: { summary: string; rating: StrategyEvidenceRating };
  platformTestability: string;
  dataRequirement: string;
  markets: StrategyMarket[];
  tags: string[];
  sources: StrategySource[];
  controversyFlag: boolean;
  image: StrategyImage | null;
  /** Numbered "how to actually trade this" walkthrough. Empty for strategies
   *  that haven't had the deeper research pass yet. */
  stepByStep: StrategyStep[];
  /** Curated external videos. Empty for strategies that haven't had the
   *  deeper research pass yet. */
  videos: StrategyVideo[];
};
