import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import AdxSimulator from "@/components/AdxSimulator";
import AdxQuiz from "@/components/AdxQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "adx-dmi-trend-strength";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function AdxDmiTrendStrengthPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<AdxSimulator />} quiz={<AdxQuiz />} />;
}
