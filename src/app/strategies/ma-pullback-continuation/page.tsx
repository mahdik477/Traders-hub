import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MaPullbackSimulator from "@/components/MaPullbackSimulator";
import MaPullbackQuiz from "@/components/MaPullbackQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "ma-pullback-continuation";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MaPullbackContinuationPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MaPullbackSimulator />} quiz={<MaPullbackQuiz />} />;
}
