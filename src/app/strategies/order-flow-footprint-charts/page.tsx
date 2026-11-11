import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import OrderFlowSimulator from "@/components/OrderFlowSimulator";
import OrderFlowQuiz from "@/components/OrderFlowQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "order-flow-footprint-charts";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function OrderFlowFootprintChartsPage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<OrderFlowSimulator />} quiz={<OrderFlowQuiz />} />;
}
