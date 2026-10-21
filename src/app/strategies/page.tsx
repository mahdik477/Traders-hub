import type { Metadata } from "next";
import Link from "next/link";
import { getSection } from "@/lib/sections";
import { strategiesInDisplayOrder } from "@/lib/strategies";
import StrategyDirectory from "@/components/StrategyDirectory";

const section = getSection("strategies");

export const metadata: Metadata = { title: section.title };

export default function StrategiesPage() {
  return (
    <div>
      <h1 className="title-rule page-title">{section.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{section.summary}</p>
      <p className="meta mt-3 max-w-2xl">
        Educational write-ups only — never financial advice, and never a claim that any of these
        will make you money. The 10 Free-tier strategies are open to everyone; the rest are part
        of the paid library and, for now, open too while we finish building it — see the{" "}
        <Link href="/disclaimer" className="text-accent hover:underline">
          disclaimer
        </Link>{" "}
        for the full picture.
      </p>
      <div className="mt-8">
        <StrategyDirectory strategies={strategiesInDisplayOrder} />
      </div>
    </div>
  );
}
