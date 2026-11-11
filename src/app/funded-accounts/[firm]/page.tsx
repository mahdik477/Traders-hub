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

  return (
    <>
      <BackToFirmsLink />

      <TrackView kind="firm" id={firm.id} />
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <FirmBadge name={firm.name} logo={firm.logo} logoBg={firm.logoBg} size="lg" />
        <h1 className="page-title flex-1">{firm.name}</h1>
        <SaveButton kind="firm" id={firm.id} name={firm.name} variant="label" />
      </div>
      {firm.nameNote && <p className="meta mt-3 max-w-3xl">{firm.nameNote}</p>}
      {firm.reviewAlert && <PropFirmReviewAlert alert={firm.reviewAlert} />}

      {(firm.about || firm.aboutNote) && (
        <section
          aria-labelledby="about-heading"
          className="mt-8 max-w-3xl rounded-xl border border-border bg-surface p-5"
        >
          <h2 id="about-heading" className="section-title">
            About
          </h2>
          {firm.about && <p className="mt-2 text-muted">{firm.about}</p>}
          {firm.aboutNote && <p className="mt-3 text-xs italic text-subtle">{firm.aboutNote}</p>}
        </section>
      )}

      {firm.reviews && <PropFirmReviews reviews={firm.reviews} />}

      <AlertOptIn firmId={firm.id} firmName={firm.name} />

      <section aria-labelledby="pricing-heading" className="mt-12">
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
