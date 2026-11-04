import type { Metadata } from "next";
import Link from "next/link";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("costs-fees-and-platforms")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "the-costs", label: "The main costs" },
  { id: "worked-example", label: "A worked example" },
  { id: "platforms", label: "Platforms & where to check" },
  { id: "quiz", label: "Quick check" },
];

export default function CostsFeesAndPlatformsPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="the-costs">The costs that quietly add up</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Every trade has a cost built in somewhere, even when a platform advertises &quot;zero
          commission.&quot; None of these are hidden exactly — they&apos;re published, usually in
          the small print — but they&apos;re easy to overlook until they&apos;ve quietly taken a
          real bite out of returns.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Spread",
                definition: "The gap between the buy price and the sell price at any moment — you're effectively down the spread the instant a trade opens, before price moves at all.",
              },
              {
                term: "Commission",
                definition: "A fee charged per trade, separate from the spread — common on stock and futures platforms, less common (but not unheard of) in forex.",
              },
              {
                term: "Swap / overnight fee",
                definition: "A financing charge (or, sometimes, credit) applied when a leveraged position is held open overnight — the cost of that borrowed exposure over time.",
              },
              {
                term: "Slippage",
                definition: "The difference between the price you expected and the price you actually got — usually during fast moves or low liquidity, not something any platform directly charges.",
              },
              {
                term: "Platform / data fees",
                definition: "A monthly charge for the charting platform itself, real-time data, or add-on tools — separate from anything charged per trade.",
              },
              {
                term: "Inactivity fee",
                definition: "Some brokers charge a fee if an account goes unused for a set period — worth checking before leaving an account dormant.",
              },
            ]}
          />
        </div>
      </section>

      <KeyTakeaways
        items={[
          "“Zero commission” doesn't mean free — the cost usually shows up in the spread instead.",
          "Swap/overnight fees only apply to positions held past a session close — a pure day-trading or scalping approach can largely avoid them.",
          "Small costs compound: a cost that looks tiny on one trade adds up fast across hundreds of trades.",
        ]}
      />

      <section>
        <SectionHeading id="worked-example">A worked example</SectionHeading>
        <ExampleBox>
          <p>
            A trader takes 20 trades in a month on a pair with a 1.5-pip spread, each on a
            standard lot where a pip is worth about $10. The spread alone costs roughly $15 per
            trade in round-turn cost — about $300 across the month, before a single trade&apos;s
            actual profit or loss is counted. None of that is unusual or hidden; it&apos;s simply
            the arithmetic of trading frequently on a given spread.
          </p>
        </ExampleBox>
      </section>

      <section>
        <SectionHeading id="platforms">Platforms, and where to actually check these numbers</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Every broker and prop firm publishes this information somewhere — typically a pricing
          or contract-specifications page — but the exact numbers vary a lot between providers,
          and change over time. Rather than repeat specific figures here that would go stale, this
          is exactly what the comparison sections elsewhere on this site are for:
        </p>
        <ul className="mt-4 space-y-2.5 text-lg leading-relaxed text-foreground/90">
          <li className="flex items-start gap-2.5">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              <Link href="/brokers" className="text-accent hover:underline">
                Brokers
              </Link>{" "}
              — compare minimum deposits, regulation and supported platforms side by side.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              <Link href="/funded-accounts" className="text-accent hover:underline">
                Funded accounts
              </Link>{" "}
              — compare prop firm evaluation fees, drawdown rules and profit splits.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              <Link href="/tools" className="text-accent hover:underline">
                Tools
              </Link>{" "}
              — charting platforms, data feeds and VPS hosting, with pricing where we could
              confirm it.
            </span>
          </li>
        </ul>
      </section>

      <MiniQuiz
        id="quiz"
        question="A platform advertises “zero commission” trading. What's the most accurate read of that?"
        options={[
          "Trading there is genuinely free",
          "The cost has likely just moved into the spread instead",
          "It only applies to the first trade",
          "It means no fees exist on that platform at all",
        ]}
        correctIndex={1}
        explanation="A broker still has to earn money somewhere — “zero commission” almost always means the cost is built into a wider spread instead of a separate line-item fee, not that trading is free."
      />
    </LearnPageShell>
  );
}
