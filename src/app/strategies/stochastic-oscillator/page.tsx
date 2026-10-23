import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import StochasticSimulator from "@/components/StochasticSimulator";
import StochasticQuiz from "@/components/StochasticQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "stochastic-oscillator";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function StochasticOscillatorPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<StochasticSimulator />} quiz={<StochasticQuiz />} />;
}
