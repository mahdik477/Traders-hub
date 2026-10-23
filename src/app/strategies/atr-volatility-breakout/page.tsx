import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import AtrBreakoutSimulator from "@/components/AtrBreakoutSimulator";
import AtrBreakoutQuiz from "@/components/AtrBreakoutQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "atr-volatility-breakout";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function AtrVolatilityBreakoutPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<AtrBreakoutSimulator />} quiz={<AtrBreakoutQuiz />} />;
}
