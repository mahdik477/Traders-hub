import Link from "next/link";
import BrokerAccordion from "@/components/BrokerAccordion";
import BrokerBackLink from "@/components/BrokerBackLink";
import BrokerLogo from "@/components/BrokerLogo";
import BrokerShowMore from "@/components/BrokerShowMore";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import SaveButton from "@/components/SaveButton";
import ScrollReveal from "@/components/ScrollReveal";
import TrackView from "@/components/TrackView";
import StickyVisitBar from "@/components/StickyVisitBar";
import VisitSiteLink from "@/components/VisitSiteLink";
import { depositLine, marketLine } from "@/lib/broker-facts";
import { leverageLabel } from "@/lib/broker-filters";
import {
  BROKER_CATEGORY_LABELS,
  BROKER_CATEGORY_PATHS,
  brokerOutboundUrl,
  type BrokerView,
  type CostRow,
} from "@/lib/broker-types";
import { PLATFORMS } from "@/lib/platforms";

export default function BrokerProfile({ broker }: { broker: BrokerView }) {
  const visitHref = brokerOutboundUrl(broker);
  const deposit = depositLine(broker);
  const leverage = leverageLabel(broker);

  return (
    <article className="pb-28">
      <TrackView kind="broker" id={broker.id} />
      <header>
        <BrokerBackLink />
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <BrokerLogo name={broker.name} logo={broker.logo} logoBg={broker.logoBg} size="md" priority />
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="page-title">{broker.name}</h1>
              {broker.ourChoice && <OurChoiceBadge compact />}
            </div>
            <p className="meta mt-3">
              <Link href={BROKER_CATEGORY_PATHS[broker.category]} className="hover:text-foreground hover:underline">
                {BROKER_CATEGORY_LABELS[broker.category]}
              </Link>
              {broker.founded != null && <span> · Since {broker.founded}</span>}
            </p>
            {broker.ourChoice && (
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
                Listed first among the CFD brokers. This is not a score of trading results, and it is not a
                recommendation to open an account.
              </p>
            )}
            {broker.tagline && <p className="mt-4 max-w-xl text-base leading-7 text-muted">{broker.tagline}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <SaveButton kind="broker" id={broker.id} name={broker.name} variant="label" className="w-full sm:w-auto" />
            {visitHref && (
              <VisitSiteLink href={visitHref} firmName={broker.name} label="Visit broker" className="w-full sm:w-auto" />
            )}
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-3 border-y border-border">
          <Stat label="Min. deposit" value={deposit} />
          <Stat label="Leverage" value={leverage} ruled />
          <Stat label="Regulators" value={broker.regulators.length ? String(broker.regulators.length) : "None listed"} ruled />
        </dl>
      </header>

      {broker.about && (
        <ScrollReveal className="mt-24 sm:mt-32">
          <section aria-labelledby="overview-heading" className="max-w-2xl scroll-mt-28">
            <h2 id="overview-heading" className="broker-heading text-xl font-semibold tracking-tight">
              Overview
            </h2>
            <div className="mt-6">
              <BrokerShowMore text={broker.about} />
            </div>
            {broker.markets.length > 0 && (
              <p className="mt-6 text-sm leading-6 text-muted">
                <span className="font-medium text-foreground">Markets named. </span>
                {marketLine(broker)}
              </p>
            )}
            {broker.headquarters && (
              <p className="mt-3 text-sm leading-6 text-muted">
                <span className="font-medium text-foreground">Headquarters. </span>
                {broker.headquarters}
              </p>
            )}
            {broker.trustpilot && (
              <p className="mt-6 text-sm leading-6 text-muted">
                Trustpilot {broker.trustpilot.rating.toFixed(1)} / 5
                {broker.trustpilot.reviewCount != null &&
                  ` · ${broker.trustpilot.reviewCount.toLocaleString("en-US")} reviews`}
                {broker.trustpilot.url && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={broker.trustpilot.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                      Source
                    </a>
                  </>
                )}
                . Trustpilot&apos;s review score. It is not a measure of trading results.
              </p>
            )}
          </section>
        </ScrollReveal>
      )}

      {(broker.regulators.length > 0 || broker.companyRegistration) && (
        <ScrollReveal className="mt-24 sm:mt-32">
          <section aria-labelledby="regulation-heading" className="max-w-2xl scroll-mt-28">
            <h2 id="regulation-heading" className="broker-heading text-xl font-semibold tracking-tight">
              {broker.regulators.length > 0 ? "Regulation" : "Registration"}
            </h2>
            {broker.companyRegistration && (
              <p className="mt-6 text-sm leading-6 text-foreground">Company registration: {broker.companyRegistration}</p>
            )}
            {broker.regulators.length > 0 && (
              <ul className="mt-6 border-t border-border">
                {broker.regulators.map((regulator) => (
                  <li
                    key={`${regulator.regulator}-${regulator.country}-${regulator.entity ?? ""}`}
                    className="grid gap-1 border-b border-border py-4 sm:grid-cols-[14rem_1fr] sm:items-baseline sm:gap-8"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {regulator.regulator}
                      <span className="ml-2 font-normal text-subtle">{regulator.country}</span>
                    </p>
                    {regulator.entity && <p className="text-sm leading-6 text-muted">{regulator.entity}</p>}
                  </li>
                ))}
              </ul>
            )}
            {broker.regulatorsNote && (
              <BrokerAccordion title="How the licences differ">{broker.regulatorsNote}</BrokerAccordion>
            )}
          </section>
        </ScrollReveal>
      )}

      {broker.plans.length > 0 && (
        <ScrollReveal className="mt-24 sm:mt-32">
          <section aria-labelledby="accounts-heading" className="max-w-2xl scroll-mt-28">
            <h2 id="accounts-heading" className="broker-heading text-xl font-semibold tracking-tight">
              Accounts
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Open an account type to read the note from its listing. Prices and rules change, and they depend on
              where you live.
            </p>
            <div className="mt-6 border-t border-border">
              {broker.plans.map((plan) => (
                <BrokerAccordion key={plan.name} title={plan.name} meta={plan.price}>
                  {plan.billingNote ?? "No further note in the listing."}
                </BrokerAccordion>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {broker.platforms.length > 0 && (
        <ScrollReveal className="mt-24 sm:mt-32">
          <section aria-labelledby="platforms-heading" className="max-w-2xl scroll-mt-28">
            <h2 id="platforms-heading" className="broker-heading text-xl font-semibold tracking-tight">
              Platforms
            </h2>
            <ul className="mt-6 border-t border-border">
              {broker.platforms.map((name) => {
                const info = PLATFORMS[name];
                return (
                  <li key={name} className="flex items-center justify-between gap-4 border-b border-border py-3.5">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    {info && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-2 hover:text-foreground"
                      >
                        Site
                        <span className="sr-only"> for {name}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </ScrollReveal>
      )}

      {(broker.costs.length > 0 || broker.otherFees.length > 0 || broker.leverage.length > 0) && (
        <ScrollReveal className="mt-24 sm:mt-32">
          <section aria-labelledby="fees-heading" className="max-w-2xl scroll-mt-28">
            <h2 id="fees-heading" className="broker-heading text-xl font-semibold tracking-tight">
              Fees and leverage
            </h2>
            {broker.costsNote && <p className="mt-4 text-sm leading-6 text-muted">{broker.costsNote}</p>}
            <p className="mt-4 border-l border-border-strong pl-4 text-sm leading-6 text-foreground">
              <span className="font-semibold">Risk warning. </span>
              {broker.leverageNote}
            </p>
            <div className="mt-6 border-t border-border">
              {broker.costs.map((group) => (
                <BrokerAccordion key={group.title} title={group.title}>
                  <FeeRows rows={group.rows} />
                </BrokerAccordion>
              ))}
              {broker.leverage.length > 0 && (
                <BrokerAccordion title="Leverage by product">
                  <FeeRows rows={broker.leverage.map((row) => ({ label: row.market, value: row.value, note: row.note }))} />
                </BrokerAccordion>
              )}
              {broker.otherFees.length > 0 && (
                <BrokerAccordion title="Other fees">
                  <FeeRows rows={broker.otherFees} />
                </BrokerAccordion>
              )}
              {broker.promotions && (
                <BrokerAccordion title="Published offer">
                  {broker.promotions} Offers change often and depend on where you live. Check the broker&apos;s site
                  before you rely on one.
                </BrokerAccordion>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal className="mt-24 sm:mt-32">
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Fees, leverage and offers change often and can depend on where you live. We last checked these figures
          against the broker&apos;s own pages and the notes in its data file. Confirm them there before you open an
          account.
        </p>
      </ScrollReveal>

      <StickyVisitBar
        courseName={broker.name}
        logo={broker.logo}
        logoBg={broker.logoBg}
        price={broker.minDeposit != null ? `Min. deposit ${deposit}` : deposit}
        visitHref={visitHref}
        visitLabel="Visit broker"
        wideLogo
        quiet
      />
    </article>
  );
}

function Stat({ label, value, ruled = false }: { label: string; value: string; ruled?: boolean }) {
  return (
    <div className={`min-w-0 px-3 py-5 first:pl-0 last:pr-0 sm:px-6 sm:first:pl-0 ${ruled ? "border-l border-border" : ""}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 text-sm font-semibold leading-5 text-foreground sm:text-base">{value}</dd>
    </div>
  );
}

function FeeRows({ rows }: { rows: CostRow[] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="text-foreground">{row.label}</dt>
          <dd>
            <p className="font-medium text-foreground">{row.value}</p>
            {row.note && <p className="mt-1 text-[13px] leading-5">{row.note}</p>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
