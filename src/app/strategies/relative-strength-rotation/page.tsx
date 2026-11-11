import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RelativeStrengthSimulator from "@/components/RelativeStrengthSimulator";
import RelativeStrengthQuiz from "@/components/RelativeStrengthQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "relative-strength-rotation";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function RelativeStrengthRotationPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RelativeStrengthSimulator />} quiz={<RelativeStrengthQuiz />} />;
}
