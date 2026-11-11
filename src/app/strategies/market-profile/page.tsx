import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MarketProfileSimulator from "@/components/MarketProfileSimulator";
import MarketProfileQuiz from "@/components/MarketProfileQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "market-profile";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function MarketProfilePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MarketProfileSimulator />} quiz={<MarketProfileQuiz />} />;
}
