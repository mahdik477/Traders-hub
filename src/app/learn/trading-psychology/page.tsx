import type { Metadata } from "next";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("trading-psychology")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "why-it-matters", label: "Why it matters" },
  { id: "common-traps", label: "Common traps" },
  { id: "journaling", label: "Trading journals" },
  { id: "discipline", label: "Discipline vs. rules" },
  { id: "quiz", label: "Quick check" },
];

export default function TradingPsychologyPage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="why-it-matters">Why psychology gets its own part</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A trading plan is just a set of rules on paper. The thing that actually decides whether
          those rules get followed, under real pressure, with real money on the line, is
          psychology. It&apos;s entirely possible to know the &quot;correct&quot; thing to do in a
          given moment and still not do it — because fear, excitement or frustration are louder in
          that moment than a rule written down calmly, beforehand.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "Knowing a rule and following it under pressure are two different skills — most trading mistakes are psychology problems wearing a strategy costume.",
          "FOMO, revenge trading and overtrading are specific, nameable patterns — naming them makes them easier to catch happening in real time.",
          "A trading journal is the single most commonly recommended habit for breaking repeated mistakes, because it turns a feeling into a pattern you can actually see.",
        ]}
      />

      <section>
        <SectionHeading id="common-traps">Common emotional traps</SectionHeading>
        <div className="mt-4">
          <DefinitionGrid
            items={[
              {
                term: "FOMO",
                tag: "Fear of missing out",
                definition: "Jumping into a trade late, chasing a move that's already mostly happened, because watching it continue without being in it feels worse than the risk of entering late.",
              },
              {
                term: "Revenge trading",
                definition: "Trying to immediately win back a loss with a bigger, hastier trade — usually breaking the exact rules that would normally apply, right when they matter most.",
              },
              {
                term: "Overtrading",
                definition: "Taking far more trades than a plan actually calls for, often out of boredom or a need to feel active in the market rather than a genuine signal.",
              },
              {
                term: "Confirmation bias",
                definition: "Noticing the evidence that supports a trade you already want to take, while unconsciously discounting the evidence against it.",
              },
              {
                term: "Overconfidence",
                definition: "A short winning streak feeling like proof of skill, leading to bigger size or looser rules right when a reversion is statistically most likely.",
              },
              {
                term: "Analysis paralysis",
                definition: "Adding indicator after indicator looking for certainty that doesn't exist, until no signal ever feels “confirmed enough” to actually act on.",
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <ExampleBox>
            <p>
              A trade hits its stop-loss. The instinct is to immediately re-enter, bigger, to
              &quot;make it back&quot; right away. That instinct — revenge trading — is exactly
              the moment a plan&apos;s rules exist to override, not the moment to trust the gut
              feeling most.
            </p>
          </ExampleBox>
        </div>
      </section>

      <section>
        <SectionHeading id="journaling">The trading journal</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Writing down every trade — why it was taken, what the plan was, what actually happened,
          how it felt in the moment — turns a string of one-off decisions into a pattern that can
          actually be reviewed. It&apos;s far easier to notice &quot;I keep abandoning my stop-loss
          on Fridays&quot; by reading a month of journal entries than by trying to remember it.
        </p>
      </section>

      <section>
        <SectionHeading id="discipline">Discipline vs. rules</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          A rule is something written down in advance. Discipline is actually following it when
          it&apos;s inconvenient to. The two aren&apos;t the same thing, and having great rules
          with no discipline to follow them produces the same result as having no rules at all.
          Most experienced traders will say discipline was the harder of the two to build —
          not because the rules themselves were complicated, but because following them
          consistently, especially after a loss, takes real practice.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="A trade hits its stop-loss, and the very next instinct is to immediately re-enter bigger to win the loss back. What's this an example of?"
        options={["Good risk management", "Revenge trading", "Confirmation bias", "Multi-timeframe analysis"]}
        correctIndex={1}
        explanation="Trying to immediately win back a loss with a bigger, hastier trade is the textbook definition of revenge trading — one of the most common ways a single loss turns into a much bigger one."
      />
    </LearnPageShell>
  );
}
