import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import PivotPointsSimulator from "@/components/PivotPointsSimulator";
import PivotPointsQuiz from "@/components/PivotPointsQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "pivot-points";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function PivotPointsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<PivotPointsSimulator />} quiz={<PivotPointsQuiz />} />;
}
