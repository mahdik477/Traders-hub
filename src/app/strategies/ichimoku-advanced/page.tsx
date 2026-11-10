import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import IchimokuSimulator from "@/components/IchimokuSimulator";
import IchimokuQuiz from "@/components/IchimokuQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "ichimoku-advanced";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function IchimokuAdvancedPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<IchimokuSimulator />} quiz={<IchimokuQuiz />} />;
}
