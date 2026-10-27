import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import MarketProfileSimulator from "@/components/MarketProfileSimulator";
import MarketProfileQuiz from "@/components/MarketProfileQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "market-profile";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MarketProfilePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<MarketProfileSimulator />} quiz={<MarketProfileQuiz />} />;
}
