import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MovingAverageSimulator from "@/components/MovingAverageSimulator";
import MovingAverageSignalQuiz from "@/components/MovingAverageSignalQuiz";
import { getStrategy } from "@/lib/strategies";

// A one-off page for this single strategy — not the shared [slug] template.
// Next.js resolves this literal route ahead of the dynamic one for this
// exact path. All the shared layout lives in InteractiveStrategyPage; this
// file only supplies the two widgets that are actually specific to this
// strategy. See MovingAverageSimulator.tsx for why a live simulator exists
// at all.

const SLUG = "moving-average-crossover";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MovingAverageCrossoverPage() {
  return (
    <InteractiveStrategyPage
      slug={SLUG}
      simulator={<MovingAverageSimulator />}
      quiz={<MovingAverageSignalQuiz />}
    />
  );
}
