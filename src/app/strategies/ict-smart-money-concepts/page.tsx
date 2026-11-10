import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FvgSimulator from "@/components/FvgSimulator";
import FvgQuiz from "@/components/FvgQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "ict-smart-money-concepts";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function IctSmartMoneyConceptsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FvgSimulator />} quiz={<FvgQuiz />} />;
}
