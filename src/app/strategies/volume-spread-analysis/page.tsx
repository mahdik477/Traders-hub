import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import VsaSimulator from "@/components/VsaSimulator";
import VsaQuiz from "@/components/VsaQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "volume-spread-analysis";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function VolumeSpreadAnalysisPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<VsaSimulator />} quiz={<VsaQuiz />} />;
}
