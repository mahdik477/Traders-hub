import type { Metadata } from "next";
import Link from "next/link";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("technical-analysis-essentials")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "what-is-ta", label: "What is TA?" },
  { id: "trend", label: "Trend" },
  { id: "support-resistance", label: "Support & resistance" },
  { id: "moving-averages", label: "Moving averages" },
  { id: "indicator-families", label: "Indicator families" },
  { id: "quiz", label: "Quick check" },
];

export default function TechnicalAnalysisEssentialsPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="what-is-ta">What technical analysis actually is</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Technical analysis (TA) means making trading decisions mostly from the price chart
          itself — its history, shape and patterns — rather than from a company&apos;s financial
          results or an economy&apos;s data releases (that side is called{" "}
          <strong className="font-semibold text-foreground">fundamental analysis</strong>, covered
          next in part 6). The idea underneath it: price already reflects everything the market
          currently knows, and the way price has moved in the past tends to rhyme, even if it
          never repeats exactly.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          TA is not a crystal ball. It organises probability — it never tells you what{" "}
          <em>will</em> happen, only what&apos;s happened in similar-looking situations before.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "Technical analysis reads price history itself; fundamental analysis reads the underlying business or economy. Most traders use some of both.",
          "Trend, support/resistance and moving averages are the load-bearing concepts almost everything else in TA builds on.",
          "An indicator is just a formula applied to price — none of them predict the future, they summarise the past in a specific way.",
        ]}
      />

      <section>
        <SectionHeading id="trend">Trend</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A market is in an{" "}
          <strong className="font-semibold text-foreground">uptrend</strong> when it&apos;s making
          a series of higher highs and higher lows — each peak and each dip landing above the last
          one. A <strong className="font-semibold text-foreground">downtrend</strong> is the
          mirror: lower highs and lower lows. When price isn&apos;t clearly doing either, it&apos;s
          usually described as <strong className="font-semibold text-foreground">ranging</strong>{" "}
          or sideways.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          &quot;The trend is your friend&quot; is one of the oldest sayings in trading — a huge
          amount of strategy design is really just different ways of answering &quot;what&apos;s
          the current trend, and how do I get in without being too early or too late?&quot;
        </p>
      </section>

      <section>
        <SectionHeading id="support-resistance">Support and resistance</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          <strong className="font-semibold text-foreground">Support</strong> is a price level
          where buying has repeatedly shown up and stopped a decline. {" "}
          <strong className="font-semibold text-foreground">Resistance</strong> is the mirror — a
          level where selling has repeatedly capped an advance. Neither is a hard physical wall;
          they&apos;re zones where enough traders have reacted before that it tends to happen
          again, until eventually it doesn&apos;t and price breaks through.
        </p>
        <div className="mt-6">
          <ExampleBox>
            <p>
              A stock has bounced off $50 three separate times over two months. Many traders will
              now watch $50 closely — some buying near it expecting another bounce (support
              holding), others watching for a clean break below it as a sign something&apos;s
              changed.
            </p>
          </ExampleBox>
        </div>
      </section>

      <section>
        <SectionHeading id="moving-averages">Moving averages</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A moving average smooths price into a single line by averaging the last N periods,
          recalculated as each new period closes. It&apos;s the simplest, most widely used way to
          answer &quot;what&apos;s the trend, roughly, ignoring the noise?&quot; — and the
          building block for a huge number of other indicators and strategies.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          There&apos;s a full, interactive page on this with a live chart you can drag sliders on
          in the{" "}
          <Link href="/strategies/moving-average-crossover" className="text-accent hover:underline">
            Strategies section
          </Link>
          .
        </p>
      </section>

      <section>
        <SectionHeading id="indicator-families">A map of indicator families</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          There are hundreds of named indicators, but nearly all of them fall into one of four
          jobs. Each one below links to a live, click-to-test example in the Strategies section.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Trend indicators",
                definition: "Answer “which way, and how strongly?” — moving averages, ADX, Supertrend.",
              },
              {
                term: "Momentum indicators",
                definition: "Answer “how fast and how far has price moved, recently?” — RSI, MACD, Stochastic.",
              },
              {
                term: "Volume indicators",
                definition: "Answer “is the move backed by real participation?” — On-Balance Volume, VWAP.",
              },
              {
                term: "Volatility indicators",
                definition: "Answer “how big are the swings right now?” — Bollinger Bands, ATR, Keltner Channel.",
              },
            ]}
          />
        </div>
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          Browse the full{" "}
          <Link href="/strategies" className="text-accent hover:underline">
            Strategies library
          </Link>{" "}
          to try any of these live — each one has its own simulator and a quiz to test whether
          you&apos;d actually spot the signal on an unlabelled chart.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="Price has just made a lower low after a lower high. What's this most likely describing?"
        options={["An uptrend", "A downtrend", "Guaranteed reversal", "A support level"]}
        correctIndex={1}
        explanation="Lower highs and lower lows, in sequence, is the definition of a downtrend. Nothing about it is a guarantee of what happens next — trends do eventually end."
      />
    </LearnPageShell>
  );
}
