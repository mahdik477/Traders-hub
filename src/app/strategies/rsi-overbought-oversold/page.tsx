import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RsiSimulator from "@/components/RsiSimulator";
import RsiQuiz from "@/components/RsiQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "rsi-overbought-oversold";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function RsiOverboughtOversoldPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RsiSimulator />} quiz={<RsiQuiz />} />;
}
