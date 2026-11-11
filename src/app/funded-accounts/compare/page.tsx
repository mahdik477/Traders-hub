import type { Metadata } from "next";
import PropFirmCompare from "@/components/PropFirmCompare";
import PropFirmNotes from "@/components/PropFirmNotes";
import { propFirms } from "@/lib/propfirms";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Compare prop firms",
  description:
    "Put up to three prop firm plans side by side: price, profit target, loss limits, drawdown type, profit split and rules.",
};

export default function ComparePropFirmsPage() {
  const currencies = [...new Set(propFirms.map((f) => f.currency))];
  return (
    <>
      <PageIntro
        eyebrow="Prop firm tools"
        back={{ href: "/funded-accounts", label: "All firms" }}
        title={<>Compare prop firms</>}
        lede={<>Up to three plans side by side — price, targets, loss limits and the rules behind them, all
        from each firm&apos;s own pricing page. Change the plan or account size in any column. We don&apos;t
        rank firms or verify trading results.</>}
      />
      <div className="mt-6">
        <PropFirmNotes currencies={currencies} />
      </div>
      <PropFirmCompare firms={propFirms} />
    </>
  );
}
