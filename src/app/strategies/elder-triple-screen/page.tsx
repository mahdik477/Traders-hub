import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ElderScreenSimulator from "@/components/ElderScreenSimulator";
import ElderScreenQuiz from "@/components/ElderScreenQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "elder-triple-screen";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function ElderTripleScreenPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ElderScreenSimulator />} quiz={<ElderScreenQuiz />} />;
}
