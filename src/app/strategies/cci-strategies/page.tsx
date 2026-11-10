import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CciSimulator from "@/components/CciSimulator";
import CciQuiz from "@/components/CciQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "cci-strategies";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function CciStrategiesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CciSimulator />} quiz={<CciQuiz />} />;
}
