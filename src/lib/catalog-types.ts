// Shared by the server-side catalog builder and the browser-side search /
// My Hub code. Keep this file free of Node-only imports.

export type CatalogKind =
  | "firm"
  | "course"
  | "broker"
  | "tool"
  | "signal"
  | "strategy"
  | "learn"
  | "glossary";

export type CatalogItem = {
  kind: CatalogKind;
  /** The listing's own id/slug — unique within its kind. */
  id: string;
  title: string;
  href: string;
  subtitle: string | null;
  /** Extra words the search should match on (markets, platforms, tags). */
  keywords: string[];
  logo: string | null;
  logoBg: "white" | "dark";
};

export const CATALOG_KIND_LABELS: Record<CatalogKind, string> = {
  firm: "Prop firms",
  course: "Courses",
  broker: "Brokers",
  tool: "Tools",
  signal: "Signal groups",
  strategy: "Strategies",
  learn: "Learn",
  glossary: "Glossary",
};

/** Order groups appear in search results and My Hub. */
export const CATALOG_KIND_ORDER: CatalogKind[] = [
  "firm",
  "course",
  "strategy",
  "learn",
  "broker",
  "tool",
  "signal",
  "glossary",
];

/** Which of the saveable kinds has a real page a visitor can return to. */
export const SAVEABLE_KINDS: CatalogKind[] = ["firm", "course", "broker", "tool", "signal", "strategy"];
