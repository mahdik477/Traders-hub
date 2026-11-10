import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import SupportResistanceSimulator from "@/components/SupportResistanceSimulator";
import SupportResistanceQuiz from "@/components/SupportResistanceQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "support-and-resistance";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function SupportResistancePage() {
  return (
    <InteractiveStrategyPage
      slug={SLUG}
      simulator={<SupportResistanceSimulator />}
      quiz={<SupportResistanceQuiz />}
    />
  );
}
