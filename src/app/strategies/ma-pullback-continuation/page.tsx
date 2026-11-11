import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MaPullbackSimulator from "@/components/MaPullbackSimulator";
import MaPullbackQuiz from "@/components/MaPullbackQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "ma-pullback-continuation";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function MaPullbackContinuationPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MaPullbackSimulator />} quiz={<MaPullbackQuiz />} />;
}
