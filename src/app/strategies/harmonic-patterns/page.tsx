import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import HarmonicSimulator from "@/components/HarmonicSimulator";
import HarmonicQuiz from "@/components/HarmonicQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "harmonic-patterns";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function HarmonicPatternsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<HarmonicSimulator />} quiz={<HarmonicQuiz />} />;
}
