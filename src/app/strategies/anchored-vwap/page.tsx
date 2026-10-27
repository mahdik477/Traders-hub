import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import AnchoredVwapSimulator from "@/components/AnchoredVwapSimulator";
import AnchoredVwapQuiz from "@/components/AnchoredVwapQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "anchored-vwap";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function AnchoredVwapPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<AnchoredVwapSimulator />} quiz={<AnchoredVwapQuiz />} />;
}
