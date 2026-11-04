import type { Metadata } from "next";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("fundamental-analysis-and-metrics")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "what-is-fa", label: "What is FA?" },
  { id: "stock-metrics", label: "Key company metrics" },
  { id: "macro-drivers", label: "Forex & macro drivers" },
  { id: "economic-calendar", label: "The economic calendar" },
  { id: "quiz", label: "Quick check" },
];

export default function FundamentalAnalysisPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="what-is-fa">What fundamental analysis is</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Fundamental analysis (FA) means judging whether something is worth more or less than
          its current price by looking at the real-world thing behind it — a company&apos;s
          actual financial health for a stock, an economy&apos;s actual condition for a currency.
          It&apos;s the counterpart to the technical analysis covered in part 5: TA reads the
          chart, FA reads the business or the economy behind the chart.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          Plenty of traders use only one side, plenty use both — checking the fundamentals for
          context, then using technical analysis to actually time an entry.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "Fundamental analysis judges the real business or economy behind a price — earnings and valuation for stocks, interest rates and growth for currencies.",
          "A handful of metrics (P/E, EPS, market cap...) cover most of what gets referenced day to day for stocks.",
          "For forex, interest-rate decisions and a short list of economic releases move markets more than almost anything else.",
        ]}
      />

      <section>
        <SectionHeading id="stock-metrics">Key company metrics</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          These show up on virtually every stock&apos;s summary page, under slightly different
          names depending on the platform.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Market cap",
                definition: "Share price × total shares outstanding — the market's view of what the whole company is worth right now.",
              },
              {
                term: "P/E ratio",
                tag: "Price / Earnings",
                definition: "Share price divided by earnings per share. A rough “how many years of current profit would it take to pay back the price” gauge — higher often means the market expects faster growth.",
              },
              {
                term: "EPS",
                tag: "Earnings per share",
                definition: "Net profit divided by the number of shares outstanding — how much of the company's profit, in dollars, each single share represents.",
              },
              {
                term: "Revenue",
                definition: "Total money the company brought in before any costs are subtracted — the top line of the income statement.",
              },
              {
                term: "Dividend yield",
                definition: "Annual dividend paid per share, as a percentage of the current share price — what a holder earns in cash payouts, separate from any price change.",
              },
              {
                term: "Debt-to-equity",
                definition: "Total debt divided by shareholder equity — a rough gauge of how much of the company is financed by borrowing versus ownership.",
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <ExampleBox>
            <p>
              Two companies both trade at $100 a share. Company A earns $10 per share a year
              (P/E of 10); Company B earns $2 per share a year (P/E of 50). On earnings alone,
              A looks cheaper relative to its current profit — though a higher P/E can also just
              mean the market expects B to grow its earnings much faster. One number is never the
              whole picture.
            </p>
          </ExampleBox>
        </div>
      </section>

      <section>
        <SectionHeading id="macro-drivers">Forex and macro drivers</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A currency doesn&apos;t have earnings or a P/E ratio — its fundamentals are the health
          of the whole economy behind it. A handful of releases and decisions move forex markets
          more than almost anything else.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Interest rates",
                definition: "Set by a country's central bank. Higher rates tend to attract foreign capital seeking yield, which tends to strengthen that currency — and vice versa.",
              },
              {
                term: "Central banks",
                definition: "The Fed (US), ECB (eurozone), BoE (UK), BoJ (Japan) and others — their rate decisions and public comments are among the most closely watched events in forex.",
              },
              {
                term: "Inflation (CPI)",
                definition: "Consumer Price Index — how fast prices are rising economy-wide. High inflation often pushes central banks toward raising rates.",
              },
              {
                term: "Employment data (NFP)",
                definition: "Non-Farm Payrolls — the US's monthly jobs report, one of the most-watched single data releases in forex because of how directly it feeds into Fed decisions.",
              },
              {
                term: "GDP",
                definition: "Gross Domestic Product — the total value of everything an economy produced over a period, the broadest single measure of economic growth.",
              },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeading id="economic-calendar">The economic calendar</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Most of the releases above happen on a known, published schedule — an{" "}
          <strong className="font-semibold text-foreground">economic calendar</strong> lists them
          in advance, usually with a forecast figure and the actual result once it&apos;s out.
          Markets often move sharply in the seconds around a major release, especially when the
          actual number surprises versus the forecast — which is exactly why many brokers and
          prop firms separately flag high-impact news events as higher-risk trading windows.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="A country's central bank unexpectedly raises interest rates. All else equal, what tends to happen to that country's currency?"
        options={["It tends to strengthen", "It tends to weaken", "No typical effect", "It only affects stocks, not currencies"]}
        correctIndex={0}
        explanation="Higher rates tend to attract capital seeking a better return, increasing demand for that currency — a common (not guaranteed) relationship traders watch closely."
      />
    </LearnPageShell>
  );
}
