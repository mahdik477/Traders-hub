import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TrendlineSimulator from "@/components/TrendlineSimulator";
import TrendlineQuiz from "@/components/TrendlineQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "trendline-trading";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function TrendlineTradingPage() {
  return (
    <InteractiveStrategyPage slug={SLUG} simulator={<TrendlineSimulator />} quiz={<TrendlineQuiz />} />
  );
}
