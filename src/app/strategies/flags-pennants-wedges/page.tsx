import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FlagSimulator from "@/components/FlagSimulator";
import FlagQuiz from "@/components/FlagQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "flags-pennants-wedges";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function FlagsPennantsWedgesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FlagSimulator />} quiz={<FlagQuiz />} />;
}
