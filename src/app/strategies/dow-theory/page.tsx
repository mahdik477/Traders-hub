import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import DowTheorySimulator from "@/components/DowTheorySimulator";
import DowTheoryQuiz from "@/components/DowTheoryQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "dow-theory";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function DowTheoryPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<DowTheorySimulator />} quiz={<DowTheoryQuiz />} />;
}
