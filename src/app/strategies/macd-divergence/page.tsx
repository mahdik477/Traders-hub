import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MacdDivergenceSimulator from "@/components/MacdDivergenceSimulator";
import MacdDivergenceQuiz from "@/components/MacdDivergenceQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "macd-divergence";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MacdDivergencePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MacdDivergenceSimulator />} quiz={<MacdDivergenceQuiz />} />;
}
