import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RocSimulator from "@/components/RocSimulator";
import RocQuiz from "@/components/RocQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "momentum-rate-of-change";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function MomentumRocPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RocSimulator />} quiz={<RocQuiz />} />;
}
