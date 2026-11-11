import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import FlagSimulator from "@/components/FlagSimulator";
import FlagQuiz from "@/components/FlagQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "flags-pennants-wedges";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function FlagsPennantsWedgesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<FlagSimulator />} quiz={<FlagQuiz />} />;
}
