import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MtfSimulator from "@/components/MtfSimulator";
import MtfQuiz from "@/components/MtfQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "multi-timeframe-analysis";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function MultiTimeframeAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MtfSimulator />} quiz={<MtfQuiz />} />;
}
