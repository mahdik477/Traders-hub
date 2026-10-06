import type { Metadata } from "next";
import BrokerDirectory from "@/components/BrokerDirectory";
import { brokers } from "@/lib/brokers";
import { getSection } from "@/lib/sections";

const section = getSection("brokers");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

export default function BrokersPage() {
  return (
    <>
      <h1 className="page-title">{section.title}</h1>
      <p className="mt-3 text-lg text-muted">
        Compare brokers for trading your own money: commissions, spreads, leverage, minimum deposit
        and who regulates them.
      </p>
      <p className="meta mt-3 max-w-2xl">
        Fees and rules change often and can depend on where you live. Always check the
        broker&apos;s own website before opening an account.
      </p>

      <div className="mt-6">
        <BrokerDirectory brokers={brokers} />
      </div>
    </>
  );
}
