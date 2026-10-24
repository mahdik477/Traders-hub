import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CciSimulator from "@/components/CciSimulator";
import CciQuiz from "@/components/CciQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "cci-strategies";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function CciStrategiesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CciSimulator />} quiz={<CciQuiz />} />;
}
