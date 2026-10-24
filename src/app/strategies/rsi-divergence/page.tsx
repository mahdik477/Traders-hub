import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RsiDivergenceSimulator from "@/components/RsiDivergenceSimulator";
import RsiDivergenceQuiz from "@/components/RsiDivergenceQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "rsi-divergence";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function RsiDivergencePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RsiDivergenceSimulator />} quiz={<RsiDivergenceQuiz />} />;
}
