import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TradingStylesSimulator from "@/components/TradingStylesSimulator";
import TradingStylesQuiz from "@/components/TradingStylesQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "trading-styles-scalp-day-swing-position";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function TradingStylesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<TradingStylesSimulator />} quiz={<TradingStylesQuiz />} />;
}
