import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ElliottWaveSimulator from "@/components/ElliottWaveSimulator";
import ElliottWaveQuiz from "@/components/ElliottWaveQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "elliott-wave-theory";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function ElliottWaveTheoryPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ElliottWaveSimulator />} quiz={<ElliottWaveQuiz />} />;
}
