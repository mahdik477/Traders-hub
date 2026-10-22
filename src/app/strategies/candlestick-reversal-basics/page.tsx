import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CandlestickSimulator from "@/components/CandlestickSimulator";
import CandlestickQuiz from "@/components/CandlestickQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "candlestick-reversal-basics";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function CandlestickReversalBasicsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CandlestickSimulator />} quiz={<CandlestickQuiz />} />;
}
