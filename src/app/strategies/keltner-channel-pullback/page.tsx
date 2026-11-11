import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import KeltnerSimulator from "@/components/KeltnerSimulator";
import KeltnerQuiz from "@/components/KeltnerQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "keltner-channel-pullback";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function KeltnerChannelPullbackPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<KeltnerSimulator />} quiz={<KeltnerQuiz />} />;
}
