import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import GapFillSimulator from "@/components/GapFillSimulator";
import GapFillQuiz from "@/components/GapFillQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "gap-fill-gap-and-go";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function GapFillGapAndGoPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<GapFillSimulator />} quiz={<GapFillQuiz />} />;
}
