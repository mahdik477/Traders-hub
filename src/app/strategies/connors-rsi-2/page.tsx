import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import ConnorsRsi2Simulator from "@/components/ConnorsRsi2Simulator";
import ConnorsRsi2Quiz from "@/components/ConnorsRsi2Quiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "connors-rsi-2";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function ConnorsRsi2Page() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<ConnorsRsi2Simulator />} quiz={<ConnorsRsi2Quiz />} />;
}
