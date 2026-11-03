// The site's main sections. The header menu, homepage cards and "coming soon"
// pages all read from this list, so a section only needs to be added here once.

export type SectionStatus = "live" | "next-up" | "coming-soon";

export type Section = {
  slug: string;
  title: string;
  summary: string;
  status: SectionStatus;
};

export const SITE_NAME = "Tradox";

export const sections: Section[] = [
  {
    slug: "funded-accounts",
    title: "Funded Accounts",
    summary:
      "Compare prop firms side by side: fees, account sizes, drawdown rules, profit splits, platforms and evaluation steps.",
    status: "live",
  },
  {
    slug: "courses",
    title: "Courses",
    summary:
      "Browse trading education courses by topic, format and price.",
    status: "live",
  },
  {
    slug: "signal-groups",
    title: "Signal Groups",
    summary:
      "Telegram signal groups you can filter by market, trading style, price and language. A directory only — we list groups, we do not rank them.",
    status: "live",
  },
  {
    slug: "brokers",
    title: "Brokers",
    summary:
      "CFD brokers are listed now. Stock brokers and crypto exchanges are coming soon. Published terms only — we do not score results.",
    status: "live",
  },
  {
    slug: "tools",
    title: "Tools",
    summary:
      "Charting, indicators, backtesting, scanners, automation, trade copiers and trading VPS hosting, with prices copied from each tool's own site when we could confirm them.",
    status: "live",
  },
  {
    slug: "strategies",
    title: "Strategies",
    summary:
      "58 trading strategies explained honestly — what each one is, how it's traditionally traded, and a step-by-step walkthrough for actually learning it, with real charts and videos.",
    status: "live",
  },
];

export function getSection(slug: string): Section {
  const section = sections.find((s) => s.slug === slug);
  if (!section) throw new Error(`Unknown section: ${slug}`);
  return section;
}
