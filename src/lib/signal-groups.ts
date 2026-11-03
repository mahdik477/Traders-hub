// Loads every `signal-groups-data-*.json` file in the project root, the same
// way tools.ts loads tool files. To add a group, drop a new file next to the
// others and redeploy. An empty folder of files is valid: the page then
// shows its empty state.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SIGNAL_EXTRA_LABELS,
  SIGNAL_MARKET_LABELS,
  SIGNAL_PRICE_LABELS,
  SIGNAL_STYLE_LABELS,
  type SignalExtra,
  type SignalGroupView,
  type SignalMarket,
  type SignalPrice,
  type SignalStyle,
} from "./signal-group-types";

type RawFile = {
  _notes?: { last_verified?: string | null };
  group: {
    slug: string;
    name: string;
    description?: string | null;
    markets?: string[];
    styles?: string[];
    price?: string;
    price_label?: string | null;
    member_count?: string | null;
    member_count_as_of?: string | null;
    language?: string | null;
    signals_per_day?: string | null;
    extras?: string[];
    telegram_url?: string | null;
    logo?: string | null;
    rank?: number | null;
  };
};

const DATA_FILE_PATTERN = /^signal-groups-data-.+\.json$/i;

function loadSignalGroups(): { groups: SignalGroupView[]; lastVerified: string | null } {
  const dir = process.cwd();
  const files = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((file) => DATA_FILE_PATTERN.test(file))
    .sort();

  let lastVerified = "";
  const groups = files.map((file) => {
    let data: RawFile;
    try {
      data = JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf-8"));
    } catch (err) {
      throw new Error(`Could not read signal group file "${file}": ${err}`);
    }
    const verified = data?._notes?.last_verified?.trim() ?? "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(verified) && verified > lastVerified) lastVerified = verified;
    const group = data?.group;
    if (!group?.slug || !group.name) {
      throw new Error(`Signal group file "${file}" is missing "group.slug" or "group.name".`);
    }
    if (!/^[a-z0-9-]+$/.test(group.slug)) {
      throw new Error(
        `Signal group file "${file}": "slug" must use only lowercase letters, numbers and dashes.`,
      );
    }
    return buildGroup(file, group, verified);
  });

  const slugs = groups.map((group) => group.slug);
  const duplicate = slugs.find((slug, index) => slugs.indexOf(slug) !== index);
  if (duplicate) throw new Error(`Two signal group files use the slug "${duplicate}".`);

  return {
    groups: groups.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)),
    lastVerified: lastVerified || null,
  };
}

function buildGroup(file: string, group: RawFile["group"], checkedOn: string): SignalGroupView {
  const markets = (group.markets ?? []).filter((market): market is SignalMarket =>
    Boolean(SIGNAL_MARKET_LABELS[market as SignalMarket]),
  );
  const styles = (group.styles ?? []).filter((style): style is SignalStyle =>
    Boolean(SIGNAL_STYLE_LABELS[style as SignalStyle]),
  );
  const price = group.price as SignalPrice;
  if (!SIGNAL_PRICE_LABELS[price]) {
    throw new Error(`Signal group file "${file}" has an unknown price "${group.price}".`);
  }
  const extras = (group.extras ?? []).filter((extra): extra is SignalExtra =>
    Boolean(SIGNAL_EXTRA_LABELS[extra as SignalExtra]),
  );
  return {
    slug: group.slug,
    name: group.name,
    description: group.description?.trim() || "",
    markets,
    price,
    priceLabel: group.price_label?.trim() || SIGNAL_PRICE_LABELS[price],
    memberCount: group.member_count?.trim() || null,
    memberCountAsOf: group.member_count?.trim() ? group.member_count_as_of?.trim() || null : null,
    language: group.language?.trim() || "",
    styles,
    signalsPerDay: group.signals_per_day?.trim() || null,
    extras,
    telegramUrl: safeLink(group.telegram_url),
    logo: group.logo?.trim() || null,
    checkedOn: /^\d{4}-\d{2}-\d{2}$/.test(checkedOn) ? checkedOn : null,
    rank: typeof group.rank === "number" ? group.rank : 100,
  };
}

function safeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

const loaded = loadSignalGroups();

export const signalGroups: SignalGroupView[] = loaded.groups;

const signalGroupsBySlug = new Map(signalGroups.map((group) => [group.slug, group]));

export function getSignalGroup(slug: string): SignalGroupView | undefined {
  return signalGroupsBySlug.get(slug);
}

/** Newest `_notes.last_verified` across the directory, or null if none are dated. */
export const signalGroupsLastVerified: string | null = loaded.lastVerified;
