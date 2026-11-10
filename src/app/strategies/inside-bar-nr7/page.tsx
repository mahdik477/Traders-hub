import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import InsideBarSimulator from "@/components/InsideBarSimulator";
import InsideBarQuiz from "@/components/InsideBarQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "inside-bar-nr7";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function InsideBarNr7Page() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<InsideBarSimulator />} quiz={<InsideBarQuiz />} />;
}
