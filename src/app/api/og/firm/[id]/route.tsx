import { notFound } from "next/navigation";
import { getPropFirm, propFirms } from "@/lib/propfirms";
import { allAccounts } from "@/lib/propfirm-filters";
import { money } from "@/lib/format-money";
import { logoDataUrl, ogCard } from "@/lib/og";

// Share image for /funded-accounts/<id>. Built at build time for every firm.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return propFirms.map((f) => ({ id: f.id }));
}

export async function GET(_req: Request, ctx: RouteContext<"/api/og/firm/[id]">) {
  const { id } = await ctx.params;
  const firm = getPropFirm(id);
  if (!firm) notFound();

  const accounts = allAccounts(firm);
  const cheapest = accounts.filter((a) => a.lowestPrice != null).sort((a, b) => a.lowestPrice! - b.lowestPrice!)[0];
  const splits = accounts.map((a) => a.profitSplit).filter((s): s is number => s != null);
  const markets = firm.markets.map((m) => (m.market === "forex" ? "Forex" : "Futures")).join(" & ");

  const facts = [
    markets,
    cheapest ? `From ${money(cheapest.lowestPrice!, firm.currency)}${cheapest.monthly ? "/mo" : ""}` : null,
    splits.length ? `Up to ${Math.max(...splits)}% split` : null,
  ].filter((x): x is string => !!x);

  return ogCard({
    eyebrow: "Prop firm · Funded accounts",
    title: firm.name,
    // Review alerts stay on the page itself (dated, sourced, with the legal
    // reminder) — a share image travels off-site with none of that context.
    subtitle: firm.about,
    facts,
    logo: logoDataUrl(firm.logo),
    logoBg: firm.logoBg,
    name: firm.name,
    footer: firm.lastVerified ? `Prices checked ${firm.lastVerified} · not a ranking` : undefined,
  });
}
