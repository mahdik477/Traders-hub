import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import HarmonicSimulator from "@/components/HarmonicSimulator";
import HarmonicQuiz from "@/components/HarmonicQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "harmonic-patterns";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function HarmonicPatternsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<HarmonicSimulator />} quiz={<HarmonicQuiz />} />;
}
