import type { Metadata } from "next";
import Link from "next/link";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import RiskRewardCalculator from "@/components/learn/RiskRewardCalculator";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("risk-management")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "why-it-matters", label: "Why it matters most" },
  { id: "position-sizing", label: "Position sizing" },
  { id: "stops-and-targets", label: "Stops & targets" },
  { id: "risk-reward", label: "Risk : reward" },
  { id: "drawdown", label: "Drawdown" },
  { id: "quiz", label: "Quick check" },
];

export default function RiskManagementPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="why-it-matters">Why this matters more than being right</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          It&apos;s genuinely possible to be right more often than wrong and still lose money
          overall — if the losses, when they happen, are bigger than the wins. It&apos;s also
          possible to be wrong most of the time and still come out ahead, if the wins are
          structured to be meaningfully bigger than the losses. Risk management is the set of
          habits that decides which of those two outcomes a trader ends up with — independent of
          how good their actual market calls are.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          It&apos;s also, honestly, the least exciting part of trading to learn — which is exactly
          why it&apos;s worth slowing down for.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "How much you win or lose on any single trade matters less, long-run, than how consistently you control the size of your losses.",
          "Position sizing and a stop-loss are how you decide, before a trade even opens, exactly how much you're willing to lose on it.",
          "Risk:reward ratio compares what a trade stands to lose against what it stands to make — a trade can be “good risk management” and still lose; that's expected, not a failure.",
        ]}
      />

      <section>
        <SectionHeading id="position-sizing">Position sizing</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Position sizing means deciding how much to trade based on how much you&apos;re willing
          to lose if you&apos;re wrong — not based on how much margin is available, and not based
          on a round number that feels right. A common approach: decide a fixed percentage of the
          account to risk per trade (often 1–2%), then work backward from the distance to your
          stop-loss to find the position size that risks exactly that amount.
        </p>
      </section>

      <section>
        <SectionHeading id="stops-and-targets">Stop-losses and take-profits</SectionHeading>
        <div className="mt-4">
          <DefinitionGrid
            items={[
              {
                term: "Stop-loss",
                definition: "A pre-set order that closes a losing trade automatically once price hits a chosen level — the line in the sand decided before emotions are involved.",
              },
              {
                term: "Take-profit",
                definition: "The mirror order — closes a winning trade automatically at a target price, so a plan doesn't depend on manually watching and reacting in time.",
              },
              {
                term: "Risk per trade",
                definition: "The dollar (or percentage) amount actually lost if the stop-loss is hit — the number position sizing is built around.",
              },
              {
                term: "Max drawdown",
                definition: "How far an account has fallen from its previous peak, usually shown as a percentage — covered properly below.",
              },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeading id="risk-reward">Risk : reward, calculated live</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Risk:reward compares the distance from entry to stop (what you stand to lose) against
          the distance from entry to target (what you stand to make). A 1:3 ratio means risking $1
          to try to make $3. It doesn&apos;t say anything about how <em>likely</em> the trade is
          to work — a strategy with a good risk:reward ratio can still have a low win rate and be
          perfectly sound, and a strategy with a poor one can need a very high win rate just to
          break even.
        </p>
        <div className="mt-6">
          <RiskRewardCalculator />
        </div>
      </section>

      <div className="mt-2">
        <ExampleBox title="Why the 1–2% guideline exists">
          <p>
            Risking 2% per trade, a trader can lose 10 trades in a row and still have about 82%
            of the account left — bruised, but very much still in the game. Risking 20% per trade,
            the same losing streak wipes the account out almost entirely. The guideline isn&apos;t
            about any single trade; it&apos;s about surviving the losing streaks that happen to
            every approach eventually.
          </p>
        </ExampleBox>
      </div>

      <section>
        <SectionHeading id="drawdown">Drawdown</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Drawdown is how far an account has fallen from its highest previous point, shown as a
          percentage. An account that grows from $10,000 to $12,000, then falls to $10,800, is in
          a 10% drawdown from its $12,000 peak — even though it&apos;s still up overall from where
          it started. This is also the exact number most{" "}
          <Link href="/funded-accounts" className="text-accent hover:underline">
            prop firm evaluations
          </Link>{" "}
          set hard limits on, so it&apos;s worth getting comfortable reading it correctly.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="A trader risks $100 per trade aiming for $300 profit — a 1:3 risk:reward ratio. If only 3 out of 10 such trades win, are they profitable overall?"
        options={[
          "No — losing 7 out of 10 trades can't be profitable",
          "Yes — 3 wins of $300 ($900) beats 7 losses of $100 ($700)",
          "It's exactly break-even",
          "Impossible to know without more information"
        ]}
        correctIndex={1}
        explanation="3 × $300 = $900 in wins versus 7 × $100 = $700 in losses — a net $200 gain, despite losing on most trades. This is exactly why risk:reward and win rate have to be looked at together, never one alone."
      />
    </LearnPageShell>
  );
}
