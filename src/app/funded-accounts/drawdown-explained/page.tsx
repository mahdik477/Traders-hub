import type { Metadata } from "next";
import Link from "next/link";
import DrawdownSimulator from "@/components/DrawdownSimulator";
import PropFirmToolbar from "@/components/PropFirmToolbar";
import { propFirms } from "@/lib/propfirms";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Drawdown explained",
  description:
    "Static, end-of-day trailing and intraday trailing drawdown, shown side by side on the same example account so you can see how each rule behaves.",
};

export default function DrawdownExplainedPage() {
  // How many listed tiers use each kind — real counts from the data, so the
  // page can say "this is the one you'll meet most".
  const counts = { static: 0, "eod-trailing": 0, "intraday-trailing": 0, mixed: 0, unknown: 0 };
  for (const f of propFirms) for (const m of f.markets) for (const c of m.challenges) for (const t of c.tiers) counts[t.drawdownKind] += 1;

  return (
    <>
      <PageIntro
        eyebrow="Prop firm tools"
        back={{ href: "/funded-accounts", label: "All firms" }}
        title={<>Drawdown, explained on a chart</>}
        lede={<>&ldquo;Max loss&rdquo; sounds like one number, but <em>where the firm draws the line</em> depends on the
        drawdown rule — and it&apos;s the single rule that catches most beginners out. Below, the same made-up
        account runs under all three rules at once.</>}
      />
      <div className="mt-6">
        <PropFirmToolbar current="/funded-accounts/drawdown-explained" />
      </div>

      <div className="mt-8">
        <DrawdownSimulator />
      </div>

      <section className="mt-10 max-w-3xl space-y-4">
        <h2 className="section-title">What to take from it</h2>
        <ul className="list-disc space-y-2 pl-5 text-foreground/90 marker:text-accent">
          <li>
            <strong className="font-semibold">Static</strong> is the easiest to live with: the floor never moves,
            so a drawdown after a good run doesn&apos;t punish you twice.
          </li>
          <li>
            <strong className="font-semibold">End-of-day trailing</strong> ratchets up once a day. Profits raise
            the floor, so the more you make early, the less room you have later — until the floor reaches the
            starting balance, where most firms stop it.
          </li>
          <li>
            <strong className="font-semibold">Intraday trailing</strong> is the strictest: a spike in open profit
            raises the floor immediately, even if you never bank that profit. Giving back gains inside a single
            day can end the account.
          </li>
          <li>
            Across the firms we list, {counts.static} plan tiers describe a static rule, {counts["eod-trailing"]}{" "}
            an end-of-day trailing rule, {counts["intraday-trailing"]} an intraday trailing one, and{" "}
            {counts.mixed} switch between kinds (often trailing during the evaluation, static once funded).
          </li>
        </ul>
        <p className="meta">
          Firms also add daily loss limits, consistency rules and their own exact definitions. This page explains
          the shapes; the{" "}
          <Link href="/funded-accounts" className="text-accent underline">
            pricing tables
          </Link>{" "}
          show each firm&apos;s wording, and{" "}
          <Link href="/funded-accounts/find-my-firm?drawdown=static" className="text-accent underline">
            Find my firm
          </Link>{" "}
          can filter by the kind you&apos;d rather have. This is an educational illustration, not advice and not a
          prediction of how any account would perform.
        </p>
      </section>
    </>
  );
}
