import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import SupplyDemandSimulator from "@/components/SupplyDemandSimulator";
import SupplyDemandQuiz from "@/components/SupplyDemandQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "supply-and-demand-zones";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function SupplyDemandZonesPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<SupplyDemandSimulator />} quiz={<SupplyDemandQuiz />} />;
}
