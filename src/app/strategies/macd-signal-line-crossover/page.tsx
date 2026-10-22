import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MacdSimulator from "@/components/MacdSimulator";
import MacdQuiz from "@/components/MacdQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "macd-signal-line-crossover";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MacdSignalLineCrossoverPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MacdSimulator />} quiz={<MacdQuiz />} />;
}
