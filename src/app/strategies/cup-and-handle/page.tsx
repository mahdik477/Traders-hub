import type { Metadata } from "next";
import InteractiveStrategyPage from "@/components/InteractiveStrategyPage";
import CupHandleSimulator from "@/components/CupHandleSimulator";
import CupHandleQuiz from "@/components/CupHandleQuiz";
import { strategyMetadata } from "@/lib/strategy-metadata";

const SLUG = "cup-and-handle";

export const metadata: Metadata = strategyMetadata(SLUG);

export default function CupAndHandlePage() {
  return <InteractiveStrategyPage slug={SLUG} simulator={<CupHandleSimulator />} quiz={<CupHandleQuiz />} />;
}
