import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import SupertrendSimulator from "@/components/SupertrendSimulator";
import SupertrendQuiz from "@/components/SupertrendQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "supertrend";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function SupertrendPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<SupertrendSimulator />} quiz={<SupertrendQuiz />} />;
}
