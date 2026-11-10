import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RsiDivergenceSimulator from "@/components/RsiDivergenceSimulator";
import RsiDivergenceQuiz from "@/components/RsiDivergenceQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "rsi-divergence";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function RsiDivergencePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RsiDivergenceSimulator />} quiz={<RsiDivergenceQuiz />} />;
}
