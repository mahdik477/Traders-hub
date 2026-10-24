import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import AdxSimulator from "@/components/AdxSimulator";
import AdxQuiz from "@/components/AdxQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "adx-dmi-trend-strength";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function AdxDmiTrendStrengthPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<AdxSimulator />} quiz={<AdxQuiz />} />;
}
