import BrokerAccordion from "@/components/BrokerAccordion";
import BrokerCategoryEmpty from "@/components/BrokerCategoryEmpty";
import BrokerCategoryNav from "@/components/BrokerCategoryNav";
import BrokerCompare from "@/components/BrokerCompare";
import BrokerDirectory from "@/components/BrokerDirectory";
import CfdBrokerPair from "@/components/CfdBrokerPair";
import ScrollReveal from "@/components/ScrollReveal";
import { sortBrokers } from "@/lib/broker-filters";
import { brokers } from "@/lib/brokers";
import { BROKER_CATEGORY_DESCRIPTIONS, BROKER_CATEGORY_LABELS, type BrokerCategory } from "@/lib/broker-types";
import { SITE_NAME, getSection } from "@/lib/sections";
import PageIntro from "@/components/PageIntro";

const DIRECTORY_RISK = `${SITE_NAME} is a discovery and comparison platform for informational purposes only. We do not verify trading performance, accuracy or results, and nothing on this site is financial advice.`;

const CFD_RISK =
  "These are the only CFD brokers listed. Our choice puts VT Markets first. It is not a score of trading results, and it is not a recommendation to open an account. Trustpilot figures are that site's review scores, not a measure of trading results. Leverage on a card is the highest figure the broker advertises. It increases losses, and the cap you get depends on where you live.";

const faqs = [
  {
    q: "Why do fees for the same broker differ?",
    a: "Most of these brands are several companies. The one that holds your account depends on where you live, and that company sets the spread, the leverage cap and which regulator applies. Treat every figure here as a starting point and confirm it on the broker's own site.",
  },
  {
    q: "Do you rank brokers by results?",
    a: "No. Tradox is a directory. We do not score win rate, accuracy or returns. Trustpilot numbers are that site's review scores, shown with a link back to the source.",
  },
];

const AFFILIATE =
  "Visit broker opens that broker's site in a new tab. When the listing has an affiliate link, the button uses it, and we may earn a commission if you sign up. It costs you nothing extra. The footer says the same.";

export default function BrokersBrowse({ category }: { category: BrokerCategory }) {
  const section = getSection("brokers");
  const listed = sortBrokers(
    brokers.filter((broker) => broker.category === category),
    "name",
  );
  const showPair = category === "cfd" && listed.length > 0;

  return (
    <div className="pb-8">
      <PageIntro eyebrow="Trade your own money" title={section.title} lede={BROKER_CATEGORY_DESCRIPTIONS[category]} />

      <div className="mt-8 rounded-lg bg-surface-2 px-4 py-4 sm:px-5">
        <p className="text-[13px] leading-6 text-muted">{showPair ? CFD_RISK : DIRECTORY_RISK}</p>
      </div>

      <BrokerCategoryNav active={category} />

      <section aria-label={BROKER_CATEGORY_LABELS[category]} className="mt-16 sm:mt-20">
        {showPair ? (
          <CfdBrokerPair brokers={listed} />
        ) : listed.length === 0 ? (
          <BrokerCategoryEmpty category={category} />
        ) : (
          <BrokerDirectory brokers={listed} />
        )}
      </section>

      {showPair && (
        <ScrollReveal className="mt-24 sm:mt-32">
          <BrokerCompare brokers={listed} />
        </ScrollReveal>
      )}

      <ScrollReveal className="mt-24 sm:mt-32 max-w-2xl">
        <section aria-labelledby="how-we-pick-heading">
          <h2 id="how-we-pick-heading" className="broker-heading text-xl font-semibold tracking-tight">
            How we pick brokers
          </h2>
          {showPair && (
            <p className="mt-4 text-base leading-7 text-muted">
              Our choice puts VT Markets first. It is not a score of trading results, and it is not a
              recommendation to open an account.
            </p>
          )}
          <h3 className="mt-10 text-sm font-semibold text-foreground">Affiliate disclosure</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{AFFILIATE}</p>
          <div className="mt-8 border-t border-border">
            {faqs.map((item) => (
              <BrokerAccordion key={item.q} title={item.q}>
                {item.a}
              </BrokerAccordion>
            ))}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
