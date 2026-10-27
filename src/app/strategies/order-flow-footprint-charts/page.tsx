import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import OrderFlowSimulator from "@/components/OrderFlowSimulator";
import OrderFlowQuiz from "@/components/OrderFlowQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "order-flow-footprint-charts";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function OrderFlowFootprintChartsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<OrderFlowSimulator />} quiz={<OrderFlowQuiz />} />;
}
