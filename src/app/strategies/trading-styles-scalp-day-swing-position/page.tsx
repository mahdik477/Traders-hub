import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TradingStylesSimulator from "@/components/TradingStylesSimulator";
import TradingStylesQuiz from "@/components/TradingStylesQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "trading-styles-scalp-day-swing-position";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function TradingStylesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<TradingStylesSimulator />} quiz={<TradingStylesQuiz />} />;
}
