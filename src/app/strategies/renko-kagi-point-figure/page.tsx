import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import RenkoSimulator from "@/components/RenkoSimulator";
import RenkoQuiz from "@/components/RenkoQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "renko-kagi-point-figure";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function RenkoKagiPointFigurePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<RenkoSimulator />} quiz={<RenkoQuiz />} />;
}
