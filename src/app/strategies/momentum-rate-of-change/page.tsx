import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RocSimulator from "@/components/RocSimulator";
import RocQuiz from "@/components/RocQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "momentum-rate-of-change";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function MomentumRocPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RocSimulator />} quiz={<RocQuiz />} />;
}
