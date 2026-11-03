import BrokerCategoryEmpty from "@/components/BrokerCategoryEmpty";
import BrokerCategoryNav from "@/components/BrokerCategoryNav";
import BrokerDirectory from "@/components/BrokerDirectory";
import CfdBrokerPair from "@/components/CfdBrokerPair";
import { sortBrokers } from "@/lib/broker-filters";
import { brokers } from "@/lib/brokers";
import {
  BROKER_CATEGORY_LABELS,
  BROKER_CATEGORY_ORDER,
  type BrokerCategory,
} from "@/lib/broker-types";
import { getSection } from "@/lib/sections";

const faqs = [
  {
    q: "Why do fees for the same broker differ?",
    a: "Most of these brands are several companies. The one that holds your account depends on where you live, and that company sets the spread, the leverage cap and which regulator applies. Treat every figure here as a starting point and confirm it on the broker's own site.",
  },
  {
    q: "Do you rank brokers by results?",
    a: "No. Tradox is a directory. We do not score win rate, accuracy or returns. Trustpilot numbers are that site's review scores, shown with a link back to the source.",
  },
  {
    q: "Where does Visit broker go?",
    a: "For now it opens the broker's official homepage. If an affiliate link is added later, it lives in one field on that broker's listing and the button uses it automatically. The footer explains when a link may earn us a commission.",
  },
];

export default function BrokersBrowse({ category }: { category: BrokerCategory }) {
  const section = getSection("brokers");
  const listed = sortBrokers(
    brokers.filter((b) => b.category === category),
    "name",
  );
  const counts = Object.fromEntries(
    BROKER_CATEGORY_ORDER.map((id) => [id, brokers.filter((b) => b.category === id).length]),
  ) as Record<BrokerCategory, number>;
  const regulatorCount = new Set(listed.flatMap((b) => b.regulators.map((r) => r.regulator))).size;
  const showPair = category === "cfd" && listed.length > 0;

  return (
    <>
      <h1 className="title-rule page-title">{section.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{section.summary}</p>

      <BrokerCategoryNav active={category} counts={counts} />

      {listed.length > 0 && (
        <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <Fact value={String(listed.length)} label={listed.length === 1 ? "Broker listed" : "Brokers listed"} />
          <Fact value={String(regulatorCount)} label="Regulator names on file" />
          <Fact value="Not scored" label="Trading results" />
        </dl>
      )}

      <section aria-label={BROKER_CATEGORY_LABELS[category]}>
        {showPair ? (
          <CfdBrokerPair brokers={listed} />
        ) : listed.length === 0 ? (
          <BrokerCategoryEmpty category={category} />
        ) : (
          <div className="mt-8">
            <BrokerDirectory brokers={listed} />
          </div>
        )}
      </section>

      {showPair && (
        <section aria-labelledby="broker-faq-heading" className="mt-14 max-w-2xl border-t border-border pt-8">
          <h2 id="broker-faq-heading" className="section-title">
            How to read this page
          </h2>
          <div className="mt-4 divide-y divide-border">
            {faqs.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span aria-hidden="true" className="text-muted transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground">{value}</dd>
    </div>
  );
}
