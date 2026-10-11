// Loads every `tools-data-*.json` file in the project root, the same way
// brokers.ts loads broker files. To add a tool, drop a new
// `tools-data-<slug>.json` file next to the others and redeploy.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  TOOL_CATEGORY_LABELS,
  type ToolCategory,
  type ToolView,
} from "./tool-types";

type RawPlan = { name: string; price: string; detail?: string | null };

type RawFile = {
  tool: {
    slug: string;
    name: string;
    category: ToolCategory;
    description?: string | null;
    features?: string[];
    plans?: RawPlan[];
    pricing_note?: string | null;
    platforms?: string[];
    website?: string | null;
    affiliate_link?: string | null;
    priority?: number | null;
    logo?: string | null;
  };
};

const DATA_FILE_PATTERN = /^tools-data-.+\.json$/i;

function loadTools(): ToolView[] {
  const dir = process.cwd();
  const files = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => DATA_FILE_PATTERN.test(f))
    .sort();

  const tools = files.map((file) => {
    let data: RawFile;
    try {
      data = JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf-8"));
    } catch (err) {
      throw new Error(`Could not read tool data file "${file}": ${err}`);
    }
    const tool = data?.tool;
    if (!tool?.slug || !tool.name) {
      throw new Error(`Tool data file "${file}" is missing "tool.slug" or "tool.name".`);
    }
    if (!/^[a-z0-9-]+$/.test(tool.slug)) {
      throw new Error(
        `Tool data file "${file}": "slug" must use only lowercase letters, numbers and dashes.`,
      );
    }
    if (!TOOL_CATEGORY_LABELS[tool.category]) {
      throw new Error(`Tool data file "${file}" has an unknown category "${tool.category}".`);
    }
    return buildTool(tool);
  });

  const slugs = tools.map((t) => t.slug);
  const duplicate = slugs.find((slug, i) => slugs.indexOf(slug) !== i);
  if (duplicate) throw new Error(`Two tool data files use the slug "${duplicate}".`);

  return tools.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

function buildTool(t: RawFile["tool"]): ToolView {
  return {
    slug: t.slug,
    name: t.name,
    category: t.category,
    description: t.description?.trim() || "",
    features: (t.features ?? []).map((f) => f.trim()).filter(Boolean),
    plans: (t.plans ?? [])
      .filter((p) => p.name && p.price)
      .map((p) => ({
        name: p.name,
        price: p.price,
        detail: p.detail?.trim() || null,
      })),
    pricingNote: t.pricing_note?.trim() || null,
    platforms: (t.platforms ?? []).map((p) => p.trim()).filter(Boolean),
    website: safeLink(t.website),
    affiliateLink: safeLink(t.affiliate_link),
    priority: typeof t.priority === "number" ? t.priority : 100,
    logo: t.logo?.trim() || null,
  };
}

export { toolOutboundUrl } from "./tool-types";

function safeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

export const tools: ToolView[] = loadTools();

export function getTool(slug: string): ToolView | undefined {
  return tools.find((t) => t.slug === slug);
}
