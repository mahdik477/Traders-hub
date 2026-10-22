import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import DoublePatternSimulator from "@/components/DoublePatternSimulator";
import DoublePatternQuiz from "@/components/DoublePatternQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "basic-chart-patterns";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function BasicChartPatternsPage() {
  return (
    <InteractiveStrategyPage
      slug={SLUG}
      simulator={<DoublePatternSimulator />}
      simulatorTitle="See a double top/bottom, live"
      quiz={<DoublePatternQuiz />}
    />
  );
}
