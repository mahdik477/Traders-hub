import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ConnorsRsi2Simulator from "@/components/ConnorsRsi2Simulator";
import ConnorsRsi2Quiz from "@/components/ConnorsRsi2Quiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "connors-rsi-2";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function ConnorsRsi2Page() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ConnorsRsi2Simulator />} quiz={<ConnorsRsi2Quiz />} />;
}
