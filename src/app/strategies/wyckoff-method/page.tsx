import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import WyckoffSimulator from "@/components/WyckoffSimulator";
import WyckoffQuiz from "@/components/WyckoffQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "wyckoff-method";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function WyckoffMethodPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<WyckoffSimulator />} quiz={<WyckoffQuiz />} />;
}
