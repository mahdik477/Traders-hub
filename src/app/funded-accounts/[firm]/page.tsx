import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackToFirmsLink, FirmPricingFromFilters } from "@/components/FirmPageFromFilters";
import FirmBadge from "@/components/FirmBadge";
import PropFirmNotes from "@/components/PropFirmNotes";
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
  return {
    title: `${firm.name} — ${getSection("funded-accounts").title}`,
    description: firm.about ?? undefined,
  };
}

export default async function FirmPage({ params }: PageProps<"/funded-accounts/[firm]">) {
  const firm = getPropFirm((await params).firm);
  if (!firm) notFound();

  return (
    <>
      <BackToFirmsLink />

      <div className="mt-5 flex items-center gap-4">
        <FirmBadge name={firm.name} logo={firm.logo} logoBg={firm.logoBg} size="lg" />
        <h1 className="page-title">{firm.name}</h1>
      </div>
      {firm.nameNote && <p className="meta mt-3 max-w-3xl">{firm.nameNote}</p>}

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
