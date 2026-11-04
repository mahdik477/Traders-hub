import type { Metadata } from "next";
import Link from "next/link";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("markets-and-instruments")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "what-is-a-market", label: "What is a market?" },
  { id: "asset-classes", label: "Asset classes" },
  { id: "forex-pairs", label: "Forex pairs" },
  { id: "quiz", label: "Quick check" },
];

export default function MarketsAndInstrumentsPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="what-is-a-market">What is a market?</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A market is just a place — physical or, almost always now, digital — where buyers and
          sellers agree on a price for something and trade it. The New York Stock Exchange,
          the global network banks use to trade currencies, a crypto exchange&apos;s order book —
          all markets. &quot;The price&quot; of anything is really just the last price a buyer and
          a seller actually agreed on.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          Trading means buying something with the plan of selling it later for more (or selling
          first and buying it back cheaper — more on that in the next part), rather than holding
          it for its own sake. What you can actually trade falls into a handful of broad{" "}
          <strong className="font-semibold text-foreground">asset classes</strong>, each with its
          own rhythm, vocabulary and typical trading hours.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "A market is just buyers and sellers agreeing on a price — nothing more mystical than that.",
          "Different asset classes (forex, stocks, crypto, etc.) trade differently, at different hours, with different vocabulary.",
          "A forex \"pair\" is a bet on one currency's value relative to another, not an absolute price.",
        ]}
      />

      <section>
        <SectionHeading id="asset-classes">The main asset classes</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Most of what people mean by &quot;trading&quot; falls into one of these. This site covers
          prop firms, brokers and strategies across several of them — the vocabulary below is
          what you&apos;ll see repeated everywhere else.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            columns={3}
            items={[
              {
                term: "Forex (FX)",
                tag: "24/5",
                definition: "Currencies traded against each other — EUR/USD, GBP/JPY and so on. The largest, most liquid market in the world, open nearly round the clock on weekdays.",
              },
              {
                term: "Stocks (equities)",
                tag: "Exchange hours",
                definition: "A share of ownership in a company. Trades on an exchange (NYSE, Nasdaq, LSE...) during that exchange's set hours.",
              },
              {
                term: "Indices",
                tag: "Exchange hours",
                definition: "A basket of stocks tracked as one number — the S&P 500, the FTSE 100. You're betting on a whole market or sector moving together.",
              },
              {
                term: "Commodities",
                tag: "Varies",
                definition: "Physical goods — gold, oil, wheat, natural gas. Traded via futures contracts or CFDs rather than the physical goods themselves.",
              },
              {
                term: "Crypto",
                tag: "24/7",
                definition: "Digital assets like Bitcoin and Ethereum. Trades around the clock, every day, with no central exchange hours at all.",
              },
              {
                term: "Futures",
                tag: "Near 24/5",
                definition: "A standardised contract to buy or sell something at a set price on a set future date — used for commodities, indices and more.",
              },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeading id="forex-pairs">Forex pairs, pips and lots</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A forex price is always a ratio: how much of one currency it takes to buy one unit of
          another. EUR/USD at 1.0850 means one euro buys $1.0850. The first currency listed is
          the <strong className="font-semibold text-foreground">base</strong>; the second is the{" "}
          <strong className="font-semibold text-foreground">quote</strong>. Buying the pair means
          buying the base currency and selling the quote currency at the same time.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Major pairs",
                definition: "Pairs that include the US dollar and another large economy's currency — EUR/USD, GBP/USD, USD/JPY. The most heavily traded, tightest spreads.",
              },
              {
                term: "Minor pairs",
                definition: "Major currencies traded against each other without the US dollar — EUR/GBP, AUD/JPY. Slightly wider spreads, still very liquid.",
              },
              {
                term: "Exotic pairs",
                definition: "A major currency paired with a smaller or emerging-market one — USD/TRY, EUR/ZAR. Lower liquidity, wider spreads, bigger swings.",
              },
              {
                term: "Pip",
                definition: "The standard smallest price move for most pairs — usually the 4th decimal place (the 2nd for pairs involving the Japanese yen).",
              },
              {
                term: "Lot size",
                definition: "The standard trade-size unit: a standard lot is 100,000 units of the base currency, a mini lot 10,000, a micro lot 1,000.",
              },
              {
                term: "Spread",
                definition: "The gap between the price you can buy at (ask) and sell at (bid) — the most common built-in cost of a trade. More in part 9.",
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <ExampleBox>
            <p>
              Say EUR/USD moves from 1.0850 to 1.0870. That&apos;s a 20-pip move. On one standard
              lot (100,000 EUR), each pip is worth roughly $10 — so that move is worth about $200
              on the position, before any costs.
            </p>
          </ExampleBox>
        </div>

        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          Stocks, indices, commodities and crypto don&apos;t use pips or lots the same way — a
          stock moves in cents or dollars per share, crypto in whatever its own price scale is.
          The underlying idea is the same everywhere though:{" "}
          <strong className="font-semibold text-foreground">
            know the smallest unit of price movement and the size of position you&apos;re
            actually holding
          </strong>
          , because that&apos;s what turns a price move into real money. We cover that properly
          in{" "}
          <Link href="/learn/risk-management" className="text-accent hover:underline">
            part 7, Risk Management
          </Link>
          .
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="In GBP/JPY, which currency is the “base” currency?"
        options={["GBP", "JPY", "Neither — forex pairs don't have a base", "Both equally"]}
        correctIndex={0}
        explanation="The base currency is always listed first. GBP/JPY is quoted as “how many yen does one pound buy” — GBP is the base, JPY is the quote."
      />
    </LearnPageShell>
  );
}
