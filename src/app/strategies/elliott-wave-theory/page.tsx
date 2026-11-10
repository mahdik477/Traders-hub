import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ElliottWaveSimulator from "@/components/ElliottWaveSimulator";
import ElliottWaveQuiz from "@/components/ElliottWaveQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "elliott-wave-theory";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function ElliottWaveTheoryPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ElliottWaveSimulator />} quiz={<ElliottWaveQuiz />} />;
}
