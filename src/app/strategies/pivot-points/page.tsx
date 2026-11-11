import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import PivotPointsSimulator from "@/components/PivotPointsSimulator";
import PivotPointsQuiz from "@/components/PivotPointsQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "pivot-points";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function PivotPointsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<PivotPointsSimulator />} quiz={<PivotPointsQuiz />} />;
}
