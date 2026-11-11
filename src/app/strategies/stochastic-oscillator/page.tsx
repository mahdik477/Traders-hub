import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import StochasticSimulator from "@/components/StochasticSimulator";
import StochasticQuiz from "@/components/StochasticQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "stochastic-oscillator";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function StochasticOscillatorPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<StochasticSimulator />} quiz={<StochasticQuiz />} />;
}
