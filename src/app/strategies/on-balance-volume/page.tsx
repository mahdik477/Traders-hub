import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ObvSimulator from "@/components/ObvSimulator";
import ObvQuiz from "@/components/ObvQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "on-balance-volume";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function OnBalanceVolumePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ObvSimulator />} quiz={<ObvQuiz />} />;
}
