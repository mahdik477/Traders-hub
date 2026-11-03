// A listing description, or a short summary built only from fields already
// stored for that group. The summary states what was listed. It does not
// score calls, accuracy or results.

import {
  formatSignalDate,
  SIGNAL_EXTRA_LABELS,
  SIGNAL_MARKET_LABELS,
  SIGNAL_MARKET_ORDER,
  SIGNAL_PRICE_LABELS,
  SIGNAL_STYLE_LABELS,
  type SignalGroupView,
} from "./signal-group-types";

export type SignalGroupSummary = {
  text: string;
  /** True when the file had no description and this text was built from other fields. */
  generated: boolean;
};

export function signalGroupSummary(group: SignalGroupView): SignalGroupSummary {
  const written = group.description.trim();
  if (written) return { text: written, generated: false };
  return { text: generatedSummary(group), generated: true };
}

function generatedSummary(group: SignalGroupView): string {
  const markets = SIGNAL_MARKET_ORDER.filter((id) => group.markets.includes(id)).map(
    (id) => SIGNAL_MARKET_LABELS[id],
  );
  const sentences = [
    markets.length > 0
      ? `${group.name} is a Telegram signal group listed for ${joinList(markets)}.`
      : `${group.name} is a Telegram signal group.`,
  ];

  const price = group.priceLabel.trim() || SIGNAL_PRICE_LABELS[group.price];
  sentences.push(`The listing price is ${price}.`);

  if (group.language.trim()) {
    sentences.push(`The language on the listing is ${group.language.trim()}.`);
  }

  if (group.memberCount) {
    const asOf = formatSignalDate(group.memberCountAsOf);
    sentences.push(
      asOf
        ? `The approximate member count was ${group.memberCount} on ${asOf}.`
        : `The approximate member count was ${group.memberCount}.`,
    );
  }

  if (group.styles.length > 0) {
    const styles = group.styles.map((id) => SIGNAL_STYLE_LABELS[id]);
    sentences.push(`The trading style on the listing is ${joinList(styles)}.`);
  }

  if (group.signalsPerDay) {
    sentences.push(`A source stated a posting rate of ${group.signalsPerDay}.`);
  }

  if (group.extras.length > 0) {
    const extras = group.extras.map((id) => lowerFirst(SIGNAL_EXTRA_LABELS[id]));
    sentences.push(`The listing also notes ${joinList(extras)}.`);
  }

  return sentences.join(" ");
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function lowerFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}
