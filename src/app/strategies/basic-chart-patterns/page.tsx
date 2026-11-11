import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import DoublePatternSimulator from "@/components/DoublePatternSimulator";
import DoublePatternQuiz from "@/components/DoublePatternQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "basic-chart-patterns";

export const metadata: Metadata = strategyMetadata(SLUG);

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
