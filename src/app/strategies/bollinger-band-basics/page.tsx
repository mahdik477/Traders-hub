import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import BollingerSimulator from "@/components/BollingerSimulator";
import BollingerQuiz from "@/components/BollingerQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "bollinger-band-basics";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function BollingerBandBasicsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<BollingerSimulator />} quiz={<BollingerQuiz />} />;
}
