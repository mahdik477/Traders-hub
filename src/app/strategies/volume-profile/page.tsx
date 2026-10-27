import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import VolumeProfileSimulator from "@/components/VolumeProfileSimulator";
import VolumeProfileQuiz from "@/components/VolumeProfileQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "volume-profile";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function VolumeProfilePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<VolumeProfileSimulator />} quiz={<VolumeProfileQuiz />} />;
}
