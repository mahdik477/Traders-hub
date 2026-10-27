import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FvgSimulator from "@/components/FvgSimulator";
import FvgQuiz from "@/components/FvgQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "ict-smart-money-concepts";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function IctSmartMoneyConceptsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FvgSimulator />} quiz={<FvgQuiz />} />;
}
