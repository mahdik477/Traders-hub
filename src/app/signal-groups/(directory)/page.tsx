import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import SignalGroupDirectory from "@/components/SignalGroupDirectory";
import SignalGroupRiskDisclaimer from "@/components/SignalGroupRiskDisclaimer";
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
  {
    q: "What do I see if I open a group?",
    a: "That group's page: its description, market, price, language, member count and a Join button for its Telegram chat. If no description was recorded, the page uses a short summary built only from those listing fields. We still do not score results.",
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

      <SignalGroupRiskDisclaimer className="mt-10" />
    </>
  );
}
