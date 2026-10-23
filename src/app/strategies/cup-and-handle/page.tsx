import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CupHandleSimulator from "@/components/CupHandleSimulator";
import CupHandleQuiz from "@/components/CupHandleQuiz";
import { getStrategy } from "@/lib/strategies";

const SLUG = "cup-and-handle";

export const metadata: Metadata = (() => {
  const s = getStrategy(SLUG);
  return s ? { title: s.name, description: s.summaryOneLine } : {};
})();

export default function CupAndHandlePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CupHandleSimulator />} quiz={<CupHandleQuiz />} />;
}
