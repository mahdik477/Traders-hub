import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ElderScreenSimulator from "@/components/ElderScreenSimulator";
import ElderScreenQuiz from "@/components/ElderScreenQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "elder-triple-screen";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function ElderTripleScreenPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ElderScreenSimulator />} quiz={<ElderScreenQuiz />} />;
}
