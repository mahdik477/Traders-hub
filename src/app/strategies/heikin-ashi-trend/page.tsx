import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import HeikinAshiSimulator from "@/components/HeikinAshiSimulator";
import HeikinAshiQuiz from "@/components/HeikinAshiQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "heikin-ashi-trend";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function HeikinAshiTrendPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<HeikinAshiSimulator />} quiz={<HeikinAshiQuiz />} />;
}
