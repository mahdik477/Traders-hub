import type { Metadata } from "next";
import Link from "next/link";
import { getSection } from "@/lib/sections";
import { strategies, strategiesInDisplayOrder } from "@/lib/strategies";
import StrategyDirectory from "@/components/StrategyDirectory";
import CountUpStat from "@/components/CountUpStat";
import { PlayIcon, CheckIcon } from "@/components/icons";

const section = getSection("strategies");

export const metadata: Metadata = { title: section.title };

export default function StrategiesPage() {
  const freeCount = strategies.filter((s) => s.tier === "free").length;
  const intermediateCount = strategies.filter((s) => s.tier === "intermediate").length;
  const advancedCount = strategies.filter((s) => s.tier === "advanced").length;

  return (
    <div>
      <header className="detail-hero mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="p-5 sm:p-7">
          <p className="eyebrow">{section.title}</p>
          <h1 className="page-title mt-2">Learn a strategy, then prove you&apos;ve got it</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
            {strategies.length} trading strategies explained in plain English — what each one is,
            how it&apos;s traditionally traded, and a live chart you can click on, right on the
            page. Never a claim that any of them will make you money.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="#browse" className="btn btn-primary">
              <PlayIcon className="size-4" />
              Browse all strategies
            </a>
            <Link href="/disclaimer" className="btn btn-outline">
              Read the disclaimer
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <HeroStat label="Free" value={freeCount} />
          <HeroStat label="Intermediate" value={intermediateCount} />
          <HeroStat label="Advanced" value={advancedCount} />
        </dl>
      </header>

      <div id="browse" className="mt-10 scroll-mt-20">
        <h2 className="section-title flex items-center gap-2 text-2xl">
          <CheckIcon className="size-5 text-accent" />
          Browse the library
        </h2>
        <p className="meta mt-1.5 max-w-2xl">
          Educational write-ups only, never financial advice. The free tier is open to everyone;
          the rest is open too while we finish building the paid library — see the{" "}
          <Link href="/disclaimer" className="text-accent hover:underline">
            disclaimer
          </Link>{" "}
          for the full picture.
        </p>
        <div className="mt-6">
          <StrategyDirectory strategies={strategiesInDisplayOrder} />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
      <div className="eyebrow">{label}</div>
      <div className="figure-lg mt-1 text-foreground sm:text-xl">
        <CountUpStat value={value} />
      </div>
    </div>
  );
}
