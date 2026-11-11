import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ParabolicSarSimulator from "@/components/ParabolicSarSimulator";
import ParabolicSarQuiz from "@/components/ParabolicSarQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "parabolic-sar";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function ParabolicSarPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ParabolicSarSimulator />} quiz={<ParabolicSarQuiz />} />;
}
