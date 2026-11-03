import { leverageLabel } from "./broker-filters";
import { BROKER_MARKET_LABELS, formatDeposit, type BrokerView } from "./broker-types";

/** Short lines for cards and the comparison table. Every value comes from the listing. */

export function depositLine(broker: BrokerView): string {
  const formatted = formatDeposit(broker.minDeposit, broker.currency);
  if (formatted) return formatted;
  const stated = broker.otherFees.find((row) => /minimum deposit/i.test(row.label));
  return stated?.value ?? "Not listed";
}

export function regulatorLine(broker: BrokerView): string {
  if (broker.regulators.length) return broker.regulators.map((r) => r.regulator).join(", ");
  return broker.companyRegistration ?? "None listed";
}

export function platformLine(broker: BrokerView, limit = 3): string {
  if (!broker.platforms.length) return "Not listed";
  if (broker.platforms.length <= limit) return broker.platforms.join(", ");
  const extra = broker.platforms.length - limit;
  return `${broker.platforms.slice(0, limit).join(", ")} +${extra}`;
}

export function accountLine(broker: BrokerView): string {
  if (!broker.plans.length) return "Not listed";
  return broker.plans.map((plan) => plan.name).join(", ");
}

/** First published spread, named by the account it belongs to. Not a single rate for every account. */
export function spreadLine(broker: BrokerView): string {
  for (const group of broker.costs) {
    const row = group.rows.find((item) => /pip/i.test(item.value));
    if (row) return `${row.label} · ${row.value}`;
  }
  const first = broker.costs[0]?.rows[0];
  if (!first) return "Not listed";
  return `${first.label} · ${first.value}`;
}

export function marketLine(broker: BrokerView): string {
  if (!broker.markets.length) return "Not listed";
  return broker.markets.map((market) => BROKER_MARKET_LABELS[market]).join(", ");
}

export function cardFacts(broker: BrokerView): { label: string; value: string }[] {
  return [
    { label: "Regulation", value: regulatorLine(broker) },
    { label: "Min. deposit", value: depositLine(broker) },
    { label: "Platforms", value: platformLine(broker) },
    { label: "Accounts", value: accountLine(broker) },
    { label: "Leverage", value: leverageLabel(broker) },
  ];
}
