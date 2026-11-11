import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import PropFirmCompare from "@/components/PropFirmCompare";
import PropFirmNotes from "@/components/PropFirmNotes";
import { propFirms } from "@/lib/propfirms";

export const metadata: Metadata = {
  title: "Compare prop firms",
  description:
    "Put up to three prop firm plans side by side: price, profit target, loss limits, drawdown type, profit split and rules.",
};

export default function ComparePropFirmsPage() {
  const currencies = [...new Set(propFirms.map((f) => f.currency))];
  return (
    <>
      <Link href="/funded-accounts" className="back-link">
        <ChevronLeftIcon className="size-4" />
        All firms
      </Link>
      <h1 className="page-title mt-5">Compare prop firms</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Up to three plans side by side — price, targets, loss limits and the rules behind them, all
        from each firm&apos;s own pricing page. Change the plan or account size in any column. We don&apos;t
        rank firms or verify trading results.
      </p>
      <div className="mt-6">
        <PropFirmNotes currencies={currencies} />
      </div>
      <PropFirmCompare firms={propFirms} />
    </>
  );
}
