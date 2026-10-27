import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import GannSimulator from "@/components/GannSimulator";
import GannQuiz from "@/components/GannQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "gann-methods";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function GannMethodsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<GannSimulator />} quiz={<GannQuiz />} />;
}
