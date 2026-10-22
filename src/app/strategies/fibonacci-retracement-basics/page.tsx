import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FibonacciSimulator from "@/components/FibonacciSimulator";
import FibonacciQuiz from "@/components/FibonacciQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "fibonacci-retracement-basics";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function FibonacciRetracementBasicsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FibonacciSimulator />} quiz={<FibonacciQuiz />} />;
}
