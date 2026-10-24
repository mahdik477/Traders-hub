import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RelativeStrengthSimulator from "@/components/RelativeStrengthSimulator";
import RelativeStrengthQuiz from "@/components/RelativeStrengthQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "relative-strength-rotation";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function RelativeStrengthRotationPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RelativeStrengthSimulator />} quiz={<RelativeStrengthQuiz />} />;
}
