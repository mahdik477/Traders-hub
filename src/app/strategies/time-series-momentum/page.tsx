import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TimeSeriesMomentumSimulator from "@/components/TimeSeriesMomentumSimulator";
import TimeSeriesMomentumQuiz from "@/components/TimeSeriesMomentumQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "time-series-momentum";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function TimeSeriesMomentumPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<TimeSeriesMomentumSimulator />} quiz={<TimeSeriesMomentumQuiz />} />;
}
