import type { Metadata } from "next";
import { getStrategy } from "./strategies";

// One place for a strategy page's <head> data, used by all 58 interactive
// pages and the generic /strategies/[slug] route — so the share image and
// description can't drift between them.
export function strategyMetadata(slug: string): Metadata {
  const s = getStrategy(slug);
  if (!s) return {};
  const image = { url: `/api/og/strategy/${s.slug}`, width: 1200, height: 630, alt: `${s.name} — strategy explained on Tradox` };
  return {
    title: s.name,
    description: s.summaryOneLine,
    openGraph: { title: s.name, description: s.summaryOneLine, type: "article", images: [image] },
    twitter: { card: "summary_large_image", title: s.name, description: s.summaryOneLine, images: [image.url] },
  };
}
