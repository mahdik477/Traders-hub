import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MacdDivergenceSimulator from "@/components/MacdDivergenceSimulator";
import MacdDivergenceQuiz from "@/components/MacdDivergenceQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "macd-divergence";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function MacdDivergencePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MacdDivergenceSimulator />} quiz={<MacdDivergenceQuiz />} />;
}
