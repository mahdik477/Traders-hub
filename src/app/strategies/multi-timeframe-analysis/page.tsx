import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MtfSimulator from "@/components/MtfSimulator";
import MtfQuiz from "@/components/MtfQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "multi-timeframe-analysis";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MultiTimeframeAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MtfSimulator />} quiz={<MtfQuiz />} />;
}
