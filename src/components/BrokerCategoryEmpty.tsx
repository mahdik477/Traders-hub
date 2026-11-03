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
      <p className="py-24 text-center text-base text-muted">No CFD brokers are listed.</p>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:py-32">
      <p className="eyebrow">Coming soon</p>
      <h2 className="broker-heading mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {BROKER_CATEGORY_LABELS[category]}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted">{COMING_SOON[category]}</p>
    </div>
  );
}
