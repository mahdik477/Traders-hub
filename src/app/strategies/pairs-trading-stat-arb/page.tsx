import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import PairsTradingSimulator from "@/components/PairsTradingSimulator";
import PairsTradingQuiz from "@/components/PairsTradingQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "pairs-trading-stat-arb";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function PairsTradingStatArbPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<PairsTradingSimulator />} quiz={<PairsTradingQuiz />} />;
}
