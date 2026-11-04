import type { Metadata } from "next";
import Link from "next/link";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import ComparisonTable from "@/components/learn/ComparisonTable";
import ExampleBox from "@/components/learn/ExampleBox";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("timeframes-and-styles")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "what-is-a-timeframe", label: "What's a timeframe?" },
  { id: "styles", label: "The four trading styles" },
  { id: "multi-timeframe", label: "Multi-timeframe analysis" },
  { id: "quiz", label: "Quick check" },
];

export default function TimeframesAndStylesPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="what-is-a-timeframe">What a timeframe actually is</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A timeframe is just how much real time each candle on a chart represents. A &quot;1-hour
          chart&quot; has one new candle every hour; a &quot;daily chart&quot; one new candle every
          day. The same price history looks completely different depending which timeframe you
          view it on — a sharp move on a 1-minute chart can be an unremarkable wiggle on a weekly
          one.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          Which timeframe someone trades off is really a question of{" "}
          <strong className="font-semibold text-foreground">trading style</strong> — how long they
          intend to hold a position, and how much time they can realistically spend watching the
          screen.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "A timeframe is just how much time each candle covers — the same price history looks different on every timeframe.",
          "Trading style (scalping, day trading, swing, position) and timeframe go hand in hand — pick a style that fits your actual schedule, then the timeframe follows.",
          "Checking a bigger-picture timeframe before acting on a smaller one is called multi-timeframe analysis, and it's standard practice across almost every strategy style.",
        ]}
      />

      <section>
        <SectionHeading id="styles">The four trading styles</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Nearly every approach to trading falls somewhere on this spectrum, from holding for
          seconds to holding for months.
        </p>
        <div className="mt-6">
          <ComparisonTable
            columns={["Scalping", "Day trading", "Swing trading", "Position trading"]}
            rows={[
              { label: "Typical hold time", values: ["Seconds–minutes", "Minutes–hours (closed same day)", "Days–weeks", "Weeks–months+"] },
              { label: "Common chart timeframe", values: ["1m–5m", "5m–1h", "4h–daily", "Daily–weekly"] },
              { label: "Trades per week (rough)", values: ["Dozens+", "Several", "A few", "Rare"] },
              { label: "Screen time needed", values: ["Very high", "High, during sessions", "Low–moderate, checked daily", "Low, checked weekly"] },
              { label: "Overnight/weekend risk", values: ["None (closed same session)", "Usually none", "Yes, by design", "Yes, by design"] },
            ]}
          />
        </div>

        <div className="mt-6">
          <ExampleBox>
            <p>
              Someone with a full-time job who can only check charts in the evening is working
              against the clock trying to scalp — the style needs constant attention during live
              market hours. Swing or position trading, checked once a day, fits that schedule far
              more naturally. This is about logistics, not which style is &quot;better.&quot;
            </p>
          </ExampleBox>
        </div>
      </section>

      <section>
        <SectionHeading id="multi-timeframe">Multi-timeframe analysis</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A common habit across almost every style: check a <em>bigger</em> timeframe first for
          overall direction, then drop to a <em>smaller</em> one to actually time the entry. A
          swing trader might check the daily chart for the broader trend, then use the 1-hour
          chart to pick a specific entry point within that trend, rather than trading the 1-hour
          chart in isolation and missing the bigger picture.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          There&apos;s a dedicated, interactive page on exactly this in the{" "}
          <Link href="/strategies/multi-timeframe-analysis" className="text-accent hover:underline">
            Strategies section
          </Link>
          , with a live example you can click through.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="Which style typically involves holding a position overnight or over a weekend by design?"
        options={["Scalping", "Day trading", "Swing trading", "None of them do"]}
        correctIndex={2}
        explanation="Swing (and position) trading are built around multi-day moves, so holding through the close and reopening of a session — including weekends — is expected. Scalping and day trading are both closed out same-session."
      />
    </LearnPageShell>
  );
}
