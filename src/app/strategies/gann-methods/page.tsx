import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import GannSimulator from "@/components/GannSimulator";
import GannQuiz from "@/components/GannQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "gann-methods";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function GannMethodsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<GannSimulator />} quiz={<GannQuiz />} />;
}
