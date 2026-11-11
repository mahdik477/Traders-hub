import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import IntermarketSimulator from "@/components/IntermarketSimulator";
import IntermarketQuiz from "@/components/IntermarketQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "intermarket-analysis";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function IntermarketAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<IntermarketSimulator />} quiz={<IntermarketQuiz />} />;
}
