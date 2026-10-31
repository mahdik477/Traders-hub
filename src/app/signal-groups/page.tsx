import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, TriangleAlert } from "lucide-react";
import SignalGroupDirectory from "@/components/SignalGroupDirectory";
import SignalGroupsIntro from "@/components/SignalGroupsIntro";
import { signalGroups, signalGroupsLastVerified } from "@/lib/signal-groups";
import { getSection } from "@/lib/sections";
import { SIGNAL_MARKET_ORDER } from "@/lib/signal-group-types";

const section = getSection("signal-groups");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

const faqs = [
  {
    q: "Do you rank signal groups by results?",
    a: "No. This is a directory. We do not score accuracy, returns or how often a group's calls make money. Listed order is a manual rank, then the name. You can also sort by name, member count or category.",
  },
  {
    q: "What does Join open?",
    a: "The group's Telegram chat. That address is the only outbound link on the listing. If a link is an affiliate link, we may earn a commission, which the footer also says.",
  },
  {
    q: "Why might a group be missing?",
    a: "It has not been added yet, or it did not meet the listing rules: no guaranteed-return language, no pressure to deposit more, and a free option or a trial.",
  },
  {
    q: "Are member counts a ranking?",
    a: "No. The number is the approximate count we saw on Telegram on the date printed with it. Counts change, and a larger group is not a better one.",
  },
];

export default function SignalGroupsPage() {
  return (
    <>
      <SignalGroupsIntro
        count={signalGroups.length}
        marketCount={SIGNAL_MARKET_ORDER.length}
        updated={signalGroupsLastVerified}
      />

      <div className="mt-8">
        <SignalGroupDirectory groups={signalGroups} />
      </div>

      <section aria-labelledby="signal-faq-heading" className="mt-16 grid grid-cols-1 gap-6 border-t border-border pt-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 id="signal-faq-heading" className="text-base font-semibold tracking-tight text-foreground">
            How to read this page
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            A directory of Telegram groups. Not a ranking, and not a check of trading results.
          </p>
        </div>
        <div className="divide-y divide-border lg:col-span-8">
          {faqs.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                  />
                </span>
              </summary>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="signal-risk-heading" className="mt-10 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="flex gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 id="signal-risk-heading" className="text-sm font-semibold text-foreground">
              Risk disclaimer
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Signal groups are third-party chats. Tradox lists them so you can find and compare them. We do not
              verify calls, accuracy or results, and a member count is not a measure of quality. Trading involves a
              high level of risk and you can lose money. Joining a group is not financial advice. Some Join links are
              affiliate links, which means we may earn a commission if you sign up.{" "}
              <Link href="/disclaimer" className="font-medium text-foreground underline decoration-border-strong underline-offset-2 hover:text-accent">
                Read the full disclaimer
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
