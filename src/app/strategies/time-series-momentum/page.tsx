import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TimeSeriesMomentumSimulator from "@/components/TimeSeriesMomentumSimulator";
import TimeSeriesMomentumQuiz from "@/components/TimeSeriesMomentumQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "time-series-momentum";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function TimeSeriesMomentumPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<TimeSeriesMomentumSimulator />} quiz={<TimeSeriesMomentumQuiz />} />;
}
