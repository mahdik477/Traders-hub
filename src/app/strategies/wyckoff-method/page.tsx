import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import WyckoffSimulator from "@/components/WyckoffSimulator";
import WyckoffQuiz from "@/components/WyckoffQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "wyckoff-method";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function WyckoffMethodPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<WyckoffSimulator />} quiz={<WyckoffQuiz />} />;
}
