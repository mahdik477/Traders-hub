import type { JSX, ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brokers, getBroker } from "@/lib/brokers";
import { BROKER_MARKET_LABELS, formatDeposit, type CostRow } from "@/lib/broker-types";
import { getSection } from "@/lib/sections";
import CoursePricing from "@/components/CoursePricing";
import PlatformPill from "@/components/PlatformPill";
import StickyVisitBar from "@/components/StickyVisitBar";
import TrustpilotStars from "@/components/TrustpilotStars";
import VisitSiteLink from "@/components/VisitSiteLink";
import {
  ChevronLeftIcon,
  InfoIcon,
  LayersIcon,
  MonitorIcon,
  ShieldIcon,
  TagIcon,
} from "@/components/icons";

// One page per broker data file, e.g. /brokers/interactive-brokers. Built
// ahead of time; any other address shows "not found". Layout follows the
// course detail page (hero, quick stats, sections with icon headings,
// sticky CTA) with broker-specific sections: regulation, costs, leverage.
export const dynamicParams = false;

export function generateStaticParams() {
  return brokers.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: PageProps<"/brokers/[id]">): Promise<Metadata> {
  const broker = getBroker((await params).id);
  if (!broker) return {};
  return {
    title: `${broker.name} — ${getSection("brokers").title}`,
    description: broker.tagline ?? undefined,
  };
}

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="section-title flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  );
}

