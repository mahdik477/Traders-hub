import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RenkoSimulator from "@/components/RenkoSimulator";
import RenkoQuiz from "@/components/RenkoQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "renko-kagi-point-figure";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function RenkoKagiPointFigurePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RenkoSimulator />} quiz={<RenkoQuiz />} />;
}
