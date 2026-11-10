import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import HeadShouldersSimulator from "@/components/HeadShouldersSimulator";
import HeadShouldersQuiz from "@/components/HeadShouldersQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "head-and-shoulders";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function HeadAndShouldersPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<HeadShouldersSimulator />} quiz={<HeadShouldersQuiz />} />;
}
