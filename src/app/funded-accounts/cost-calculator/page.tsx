import type { Metadata } from "next";
import ChallengeCostCalculator from "@/components/ChallengeCostCalculator";
import PropFirmToolbar from "@/components/PropFirmToolbar";
import { propFirms } from "@/lib/propfirms";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Challenge cost calculator",
  description:
    "Add up the real cost of a prop firm challenge: the fee, extra attempts or months, resets, activation fee and monthly extras. Costs only — no profit or payout estimates.",
};

export default function CostCalculatorPage() {
  return (
    <>
      <PageIntro
        eyebrow="Prop firm tools"
        back={{ href: "/funded-accounts", label: "All firms" }}
        title={<>Challenge cost calculator</>}
        lede={<>The headline price is rarely the whole bill. Pick a plan, then add the things that only show up at
        checkout or in the FAQ — resets, an activation fee, data feeds, a second attempt — and see the total.
        It&apos;s a cost sum, not a forecast.</>}
      />
      <div className="mt-6">
        <PropFirmToolbar current="/funded-accounts/cost-calculator" />
      </div>
      <ChallengeCostCalculator firms={propFirms} />
    </>
  );
}
