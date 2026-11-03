import Link from "next/link";
import BrokerLogo from "@/components/BrokerLogo";
import ChoiceBeam from "@/components/ChoiceBeam";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import ScrollReveal from "@/components/ScrollReveal";
import VisitSiteLink from "@/components/VisitSiteLink";
import { cardFacts } from "@/lib/broker-facts";
import { brokerOutboundUrl, type BrokerView } from "@/lib/broker-types";

/**
 * The CFD tab is a pair: VT Markets, then PU Prime. Two equal cards.
 * The visit button uses the listing's affiliate link.
 */
export default function CfdBrokerPair({ brokers }: { brokers: BrokerView[] }) {
  return (
    <ul className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      {brokers.map((broker, index) => (
        <li key={broker.id} className="h-full">
          <ScrollReveal delay={index * 80} className="h-full">
            <ChoiceBeam active={broker.ourChoice}>
              <CfdBrokerCard broker={broker} priority={index === 0} />
            </ChoiceBeam>
          </ScrollReveal>
        </li>
      ))}
    </ul>
  );
}

function CfdBrokerCard({ broker, priority }: { broker: BrokerView; priority: boolean }) {
  const visitHref = brokerOutboundUrl(broker);
  const facts = cardFacts(broker);

  return (
    <article
      className={`broker-panel relative flex h-full cursor-pointer flex-col bg-surface p-6 sm:p-8 ${
        broker.ourChoice ? "rounded-[14px]" : "rounded-2xl border border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <BrokerLogo name={broker.name} logo={broker.logo} logoBg={broker.logoBg} size="md" priority={priority} />
        {broker.ourChoice && <OurChoiceBadge compact />}
      </div>

      <h2 className="broker-heading mt-6 text-2xl font-semibold tracking-tight text-foreground">
        <Link href={`/brokers/${broker.id}`} className="card-stretch rounded-2xl">
          {broker.name}
          <span className="sr-only"> listing</span>
        </Link>
      </h2>
      {broker.tagline && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{broker.tagline}</p>
      )}

      <dl className="mt-8 border-t border-border">
        {facts.map((fact) => (
          <div key={fact.label} className="grid grid-cols-[7.25rem_1fr] gap-4 border-b border-border py-3.5 sm:grid-cols-[8.5rem_1fr]">
            <dt className="text-[13px] leading-5 text-subtle">{fact.label}</dt>
            <dd className="text-sm font-medium leading-5 text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="relative z-10 mt-auto pt-8">
        {visitHref && (
          <VisitSiteLink href={visitHref} firmName={broker.name} label="Visit broker" className="relative z-10 w-full" />
        )}
        <Link
          href={`/brokers/${broker.id}`}
          className="relative z-10 mt-1 flex min-h-11 items-center justify-center text-sm font-medium text-muted hover:text-foreground"
        >
          View listing
          <span className="sr-only"> for {broker.name}</span>
        </Link>
      </div>
    </article>
  );
}
