import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import OpeningRangeSimulator from "@/components/OpeningRangeSimulator";
import OpeningRangeQuiz from "@/components/OpeningRangeQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "opening-range-breakout";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function OpeningRangeBreakoutPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<OpeningRangeSimulator />} quiz={<OpeningRangeQuiz />} />;
}
