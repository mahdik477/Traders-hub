import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import BreakoutSimulator from "@/components/BreakoutSimulator";
import BreakoutQuiz from "@/components/BreakoutQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "range-breakout";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function RangeBreakoutPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<BreakoutSimulator />} quiz={<BreakoutQuiz />} />;
}
