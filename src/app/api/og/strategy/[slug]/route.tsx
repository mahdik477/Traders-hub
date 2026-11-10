import { notFound } from "next/navigation";
import { getStrategy, strategies } from "@/lib/strategies";
import {
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_DIFFICULTY_LABELS,
  STRATEGY_TIER_LABELS,
} from "@/lib/strategy-types";
import { ogCard } from "@/lib/og";

// Share image for /strategies/<slug>. Built at build time for all 58.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return strategies.map((s) => ({ slug: s.slug }));
}

export async function GET(_req: Request, ctx: RouteContext<"/api/og/strategy/[slug]">) {
  const { slug } = await ctx.params;
  const s = getStrategy(slug);
  if (!s) notFound();
  return ogCard({
    eyebrow: `Strategy · ${STRATEGY_CATEGORY_LABELS[s.category]}`,
    title: s.name,
    subtitle: s.summaryOneLine,
    facts: [STRATEGY_TIER_LABELS[s.tier], STRATEGY_DIFFICULTY_LABELS[s.difficulty], "Live simulator + quiz"],
    logo: null,
    name: s.name,
    footer: "Educational only · never a claim it makes money",
  });
}
