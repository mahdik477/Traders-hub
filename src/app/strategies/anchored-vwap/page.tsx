import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import AnchoredVwapSimulator from "@/components/AnchoredVwapSimulator";
import AnchoredVwapQuiz from "@/components/AnchoredVwapQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "anchored-vwap";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function AnchoredVwapPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<AnchoredVwapSimulator />} quiz={<AnchoredVwapQuiz />} />;
}
