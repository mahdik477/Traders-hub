import type { Metadata } from "next";
import Link from "next/link";
import { getSection } from "@/lib/sections";
import { strategies, strategiesInDisplayOrder } from "@/lib/strategies";
import { STRATEGY_CATEGORY_ICONS } from "@/lib/strategy-types";
import StrategyDirectory from "@/components/StrategyDirectory";
import TerminalStatPanel from "@/components/TerminalStatPanel";
import IconPatternBackdrop from "@/components/IconPatternBackdrop";
import { PlayIcon, CheckIcon } from "@/components/icons";

const section = getSection("strategies");

export const metadata: Metadata = { title: section.title };

export default function StrategiesPage() {
  const freeCount = strategies.filter((s) => s.tier === "free").length;
  const intermediateCount = strategies.filter((s) => s.tier === "intermediate").length;
  const advancedCount = strategies.filter((s) => s.tier === "advanced").length;

  return (
    <div>
      <section className="grid grid-cols-1 gap-8 py-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-8">
        <div>
          <p className="eyebrow">{section.title}</p>
          <h1 className="page-title mt-2 text-[clamp(2rem,5vw,3rem)] leading-[1.05]">
            Learn a strategy, then{" "}
            <span className="brand-wordmark" style={{ fontFamily: "var(--font-heading)" }}>
              prove
            </span>{" "}
            you&apos;ve got it
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            {strategies.length} trading strategies explained in plain English — what each one is,
            how it&apos;s traditionally traded, and a live chart you can click on, right on the
            page. Never a claim that any of them will make you money.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#browse" className="btn btn-primary">
              <PlayIcon className="size-4" />
              Browse all strategies
            </a>
            <Link href="/disclaimer" className="btn btn-outline">
              Read the disclaimer
            </Link>
          </div>
        </div>

        <TerminalStatPanel
          caption="The library, by tier"
          backdrop={<IconPatternBackdrop icons={Object.values(STRATEGY_CATEGORY_ICONS)} />}
          stats={[
            { label: "Free", value: freeCount },
            { label: "Intermediate", value: intermediateCount },
            { label: "Advanced", value: advancedCount },
            { label: "With a live quiz", value: strategies.length },
          ]}
          footnote="Every strategy has a live simulator — shuffle the chart, test yourself, no account needed."
        />
      </section>

      <div id="browse" className="mt-6 scroll-mt-20 border-t border-border pt-10">
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
