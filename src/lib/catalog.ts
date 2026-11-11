// One flat list of everything on the site that has its own page or entry —
// prop firms, courses, brokers, tools, signal groups, strategies, Learn
// topics and glossary terms — in a single small shape. Built at build time
// from the same loaders the section pages use, so it can never list
// something the site doesn't have.
//
// Two things read it: the site-wide search (served as static JSON from
// /api/search-index) and My Hub, which turns saved/recent ids back into
// names and links. Server-only: it imports the Node loaders.

import { propFirms } from "./propfirms";
import { courses } from "./courses";
import { providers } from "./providers";
import { brokers } from "./brokers";
import { tools } from "./tools";
import { signalGroups } from "./signal-groups";
import { strategies } from "./strategies";
import { LEARN_TOPICS } from "./learn-topics";
import { GLOSSARY } from "./glossary";
import { MARKET_LABELS as COURSE_MARKET_LABELS } from "./course-types";
import { BROKER_CATEGORY_ITEM_LABELS } from "./broker-types";
import { TOOL_CATEGORY_LABELS, toolPriceLabel } from "./tool-types";
import { SIGNAL_MARKET_LABELS } from "./signal-group-types";
import { STRATEGY_CATEGORY_LABELS, STRATEGY_TIER_LABELS } from "./strategy-types";
import { type CatalogItem, type CatalogKind } from "./catalog-types";

export type { CatalogItem, CatalogKind } from "./catalog-types";

function item(
  kind: CatalogKind,
  id: string,
  title: string,
  href: string,
  subtitle: string | null,
  keywords: string[] = [],
  logo: string | null = null,
  logoBg: "white" | "dark" = "white",
): CatalogItem {
  return { kind, id, title, href, subtitle, keywords: keywords.filter(Boolean), logo, logoBg };
}

function buildCatalog(): CatalogItem[] {
  const out: CatalogItem[] = [];

  for (const f of propFirms) {
    const markets = f.markets.map((m) => (m.market === "forex" ? "Forex" : "Futures"));
    const programs = [...new Set(f.markets.flatMap((m) => m.challenges.map((c) => c.label)))];
    out.push(
      item(
        "firm",
        f.id,
        f.name,
        `/funded-accounts/${f.id}`,
        `Prop firm · ${markets.join(" & ")}`,
        [...markets, ...programs, ...(f.platforms ?? []), "prop firm", "funded account", "challenge"],
        f.logo,
        f.logoBg,
      ),
    );
  }

  for (const c of courses) {
    out.push(
      item(
        "course",
        c.id,
        c.name,
        `/courses/${c.id}`,
        c.tagline ?? "Trading course",
        [...c.markets.map((m) => COURSE_MARKET_LABELS[m]), ...c.platforms, c.instructor?.name ?? "", "course"],
        c.logo,
        c.logoBg,
      ),
    );
  }
  for (const p of providers) {
    out.push(
      item(
        "course",
        p.id,
        p.name,
        `/courses/${p.id}`,
        p.tagline ?? `${p.courses.length} courses`,
        [...p.courses.map((c) => c.name), "course", "provider"],
        p.logo,
        p.logoBg,
      ),
    );
  }

  for (const b of brokers) {
    out.push(
      item(
        "broker",
        b.id,
        b.name,
        `/brokers/${b.id}`,
        b.tagline ?? BROKER_CATEGORY_ITEM_LABELS[b.category],
        [BROKER_CATEGORY_ITEM_LABELS[b.category], ...b.platforms, ...b.regulators.map((r) => r.regulator), "broker"],
        b.logo,
        b.logoBg,
      ),
    );
  }

  for (const t of tools) {
    out.push(
      item(
        "tool",
        t.slug,
        t.name,
        `/tools/${t.slug}`,
        [TOOL_CATEGORY_LABELS[t.category], toolPriceLabel(t)].filter(Boolean).join(" · "),
        [TOOL_CATEGORY_LABELS[t.category], ...t.platforms, ...t.features.slice(0, 4), "tool"],
        t.logo,
      ),
    );
  }

  for (const g of signalGroups) {
    out.push(
      item(
        "signal",
        g.slug,
        g.name,
        `/signal-groups/${g.slug}`,
        `Signal group · ${g.priceLabel}`,
        [...g.markets.map((m) => SIGNAL_MARKET_LABELS[m]), g.language, "signal group", "telegram"],
        g.logo,
      ),
    );
  }

  for (const s of strategies) {
    out.push(
      item(
        "strategy",
        s.slug,
        s.name,
        `/strategies/${s.slug}`,
        `${STRATEGY_TIER_LABELS[s.tier]} · ${STRATEGY_CATEGORY_LABELS[s.category]}`,
        [...s.tags, STRATEGY_CATEGORY_LABELS[s.category], "strategy"],
      ),
    );
  }

  for (const t of LEARN_TOPICS) {
    out.push(
      item("learn", t.slug, t.title, `/learn/${t.slug}`, `Learn · ${t.readMinutes} min read`, [
        t.shortTitle,
        "learn",
        "beginner",
      ]),
    );
  }

  for (const g of GLOSSARY) {
    const id = g.term.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    out.push(item("glossary", id, g.term, `/glossary#${id}`, g.definition, g.match));
  }

  return out;
}

export const catalog: CatalogItem[] = buildCatalog();

export function catalogLookup(): Map<string, CatalogItem> {
  return new Map(catalog.map((c) => [`${c.kind}:${c.id}`, c]));
}
