import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackToFirmsLink, FirmPricingFromFilters } from "@/components/FirmPageFromFilters";
import FirmBadge from "@/components/FirmBadge";
import PropFirmNotes from "@/components/PropFirmNotes";
import PropFirmReviewAlert from "@/components/PropFirmReviewAlert";
import PropFirmReviews from "@/components/PropFirmReviews";
import SaveButton from "@/components/SaveButton";
import TrackView from "@/components/TrackView";
import AlertOptIn from "@/components/AlertOptIn";
import Link from "next/link";
import { CalculatorIcon, GridIcon, TagIcon } from "@/components/icons";
import { formatDate } from "@/components/PropFirmReviews";
import { defaultPlanFor, plansToQuery } from "@/lib/propfirm-compare";
import { getPropFirm, propFirms } from "@/lib/propfirms";
import { getSection } from "@/lib/sections";

// One page per firm data file, e.g. /funded-accounts/ftmo. Built ahead of
// time; any other address shows "not found".
export const dynamicParams = false;

export function generateStaticParams() {
  return propFirms.map((f) => ({ firm: f.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/funded-accounts/[firm]">): Promise<Metadata> {
  const firm = getPropFirm((await params).firm);
  if (!firm) return {};
  const title = `${firm.name} — ${getSection("funded-accounts").title}`;
  const description = firm.about ?? `${firm.name} prop firm pricing and rules, from its own pricing page.`;
  const image = { url: `/api/og/firm/${firm.id}`, width: 1200, height: 630, alt: `${firm.name} on Tradox` };
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function FirmPage({ params }: PageProps<"/funded-accounts/[firm]">) {
  const firm = getPropFirm((await params).firm);
  if (!firm) notFound();
  const comparePlan = defaultPlanFor(firm);

  return (
    <>
      <BackToFirmsLink />

      <TrackView kind="firm" id={firm.id} />
      <header className="detail-hero mt-5 overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <FirmBadge name={firm.name} logo={firm.logo} logoBg={firm.logoBg} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Prop firm · {firm.markets.map((m) => (m.market === "forex" ? "Forex" : "Futures")).join(" & ")}</p>
            <h1 className="page-title mt-1">{firm.name}</h1>
          </div>
          <SaveButton kind="firm" id={firm.id} name={firm.name} variant="label" />
        </div>
        {firm.nameNote && <p className="meta mt-3 max-w-3xl">{firm.nameNote}</p>}
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {[
            ["Markets", firm.markets.map((m) => (m.market === "forex" ? "Forex" : "Futures")).join(" & ")],
            ["Currency", firm.currency],
            ["Platforms", firm.platforms?.length ? firm.platforms.join(", ") : "—"],
            ["Data checked", firm.lastVerified ? formatDate(firm.lastVerified) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 bg-surface px-4 py-3">
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 truncate font-mono text-sm font-semibold text-foreground" title={value}>{value}</dd>
            </div>
          ))}
        </dl>
      </header>
      {firm.reviewAlert && <PropFirmReviewAlert alert={firm.reviewAlert} />}

      {/* What the firm is (left) and what you can do with it (right). */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="min-w-0 [&>*:first-child]:mt-0 [&>*]:max-w-none">
          {(firm.about || firm.aboutNote) && (
            <section aria-labelledby="about-heading" className="kit-panel p-5 sm:p-6">
              <h2 id="about-heading" className="section-title">
                About
              </h2>
              {firm.about && <p className="mt-2 leading-relaxed text-muted">{firm.about}</p>}
              {firm.aboutNote && <p className="mt-3 text-xs italic text-subtle">{firm.aboutNote}</p>}
            </section>
          )}

          {firm.reviews && <PropFirmReviews reviews={firm.reviews} />}
        </div>

        <aside aria-label={`Tools for ${firm.name}`} className="min-w-0 lg:sticky lg:top-24 [&>section]:mt-4 [&>section]:max-w-none">
          <nav aria-label="Next steps" className="kit-panel p-2">
            <p className="readout px-3 pb-1 pt-3">Next steps</p>
            <a href="#pricing-heading" className="firm-step">
              <span className="icon-chip">
                <TagIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">Pricing and rules</span>
                <span className="block text-xs text-muted">Every plan and account size</span>
              </span>
            </a>
            {comparePlan && (
              <Link href={`/funded-accounts/compare${plansToQuery([comparePlan])}`} className="firm-step">
                <span className="icon-chip">
                  <GridIcon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">Compare with another firm</span>
                  <span className="block text-xs text-muted">Up to 3 plans side by side</span>
                </span>
              </Link>
            )}
            <Link href="/funded-accounts/cost-calculator" className="firm-step">
              <span className="icon-chip">
                <CalculatorIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">Cost calculator</span>
                <span className="block text-xs text-muted">Add up resets and other fees</span>
              </span>
            </Link>
          </nav>
          <AlertOptIn firmId={firm.id} firmName={firm.name} />
        </aside>
      </div>

      <section aria-labelledby="pricing-heading" className="mt-12 scroll-mt-24">
        <h2 id="pricing-heading" className="section-title">
          Pricing and rules
        </h2>
        <div className="mt-4">
          <PropFirmNotes currencies={[firm.currency]} />
        </div>
        <div className="mt-6">
          <FirmPricingFromFilters firm={firm} />
        </div>
      </section>
    </>
  );
}
