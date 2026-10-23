import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import WilliamsRSimulator from "@/components/WilliamsRSimulator";
import WilliamsRQuiz from "@/components/WilliamsRQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "williams-percent-r";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function WilliamsPercentRPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<WilliamsRSimulator />} quiz={<WilliamsRQuiz />} />;
}
