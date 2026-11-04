import type { Metadata } from "next";
import LearnPageShell from "@/components/learn/LearnPageShell";
import SectionHeading from "@/components/learn/SectionHeading";
import KeyTakeaways from "@/components/learn/KeyTakeaways";
import DefinitionGrid from "@/components/learn/DefinitionGrid";
import ExampleBox from "@/components/learn/ExampleBox";
import LeverageMarginExplainer from "@/components/learn/LeverageMarginExplainer";
import MiniQuiz from "@/components/learn/MiniQuiz";
import { getLearnTopic } from "@/lib/learn-topics";

const topic = getLearnTopic("orders-and-leverage")!;

export const metadata: Metadata = { title: topic.title };

const TOC = [
  { id: "long-and-short", label: "Long vs short" },
  { id: "order-types", label: "Order types" },
  { id: "leverage", label: "Leverage & margin" },
  { id: "quiz", label: "Quick check" },
];

export default function OrdersAndLeveragePage() {
  return (
    <LearnPageShell topic={topic} toc={TOC}>
      <section>
        <SectionHeading id="long-and-short">Going long vs. going short</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          <strong className="font-semibold text-foreground">Going long</strong> means buying
          something because you think its price will rise, then selling it later at a higher
          price. That&apos;s the direction most people think of by default.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          <strong className="font-semibold text-foreground">Going short</strong> is the reverse:
          you sell first — effectively borrowing the asset and selling it at today&apos;s price —
          with the plan of buying it back later at a lower price and pocketing the difference. It
          feels backwards at first, but it&apos;s just as normal a trade as going long. Most
          brokers and prop firm evaluations let you do either on most instruments.
        </p>
      </section>

      <KeyTakeaways
        items={[
          "Long = buy low, sell high later. Short = sell high first, buy back lower later. Both are normal, ordinary trades.",
          "A market order trades right now at whatever the price is; a limit order waits for your price; a stop order triggers once price reaches a level.",
          "Leverage lets you control a bigger position with less of your own money — it scales losses exactly as much as it scales gains.",
        ]}
      />

      <section>
        <SectionHeading id="order-types">The main order types</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          An &quot;order&quot; is just an instruction to your broker&apos;s platform: buy/sell
          this, this much, under these conditions. Almost every platform offers the same handful
          of order types.
        </p>
        <div className="mt-6">
          <DefinitionGrid
            items={[
              {
                term: "Market order",
                definition: "Buy or sell immediately at the best available current price. Fast, but you don't control the exact price you get.",
              },
              {
                term: "Limit order",
                definition: "Only fill at your chosen price or better. Sits and waits — might never fill if price never reaches it.",
              },
              {
                term: "Stop order",
                definition: "Becomes a market order once price reaches your trigger level. Commonly used for stop-losses (see part 7).",
              },
              {
                term: "Stop-limit order",
                definition: "Like a stop order, but once triggered it becomes a limit order instead of a market order — more price control, more risk of not filling at all.",
              },
              {
                term: "Trailing stop",
                definition: "A stop order that automatically moves with price in your favour, locking in gains as a trade works out, without needing to adjust it by hand.",
              },
              {
                term: "Take-profit",
                definition: "A pre-set order to close a winning trade automatically once it reaches a target price — the mirror of a stop-loss.",
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <ExampleBox>
            <p>
              Price is at $100 and you think it&apos;ll dip to $98 before continuing up. Instead
              of buying now, you place a limit order to buy at $98. If price gets there, you&apos;re
              filled automatically — if it never dips that low, you simply never enter.
            </p>
          </ExampleBox>
        </div>
      </section>

      <section>
        <SectionHeading id="leverage">Leverage and margin</SectionHeading>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          <strong className="font-semibold text-foreground">Leverage</strong> means trading a
          position bigger than the cash you actually put up, using borrowed exposure from your
          broker. &quot;50:1 leverage&quot; means a $1,000 deposit can control a $50,000
          position. The cash you put up is called your{" "}
          <strong className="font-semibold text-foreground">margin</strong>.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          Leverage doesn&apos;t change how much the underlying price moves — it changes how much
          that move is worth to <em>you</em>. A 1% move on a leveraged position is a 1% move on
          the full position size, not on your margin — so against 50:1 leverage, a 1% adverse move
          is roughly a 50% hit to your margin. That cuts exactly the same way on the upside.
        </p>

        <div className="mt-6">
          <LeverageMarginExplainer />
        </div>

        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          This is the single most common way new traders lose more than they expected to — not
          because leverage is a trick, but because it&apos;s easy to size a position by how much
          margin it uses rather than by how much you&apos;d actually lose if it goes wrong. Part 7
          is entirely about fixing that habit before it costs anything.
        </p>
      </section>

      <MiniQuiz
        id="quiz"
        question="You place a limit order to buy at $45 while the price is currently $50. What happens?"
        options={[
          "It fills immediately at $50",
          "It waits and only fills if price drops to $45 or lower",
          "It's automatically rejected",
          "It fills at the average of $45 and $50",
        ]}
        correctIndex={1}
        explanation="A limit order only fills at your price or better — it sits unfilled until the market actually reaches $45 (or lower), if it ever does."
      />
    </LearnPageShell>
  );
}
