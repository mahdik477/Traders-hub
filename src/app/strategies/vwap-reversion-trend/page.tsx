import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import VwapSimulator from "@/components/VwapSimulator";
import VwapQuiz from "@/components/VwapQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "vwap-reversion-trend";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function VwapReversionTrendPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<VwapSimulator />} quiz={<VwapQuiz />} />;
}
