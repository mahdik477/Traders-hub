import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TtmSqueezeSimulator from "@/components/TtmSqueezeSimulator";
import TtmSqueezeQuiz from "@/components/TtmSqueezeQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "ttm-squeeze";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function TtmSqueezePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<TtmSqueezeSimulator />} quiz={<TtmSqueezeQuiz />} />;
}
