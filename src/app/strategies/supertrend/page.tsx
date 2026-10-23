import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import SupertrendSimulator from "@/components/SupertrendSimulator";
import SupertrendQuiz from "@/components/SupertrendQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "supertrend";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function SupertrendPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<SupertrendSimulator />} quiz={<SupertrendQuiz />} />;
}
