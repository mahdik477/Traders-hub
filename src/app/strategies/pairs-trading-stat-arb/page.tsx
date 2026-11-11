import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import PairsTradingSimulator from "@/components/PairsTradingSimulator";
import PairsTradingQuiz from "@/components/PairsTradingQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "pairs-trading-stat-arb";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function PairsTradingStatArbPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<PairsTradingSimulator />} quiz={<PairsTradingQuiz />} />;
}
