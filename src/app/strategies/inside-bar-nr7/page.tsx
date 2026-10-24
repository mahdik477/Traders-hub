import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import InsideBarSimulator from "@/components/InsideBarSimulator";
import InsideBarQuiz from "@/components/InsideBarQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "inside-bar-nr7";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function InsideBarNr7Page() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<InsideBarSimulator />} quiz={<InsideBarQuiz />} />;
}
