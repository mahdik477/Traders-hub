import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import KeltnerSimulator from "@/components/KeltnerSimulator";
import KeltnerQuiz from "@/components/KeltnerQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "keltner-channel-pullback";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function KeltnerChannelPullbackPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<KeltnerSimulator />} quiz={<KeltnerQuiz />} />;
}
