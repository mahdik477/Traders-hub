import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import IchimokuSimulator from "@/components/IchimokuSimulator";
import IchimokuQuiz from "@/components/IchimokuQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "ichimoku-advanced";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function IchimokuAdvancedPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<IchimokuSimulator />} quiz={<IchimokuQuiz />} />;
}
