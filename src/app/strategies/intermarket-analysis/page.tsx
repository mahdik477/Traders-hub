import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import IntermarketSimulator from "@/components/IntermarketSimulator";
import IntermarketQuiz from "@/components/IntermarketQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "intermarket-analysis";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function IntermarketAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<IntermarketSimulator />} quiz={<IntermarketQuiz />} />;
}
