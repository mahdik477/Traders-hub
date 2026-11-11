import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FibonacciSimulator from "@/components/FibonacciSimulator";
import FibonacciQuiz from "@/components/FibonacciQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "fibonacci-retracement-basics";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function FibonacciRetracementBasicsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FibonacciSimulator />} quiz={<FibonacciQuiz />} />;
}
