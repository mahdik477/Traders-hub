// Types shared by the tool data loader (server) and the directory/detail
// pages (may render on the client). Keep this file free of Node-only imports.

export type ToolCategory =
  | "charting"
  | "indicators"
  | "backtesting"
  | "journals"
  | "automation"
  | "vps"
  | "market-data"
  | "copiers";

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  charting: "Charting",
  indicators: "Indicators",
  backtesting: "Backtesting & Replay",
  journals: "Trade Journals",
  automation: "Automation & EA Builders",
  vps: "VPS Hosting",
  "market-data": "Market Data & Scanners",
  copiers: "Trade Copiers",
};

/** Order of the filter chips. "All" is added in the directory. */
export const TOOL_CATEGORY_ORDER: ToolCategory[] = [
  "charting",
  "indicators",
  "backtesting",
  "journals",
  "automation",
  "vps",
  "market-data",
  "copiers",
];

export type ToolPlan = {
  name: string;
  /** A price string copied from the provider, e.g. "$35/mo". */
  price: string;
  /** Billing period, limits, or what the figure includes. */
  detail: string | null;
};

export type ToolView = {
  /** Also the page address: /tools/<slug>. */
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  features: string[];
  /** Empty when we could not confirm a price on the official site. */
  plans: ToolPlan[];
  pricingNote: string | null;
  platforms: string[];
  website: string | null;
  /**
   * The only place an affiliate URL goes. Null until the owner supplies one.
   * Visit buttons use affiliateLink, then website.
   */
  affiliateLink: string | null;
  /**
   * Lower numbers are listed first. Forex and gold tools use 1 to 8.
   * Everyone else shares a higher number and then sorts by name.
   */
  priority: number;
  /** Path under /public. Null falls back to initials. */
  logo: string | null;
};

/** The single outbound URL for a tool. Affiliate link wins once it exists. */
export function toolOutboundUrl(tool: {
  affiliateLink: string | null;
  website: string | null;
}): string | null {
  return tool.affiliateLink ?? tool.website;
}

/** One line for cards. Null when no plan was confirmed. */
export function toolPriceLabel(tool: { plans: ToolPlan[] }): string | null {
  const paid = tool.plans.find((plan) => !/^free$/i.test(plan.price.trim()));
  const plan = paid ?? tool.plans[0];
  if (!plan) return null;
  return plan.price;
}
