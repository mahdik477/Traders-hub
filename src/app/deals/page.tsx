import type { Metadata } from "next";
import Link from "next/link";
import DealsList from "@/components/DealsList";
import PropFirmToolbar from "@/components/PropFirmToolbar";
import { collectDeals } from "@/lib/deals";
import { propFirms } from "@/lib/propfirms";

export const metadata: Metadata = {
  title: "Deals & promo codes",
  description:
    "Every active prop firm promo code and discount we've verified, with the discount, an example price and the date we last checked.",
};

export default function DealsPage() {
  const deals = collectDeals(propFirms);
  const withCodes = deals.filter((d) => d.code).length;
  const newest = deals.map((d) => d.lastVerified).filter((d): d is string => !!d).sort().at(-1);

  return (
    <>
      <h1 className="title-rule page-title">Deals &amp; promo codes</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {deals.length} active discounts across {new Set(deals.map((d) => d.firmId)).size} prop firms, {withCodes} of them
        with a code to copy. Each one shows the date we last saw it on the firm&apos;s own pricing page — codes
        expire without notice, so treat that date as the deal&apos;s shelf life.
      </p>
      <div className="mt-6">
        <PropFirmToolbar current="/deals" />
      </div>

      <DealsList deals={deals} />

      <section className="mt-12 max-w-2xl rounded-xl border border-border bg-surface p-5">
        <h2 className="section-title">How this page works</h2>
        <ul className="meta mt-3 list-disc space-y-1.5 pl-5 marker:text-subtle">
          <li>
            The percentage is worked out from the firm&apos;s own full price and discounted price — we don&apos;t
            quote a firm&apos;s marketing claim.
          </li>
          <li>Deals are listed with codes first and then alphabetically, never by how big the discount is.</li>
          <li>
            Some links are affiliate links; we may earn a commission if you buy through them. It never changes the
            price you pay.
          </li>
          <li>
            A discount is not a reason to buy. Check the{" "}
            <Link href="/funded-accounts" className="text-accent underline">
              firm&apos;s rules
            </Link>{" "}
            and{" "}
            <Link href="/funded-accounts/cost-calculator" className="text-accent underline">
              total cost
            </Link>{" "}
            first. We don&apos;t verify trading results or payouts.
          </li>
          {newest && <li>Most recent check across all firms: {newest}.</li>}
        </ul>
      </section>
    </>
  );
}
