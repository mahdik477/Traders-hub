import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import VwapSimulator from "@/components/VwapSimulator";
import VwapQuiz from "@/components/VwapQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "vwap-reversion-trend";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function VwapReversionTrendPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<VwapSimulator />} quiz={<VwapQuiz />} />;
}
