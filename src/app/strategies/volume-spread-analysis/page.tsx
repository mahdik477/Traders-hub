import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import VsaSimulator from "@/components/VsaSimulator";
import VsaQuiz from "@/components/VsaQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "volume-spread-analysis";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function VolumeSpreadAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<VsaSimulator />} quiz={<VsaQuiz />} />;
}
