import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TrendlineSimulator from "@/components/TrendlineSimulator";
import TrendlineQuiz from "@/components/TrendlineQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "trendline-trading";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function TrendlineTradingPage() {
  return (
    <InteractiveStrategyPage slug={SLUG} simulator={<TrendlineSimulator />} quiz={<TrendlineQuiz />} />
  );
}
