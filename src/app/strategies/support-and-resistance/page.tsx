import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import SupportResistanceSimulator from "@/components/SupportResistanceSimulator";
import SupportResistanceQuiz from "@/components/SupportResistanceQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "support-and-resistance";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function SupportResistancePage() {
  return (
    <InteractiveStrategyPage
      slug={SLUG}
      simulator={<SupportResistanceSimulator />}
      quiz={<SupportResistanceQuiz />}
    />
  );
}
