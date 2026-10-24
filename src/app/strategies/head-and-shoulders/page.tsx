import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import HeadShouldersSimulator from "@/components/HeadShouldersSimulator";
import HeadShouldersQuiz from "@/components/HeadShouldersQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "head-and-shoulders";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function HeadAndShouldersPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<HeadShouldersSimulator />} quiz={<HeadShouldersQuiz />} />;
}
