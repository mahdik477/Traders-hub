import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CycleSimulator from "@/components/CycleSimulator";
import CycleQuiz from "@/components/CycleQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "cycle-analysis";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function CycleAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CycleSimulator />} quiz={<CycleQuiz />} />;
}
