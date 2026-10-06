import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/sections";

export const metadata: Metadata = { title: "Disclaimer" };

// Draft wording — have this reviewed by a lawyer before launch.
export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="title-rule page-title">Disclaimer</h1>
      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="section-title text-foreground">
            Discovery and information only
          </h2>
          <p className="mt-2">
            {SITE_NAME} is a discovery and comparison platform. Everything on
            this site is for general information only. We are not a broker, a
            signal provider or a financial adviser, and nothing here is
            financial, investment or trading advice.
          </p>
        </section>
        <section>
          <h2 className="section-title text-foreground">
            We do not verify performance
          </h2>
          <p className="mt-2">
            We do not verify, audit or rank the trading performance, accuracy or
            win rate of any firm, group, strategy, course or account listed on
            this site. A listing, badge or ranking is not an endorsement or a
            claim about results.
          </p>
        </section>
        <section>
          <h2 className="section-title text-foreground">
            Trading involves risk
          </h2>
          <p className="mt-2">
            Trading financial products carries a high level of risk and you can
            lose money. Past performance, including any historical or
            hypothetical backtest, does not indicate future results. Do your own
            research and consider independent professional advice before making
            any decision.
          </p>
        </section>
        <section>
          <h2 className="section-title text-foreground">
            How we make money
          </h2>
          <p className="mt-2">
            Some links on this site are affiliate links. If you sign up or buy
            through them, we may earn a commission at no extra cost to you. Some
            listings are sponsored, and these are always clearly labelled.
          </p>
        </section>
      </div>
    </div>
  );
}
