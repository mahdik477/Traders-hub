import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import DonchianSimulator from "@/components/DonchianSimulator";
import DonchianQuiz from "@/components/DonchianQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "turtle-trading-donchian";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function TurtleTradingDonchianPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<DonchianSimulator />} quiz={<DonchianQuiz />} />;
}
