import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import VolumeProfileSimulator from "@/components/VolumeProfileSimulator";
import VolumeProfileQuiz from "@/components/VolumeProfileQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "volume-profile";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function VolumeProfilePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<VolumeProfileSimulator />} quiz={<VolumeProfileQuiz />} />;
}
