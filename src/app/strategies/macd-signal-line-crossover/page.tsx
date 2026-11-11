import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MacdSimulator from "@/components/MacdSimulator";
import MacdQuiz from "@/components/MacdQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "macd-signal-line-crossover";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function MacdSignalLineCrossoverPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MacdSimulator />} quiz={<MacdQuiz />} />;
}
