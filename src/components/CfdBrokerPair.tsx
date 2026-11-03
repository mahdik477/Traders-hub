import type { ReactNode } from "react";
import Link from "next/link";
import BrokerLogo from "@/components/BrokerLogo";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import TrustpilotStars from "@/components/TrustpilotStars";
import { leverageLabel } from "@/lib/broker-filters";
import { formatDeposit, type BrokerView } from "@/lib/broker-types";

/**
 * The CFD tab is a permanent pair: VT Markets, then PU Prime. Two large
 * cards, not a filterable grid.
 */
export default function CfdBrokerPair({ brokers }: { brokers: BrokerView[] }) {
  return (
    <div className="mt-8">
      <ul className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
        {brokers.map((broker, index) => (
          <CfdBrokerCard key={broker.id} broker={broker} priority={index === 0} />
        ))}
      </ul>
      <p className="meta mt-4 max-w-2xl">
        These are the only CFD brokers listed. Our choice puts VT Markets first. It is not a score
        of trading results, and it is not a recommendation to open an account. Trustpilot figures
        are that site&apos;s review scores, not a measure of trading results. Leverage on a card is
        the highest figure the broker advertises. It increases losses, and the cap you get depends
        on where you live.
      </p>
    </div>
  );
}

function CfdBrokerCard({ broker, priority }: { broker: BrokerView; priority: boolean }) {
  const deposit = formatDeposit(broker.minDeposit, broker.currency);
  const regulators = broker.regulators.map((r) => r.regulator).join(", ");
  const href = `/brokers/${broker.id}`;

  return (
    <li className="broker-card lift-card group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <div className="flex flex-col gap-4">
        <BrokerLogo name={broker.name} logo={broker.logo} logoBg={broker.logoBg} size="lg" priority={priority} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{broker.name}</h2>
            {broker.ourChoice && <OurChoiceBadge />}
          </div>
          {broker.founded != null && <p className="meta mt-1">Since {broker.founded}</p>}
          {broker.trustpilot && (
            <div className="relative z-10 mt-1 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
              <TrustpilotStars rating={broker.trustpilot} size="sm" />
            </div>
          )}
        </div>
      </div>

      {broker.tagline && (
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{broker.tagline}</p>
      )}

      <div className="mt-5 flex flex-1 flex-col justify-end">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
          <Fact label="Min. deposit">{deposit ?? "Varies"}</Fact>
          <Fact label="Leverage">{leverageLabel(broker)}</Fact>
          <Fact label="Regulators" wide>
            {regulators || "None listed"}
          </Fact>
          <Fact label="Platforms" wide>
            {broker.platforms.length ? broker.platforms.join(", ") : "Not listed"}
          </Fact>
        </dl>

        <div className="mt-5 flex items-center justify-end">
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground after:absolute after:inset-0"
          >
            View details
            <span className="sr-only"> for {broker.name}</span>
            <span
              aria-hidden="true"
              className="ml-1 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transform-none"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </li>
  );
}

function Fact({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`bg-surface px-4 py-3 ${wide ? "col-span-2" : ""}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-snug text-foreground">{children}</dd>
    </div>
  );
}
