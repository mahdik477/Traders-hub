import { BROKER_CATEGORY_LABELS, type BrokerCategory } from "@/lib/broker-types";

const COMING_SOON: Record<Exclude<BrokerCategory, "cfd">, string> = {
  stocks:
    "Stock broker listings are on the way. None are published here yet, and this tab will stay empty until a real broker is added.",
  crypto:
    "Crypto exchange listings are on the way. None are published here yet, and this tab will stay empty until a real exchange is added.",
};

export default function BrokerCategoryEmpty({ category }: { category: BrokerCategory }) {
  if (category === "cfd") {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center text-muted">
        No CFD brokers are listed.
      </p>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center sm:px-10 sm:py-20">
      <span className="pill">Coming soon</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        {BROKER_CATEGORY_LABELS[category]}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">{COMING_SOON[category]}</p>
    </div>
  );
}
