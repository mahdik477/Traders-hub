import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RsiSimulator from "@/components/RsiSimulator";
import RsiQuiz from "@/components/RsiQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "rsi-overbought-oversold";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function RsiOverboughtOversoldPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RsiSimulator />} quiz={<RsiQuiz />} />;
}
