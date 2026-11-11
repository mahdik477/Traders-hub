import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import DonchianSimulator from "@/components/DonchianSimulator";
import DonchianQuiz from "@/components/DonchianQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "turtle-trading-donchian";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function TurtleTradingDonchianPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<DonchianSimulator />} quiz={<DonchianQuiz />} />;
}
