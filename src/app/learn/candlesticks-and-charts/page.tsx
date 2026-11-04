import type { Metadata } from "next";
import Link from "next/link";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import { CandleAnatomyDiagram, CandlePatternGallery } from "@/components/learn/CandlestickDiagram";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("candlesticks-and-charts")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "why-candles", label: "Why candlesticks?" },
  { id: "anatomy", label: "Anatomy of a candle" },
  { id: "chart-types", label: "Chart types" },
  { id: "patterns", label: "Common patterns" },
  { id: "quiz", label: "Quick check" },
];

export default function CandlesticksAndChartsPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="why-candles">Why candlesticks exist</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Every chart is really just a record of price over time. A candlestick chart packs four
          numbers — the open, high, low and close of a period — into one shape, so a trader can
          scan hundreds of periods at a glance instead of reading a table of numbers. Each
          &quot;candle&quot; represents one fixed slice of time: one minute, one hour, one day,
          whatever timeframe the chart is set to (more on choosing a timeframe in part 4).
        </p>
      </section>

      <KeyTakeaways
        items={[
          "A candle shows four numbers at once: the open, high, low and close of one time period.",
          "The body is open-to-close; the thin wicks above and below show the full high-to-low range.",
          "No single candle or pattern predicts the future — they describe what already happened, which is still useful context.",
        ]}
      />

      <section>
        <SectionHeading id="anatomy">Anatomy of a candle</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Four prices, two parts. The thick rectangle — the{" "}
          <strong className="font-semibold text-foreground">body</strong> — spans from the open
          to the close. The thin lines above and below it — the{" "}
          <strong className="font-semibold text-foreground">wicks</strong> (or shadows) — mark
          the highest and lowest price actually traded during that period, even if price didn&apos;t
          close there.
        </p>
        <div className="mt-6">
          <CandleAnatomyDiagram />
        </div>
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          If the close is above the open, the candle is usually shown as one colour (often green,
          sometimes white or blue) — price rose over that period. If the close is below the open,
          it&apos;s shown as another colour (often red, sometimes black) — price fell. The exact
          colours are just a platform setting; always check the legend on a chart you don&apos;t
          recognise.
        </p>
      </section>

      <section>
        <SectionHeading id="chart-types">Chart types</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Candlesticks are the most common chart style, but not the only one.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Line chart",
                definition: "Just connects the closing prices with a line. Clean and simple, but hides everything that happened within each period.",
              },
              {
                term: "Bar chart (OHLC)",
                definition: "The same four prices as a candle, drawn as a vertical line with small tick marks for open and close instead of a filled body.",
              },
              {
                term: "Candlestick chart",
                definition: "The default on most platforms — covered above. Easiest to scan for shape and pattern at speed.",
              },
              {
                term: "Heikin-Ashi",
                definition: "A smoothed variant of candlesticks that averages each candle with the one before it, making trends easier to read at the cost of hiding some raw detail.",
              },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeading id="patterns">A handful of common patterns</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Traders have named hundreds of candle shapes and combinations over the decades. You
          don&apos;t need to memorise all of them — these six come up constantly and are a solid
          starting vocabulary. Each describes a specific relationship between open, high, low and
          close; none of them guarantee what happens next.
        </p>
        <div className="mt-6">
          <CandlePatternGallery />
        </div>
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          Several of these have dedicated, interactive pages in the{" "}
          <Link href="/strategies" className="text-accent hover:underline">
            Strategies section
          </Link>{" "}
          — with a live chart you can click on to test whether you&apos;d actually spot them. Good
          next step once this part is done.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="A candle's upper wick shows..."
        options={[
          "The opening price",
          "The highest price traded during that period",
          "Trading volume",
          "Tomorrow's expected price"
        ]}
        correctIndex={1}
        explanation="The wicks mark the full high-low range actually traded — the upper wick's tip is the period's high, even if price closed well below it."
      />
    </LearnPageShell>
  );
}
