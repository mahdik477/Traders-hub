import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import BreakoutSimulator from "@/components/BreakoutSimulator";
import BreakoutQuiz from "@/components/BreakoutQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "range-breakout";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function RangeBreakoutPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<BreakoutSimulator />} quiz={<BreakoutQuiz />} />;
}
