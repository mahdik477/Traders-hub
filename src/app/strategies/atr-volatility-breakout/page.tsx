import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import AtrBreakoutSimulator from "@/components/AtrBreakoutSimulator";
import AtrBreakoutQuiz from "@/components/AtrBreakoutQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "atr-volatility-breakout";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function AtrVolatilityBreakoutPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<AtrBreakoutSimulator />} quiz={<AtrBreakoutQuiz />} />;
}
