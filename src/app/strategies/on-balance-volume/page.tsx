import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ObvSimulator from "@/components/ObvSimulator";
import ObvQuiz from "@/components/ObvQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "on-balance-volume";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function OnBalanceVolumePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ObvSimulator />} quiz={<ObvQuiz />} />;
}