function Stat({ label, value, color = "text-accent" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// A label / value / note list — a table on wide screens, stacked rows on a
// phone so nothing needs sideways scrolling.
function CostTable({ rows }: { rows: CostRow[] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-muted">{row.label}</dt>
          <dd>
            <div className="font-semibold text-foreground">{row.value}</div>
            {row.note && <p className="meta mt-1">{row.note}</p>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BrokerPage({ params }: PageProps<"/brokers/[id]">) {
  const broker = getBroker((await params).id);
  if (!broker) notFound();

  const visitHref = broker.affiliateLink ?? broker.website;
  const deposit = formatDeposit(broker.minDeposit, broker.currency);

  return (
    <>
      <Link href="/brokers" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeftIcon className="size-4" />
        Back to brokers
      </Link>

      {/* Hero */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-glow sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {broker.logo ? (
            <div
              className={`flex size-20 shrink-0 items-center justify-center rounded-xl p-3 shadow-sm sm:size-24 ${
                broker.logoBg === "dark" ? "bg-black" : "bg-white"
              }`}
            >
              <Image
                src={broker.logo}
                alt={`${broker.name} logo`}
                width={96}
                height={96}
                className="h-auto max-h-14 w-full object-contain sm:max-h-16"
                priority
              />
            </div>
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl font-bold text-accent sm:size-24">
              {broker.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="page-title">{broker.name}</h1>
            {broker.tagline && <p className="mt-2 max-w-2xl text-base text-muted">{broker.tagline}</p>}
            {broker.trustpilot && (
              <div className="mt-3">
                <TrustpilotStars rating={broker.trustpilot} />
              </div>
            )}
          </div>
          {visitHref && <VisitSiteLink href={visitHref} firmName={broker.name} className="shrink-0 sm:self-start" />}
        </div>

        {/* Quick stats */}
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-4">
          {deposit && <Stat label="Min. deposit" value={deposit} />}
          {broker.regulators.length > 0 && <Stat label="Regulators" value={String(broker.regulators.length)} />}
          {broker.founded && <Stat label="Founded" value={String(broker.founded)} />}
          {broker.trustpilot && (
            <Stat label="Trustpilot" value={`${broker.trustpilot.rating.toFixed(1)}/5`} color="text-warning" />
          )}
        </div>
      </div>

      {broker.about && (
        <section aria-labelledby="about-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="about-heading" icon={InfoIcon}>
            About
          </SectionHeading>
          <p className="mt-3 text-muted">{broker.about}</p>
          {broker.headquarters && <p className="meta mt-3">Headquarters: {broker.headquarters}</p>}
          {broker.markets.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Markets you can trade">
              {broker.markets.map((m) => (
                <li key={m} className="pill">
                  {BROKER_MARKET_LABELS[m]}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {broker.plans.length > 0 && (
        <section aria-labelledby="plans-heading" className="mt-10">
          <SectionHeading id="plans-heading" icon={LayersIcon}>
            Account plans
          </SectionHeading>
          <div className="mt-4">
            <CoursePricing tiers={broker.plans} courseName={broker.name} visitHref={visitHref} />
          </div>
        </section>
      )}

      {broker.costs.length > 0 && (
        <section aria-labelledby="costs-heading" className="mt-10">
          <SectionHeading id="costs-heading" icon={TagIcon}>
            Commissions &amp; spreads
          </SectionHeading>
          {broker.costsNote && <p className="meta mt-2 max-w-2xl">{broker.costsNote}</p>}
          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {broker.costs.map((group) => (
              <div key={group.title} className="overflow-hidden rounded-xl border border-border bg-surface">
                <h3 className="border-b border-border bg-surface-2 px-5 py-3 font-semibold">{group.title}</h3>
                <CostTable rows={group.rows} />
              </div>
            ))}
          </div>
        </section>
      )}

      {(broker.leverage.length > 0 || broker.marginRates) && (
        <section aria-labelledby="leverage-heading" className="mt-10">
          <SectionHeading id="leverage-heading" icon={LayersIcon}>
            Leverage &amp; margin
          </SectionHeading>
          <p className="mt-3 max-w-3xl rounded-lg border border-warning/30 bg-warning/8 p-3 text-sm text-foreground">
            <span className="font-semibold text-warning">Risk warning: </span>
            {broker.leverageNote}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {broker.leverage.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <h3 className="border-b border-border bg-surface-2 px-5 py-3 font-semibold">Maximum leverage</h3>
                <CostTable
                  rows={broker.leverage.map((l) => ({ label: l.market, value: l.value, note: l.note }))}
                />
              </div>
            )}

            {broker.marginRates && (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <h3 className="border-b border-border bg-surface-2 px-5 py-3 font-semibold">
                  Margin interest rates
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="eyebrow px-5 py-3 font-semibold">
                        Amount borrowed
                      </th>
                      {broker.marginRates.columns.map((c) => (
                        <th key={c} scope="col" className="eyebrow px-3 py-3 text-right font-semibold last:pr-5">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {broker.marginRates.rows.map((row) => (
                      <tr key={row.tier}>
                        <th scope="row" className="px-5 py-3 text-left font-medium text-muted">
                          {row.tier}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={i} className="px-3 py-3 text-right font-semibold tabular-nums last:pr-5">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {broker.marginRates.note && (
                  <p className="meta border-t border-border px-5 py-3">{broker.marginRates.note}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {broker.otherFees.length > 0 && (
        <section aria-labelledby="fees-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="fees-heading" icon={TagIcon}>
            Other fees
          </SectionHeading>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            <CostTable rows={broker.otherFees} />
          </div>
        </section>
      )}

      {broker.regulators.length > 0 && (
        <section aria-labelledby="regulation-heading" className="mt-10">
          <SectionHeading id="regulation-heading" icon={ShieldIcon}>
            Regulation
          </SectionHeading>
          {broker.regulatorsNote && <p className="meta mt-2 max-w-2xl">{broker.regulatorsNote}</p>}
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {broker.regulators.map((r) => (
              <li key={`${r.regulator}-${r.country}`} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{r.regulator}</span>
                  <span className="pill">{r.country}</span>
                </div>
                {r.entity && <p className="meta mt-1">{r.entity}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {broker.platforms.length > 0 && (
        <section aria-labelledby="platforms-heading" className="mt-10">
          <SectionHeading id="platforms-heading" icon={MonitorIcon}>
            Trading platforms
          </SectionHeading>
          <ul className="mt-4 flex flex-wrap gap-2">
            {broker.platforms.map((p) => (
              <li key={p}>
                <PlatformPill name={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="meta mt-10 max-w-3xl">
        Fees, rates and leverage limits change often and can depend on where you live. We last
        checked this broker&apos;s figures against its own website — always confirm them there
        before opening an account.
      </p>

      {visitHref && (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-accent/30 bg-accent/6 p-8 text-center">
          <h2 className="text-xl font-semibold">Ready to take a closer look?</h2>
          <p className="max-w-md text-sm text-muted">
            Visit {broker.name}&apos;s own site for full terms, current pricing and to open an account.
          </p>
          <VisitSiteLink href={visitHref} firmName={broker.name} className="mt-1" />
        </div>
      )}

      <StickyVisitBar
        courseName={broker.name}
        logo={broker.logo}
        logoBg={broker.logoBg}
        price={deposit ? `Min. deposit ${deposit}` : null}
        visitHref={visitHref}
      />
    </>
  );
}
