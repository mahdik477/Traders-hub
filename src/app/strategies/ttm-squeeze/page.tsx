import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import TtmSqueezeSimulator from "@/components/TtmSqueezeSimulator";
import TtmSqueezeQuiz from "@/components/TtmSqueezeQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "ttm-squeeze";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function TtmSqueezePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<TtmSqueezeSimulator />} quiz={<TtmSqueezeQuiz />} />;
}
