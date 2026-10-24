import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ParabolicSarSimulator from "@/components/ParabolicSarSimulator";
import ParabolicSarQuiz from "@/components/ParabolicSarQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "parabolic-sar";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function ParabolicSarPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ParabolicSarSimulator />} quiz={<ParabolicSarQuiz />} />;
}
