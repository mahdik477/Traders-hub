import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import BollingerSimulator from "@/components/BollingerSimulator";
import BollingerQuiz from "@/components/BollingerQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "bollinger-band-basics";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function BollingerBandBasicsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<BollingerSimulator />} quiz={<BollingerQuiz />} />;
}
