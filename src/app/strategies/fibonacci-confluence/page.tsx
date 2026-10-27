import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FibConfluenceSimulator from "@/components/FibConfluenceSimulator";
import FibConfluenceQuiz from "@/components/FibConfluenceQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "fibonacci-confluence";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function FibonacciConfluencePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FibConfluenceSimulator />} quiz={<FibConfluenceQuiz />} />;
}
