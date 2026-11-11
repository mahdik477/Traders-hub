import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import ChallengeCostCalculator from "@/components/ChallengeCostCalculator";
import PropFirmToolbar from "@/components/PropFirmToolbar";
import { propFirms } from "@/lib/propfirms";

export const metadata: Metadata = {
  title: "Challenge cost calculator",
  description:
    "Add up the real cost of a prop firm challenge: the fee, extra attempts or months, resets, activation fee and monthly extras. Costs only — no profit or payout estimates.",
};

export default function CostCalculatorPage() {
  return (
    <>
      <Link href="/funded-accounts" className="back-link">
        <ChevronLeftIcon className="size-4" />
        All firms
      </Link>
      <h1 className="page-title mt-5">Challenge cost calculator</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        The headline price is rarely the whole bill. Pick a plan, then add the things that only show up at
        checkout or in the FAQ — resets, an activation fee, data feeds, a second attempt — and see the total.
        It&apos;s a cost sum, not a forecast.
      </p>
      <div className="mt-6">
        <PropFirmToolbar current="/funded-accounts/cost-calculator" />
      </div>
      <ChallengeCostCalculator firms={propFirms} />
    </>
  );
}
