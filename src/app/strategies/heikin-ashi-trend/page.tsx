import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import HeikinAshiSimulator from "@/components/HeikinAshiSimulator";
import HeikinAshiQuiz from "@/components/HeikinAshiQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "heikin-ashi-trend";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function HeikinAshiTrendPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<HeikinAshiSimulator />} quiz={<HeikinAshiQuiz />} />;
}
