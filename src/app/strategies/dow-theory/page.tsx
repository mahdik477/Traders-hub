import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import DowTheorySimulator from "@/components/DowTheorySimulator";
import DowTheoryQuiz from "@/components/DowTheoryQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "dow-theory";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function DowTheoryPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<DowTheorySimulator />} quiz={<DowTheoryQuiz />} />;
}
