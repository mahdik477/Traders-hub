import { readFileSync } from "fs";
import path from "path";
import type {
  StrategyCategory,
  StrategyDifficulty,
  StrategyEvidenceRating,
  StrategyExecution,
  StrategyImage,
  StrategyMarket,
  StrategyPricingTier,
  StrategyRules,
  StrategySource,
  StrategyStep,
  StrategyTimeframe,
  StrategyVideo,
  StrategyView,
} from "./strategy-types";

type RawStrategy = {
  ref_id: string;
  slug: string;
  name: string;
  tier: StrategyPricingTier;
  category: StrategyCategory;
  summary_one_line: string;
  public_teaser: string;
  core_concept: string;
  tools_and_defaults: string;
  rules:
    | { entry: string; exit: string; stop: string }
    | string;
  typical_timeframes: StrategyTimeframe[];
  asset_class_notes?: Record<string, string>;
  market_conditions: { works_best: string; struggles: string; failure_modes: string };
  common_pitfalls?: string[];
  difficulty: StrategyDifficulty;
  execution_type: StrategyExecution;
  win_rate_note: string;
  evidence: { summary: string; rating: StrategyEvidenceRating };
  platform_testability: string;
  data_requirement: string;
  markets: StrategyMarket[];
  tags?: string[];
  sources?: string[];
  controversy_flag?: boolean;
  image?: { kind: "synthetic" | "diagram"; src: string; caption: string } | null;
  step_by_step?: { title: string; detail: string }[];
  videos?: { title: string; url: string; note?: string | null }[];
};

function buildRules(r: RawStrategy["rules"]): StrategyRules {
  if (typeof r === "string") return { kind: "prose", text: r };
  return { kind: "structured", entry: r.entry, exit: r.exit, stop: r.stop };
}

function buildSources(sources?: string[]): StrategySource[] {
  return (sources ?? []).map((label) => ({ label }));
}

function buildImage(image: RawStrategy["image"]): StrategyImage | null {
  if (!image) return null;
  return { kind: image.kind, src: image.src, caption: image.caption };
}

function buildSteps(steps?: RawStrategy["step_by_step"]): StrategyStep[] {
  return (steps ?? []).map((s) => ({ title: s.title, detail: s.detail }));
}

function buildVideos(videos?: RawStrategy["videos"]): StrategyVideo[] {
  return (videos ?? []).map((v) => ({ title: v.title, url: v.url, note: v.note ?? null }));
}

function buildStrategy(r: RawStrategy): StrategyView {
  return {
    refId: r.ref_id,
    slug: r.slug,
    name: r.name,
    tier: r.tier,
    category: r.category,
    summaryOneLine: r.summary_one_line,
    publicTeaser: r.public_teaser,
    coreConcept: r.core_concept,
    toolsAndDefaults: r.tools_and_defaults,
    rules: buildRules(r.rules),
    typicalTimeframes: r.typical_timeframes ?? [],
    assetClassNotes: r.asset_class_notes ?? {},
    marketConditions: {
      worksBest: r.market_conditions.works_best,
      struggles: r.market_conditions.struggles,
      failureModes: r.market_conditions.failure_modes,
    },
    commonPitfalls: r.common_pitfalls ?? [],
    difficulty: r.difficulty,
    executionType: r.execution_type,
    winRateNote: r.win_rate_note,
    evidence: r.evidence,
    platformTestability: r.platform_testability,
    dataRequirement: r.data_requirement,
    markets: r.markets ?? [],
    tags: r.tags ?? [],
    sources: buildSources(r.sources),
    controversyFlag: r.controversy_flag ?? false,
    image: buildImage(r.image ?? null),
    stepByStep: buildSteps(r.step_by_step),
    videos: buildVideos(r.videos),
  };
}

function loadRaw(): RawStrategy[] {
  const file = path.join(process.cwd(), "strategies-data.json");
  const data = JSON.parse(readFileSync(file, "utf-8"));
  return data.strategies as RawStrategy[];
}

export const strategies: StrategyView[] = loadRaw().map(buildStrategy);

export function getStrategy(slug: string): StrategyView | null {
  return strategies.find((s) => s.slug === slug) ?? null;
}

// Order strategies are listed in across the site: free tier first (the
// doc's own T1-01..10 order), then intermediate (T3), then advanced (T2) —
// matches how the directory groups them by tier.
const TIER_ORDER: Record<StrategyPricingTier, number> = { free: 0, intermediate: 1, advanced: 2 };
export const strategiesInDisplayOrder: StrategyView[] = [...strategies].sort(
  (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.refId.localeCompare(b.refId),
);
