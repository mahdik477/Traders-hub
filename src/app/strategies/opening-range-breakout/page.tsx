import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import OpeningRangeSimulator from "@/components/OpeningRangeSimulator";
import OpeningRangeQuiz from "@/components/OpeningRangeQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "opening-range-breakout";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function OpeningRangeBreakoutPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<OpeningRangeSimulator />} quiz={<OpeningRangeQuiz />} />;
}
