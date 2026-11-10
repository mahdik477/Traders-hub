import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CandlestickSimulator from "@/components/CandlestickSimulator";
import CandlestickQuiz from "@/components/CandlestickQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "candlestick-reversal-basics";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function CandlestickReversalBasicsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CandlestickSimulator />} quiz={<CandlestickQuiz />} />;
}
