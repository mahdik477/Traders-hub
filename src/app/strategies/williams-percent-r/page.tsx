import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import WilliamsRSimulator from "@/components/WilliamsRSimulator";
import WilliamsRQuiz from "@/components/WilliamsRQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "williams-percent-r";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function WilliamsPercentRPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<WilliamsRSimulator />} quiz={<WilliamsRQuiz />} />;
}
