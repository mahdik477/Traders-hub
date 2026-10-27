import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CycleSimulator from "@/components/CycleSimulator";
import CycleQuiz from "@/components/CycleQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "cycle-analysis";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function CycleAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CycleSimulator />} quiz={<CycleQuiz />} />;
}
