import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import SupplyDemandSimulator from "@/components/SupplyDemandSimulator";
import SupplyDemandQuiz from "@/components/SupplyDemandQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "supply-and-demand-zones";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function SupplyDemandZonesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<SupplyDemandSimulator />} quiz={<SupplyDemandQuiz />} />;
}
