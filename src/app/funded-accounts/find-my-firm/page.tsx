import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import FirmMatcher from "@/components/FirmMatcher";
import PropFirmToolbar from "@/components/PropFirmToolbar";
import { propFirms } from "@/lib/propfirms";

export const metadata: Metadata = {
  title: "Find my firm",
  description:
    "Answer five quick questions — market, account size, budget, drawdown type and country — and see which listed prop firms have a plan that fits, with the reasons.",
};

export default function FindMyFirmPage() {
  return (
    <>
      <Link href="/funded-accounts" className="back-link">
        <ChevronLeftIcon className="size-4" />
        All firms
      </Link>
      <h1 className="page-title mt-5">Find my firm</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Five quick questions. We filter the {propFirms.length} listed firms down to the ones whose published
        plans fit your answers and show you exactly why each one is there. It&apos;s a filter, not a ranking —
        we don&apos;t pick a &ldquo;best&rdquo; firm and we don&apos;t verify trading results.
      </p>
      <div className="mt-6">
        <PropFirmToolbar current="/funded-accounts/find-my-firm" />
      </div>
      <FirmMatcher firms={propFirms} />
      <p className="meta mt-10 max-w-2xl">
        Prices, promotions, rules and country lists change often. Always check the firm&apos;s own website before
        buying. Firms with many recent payout complaints in public reviews carry a warning; those reviews are not
        verified by us.
      </p>
    </>
  );
}
