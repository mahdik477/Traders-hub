import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";
import { propFirms } from "@/lib/propfirms";
import { courses } from "@/lib/courses";
import { brokers } from "@/lib/brokers";
import { tools } from "@/lib/tools";
import { strategies } from "@/lib/strategies";
import { allAccounts } from "@/lib/propfirm-filters";
import FirmBadge from "@/components/FirmBadge";

// Real counts, computed from the data at build time — never hand-typed, so
// this line can't go stale the way a written "29 prop firms" sentence would
// the day someone adds a 30th.
const STATS = [
  { label: "prop firms", count: propFirms.length },
  { label: "courses", count: courses.length },
  { label: "strategies", count: strategies.length },
  { label: "brokers", count: brokers.length },
  { label: "tools", count: tools.length },
];

// One real, curated snapshot of the comparison itself, not a mockup —
// cheapest account and top profit split pulled the same way the full
// directory card does it (see PropFirmDirectory.tsx), just for 3 firms.
const PREVIEW_FIRM_IDS = ["ftmo", "alpha-funded", "topstep"];

function moneyShort(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function previewFirms() {
  const chosen = PREVIEW_FIRM_IDS.map((id) => propFirms.find((f) => f.id === id)).filter(
    (f): f is NonNullable<typeof f> => f != null,
  );
  // If a chosen id ever disappears from the data, fill back up to 3 from
  // whatever's there rather than silently showing fewer than intended.
  const firms = chosen.length >= 3 ? chosen : [...chosen, ...propFirms].slice(0, 3);

  return firms.map((firm) => {
    const accounts = allAccounts(firm);
    const cheapest = accounts
      .filter((a) => a.lowestPrice != null)
      .reduce<(typeof accounts)[number] | null>(
        (best, a) => (best == null || a.lowestPrice! < best.lowestPrice! ? a : best),
        null,
      );
    const splits = accounts.map((a) => a.profitSplit).filter((s): s is number => s != null);
    return {
      firm,
      priceLabel: cheapest
        ? moneyShort(cheapest.lowestPrice!, firm.currency) + (cheapest.monthly ? "/mo" : "")
        : null,
      splitLabel: splits.length > 0 ? Math.max(...splits) : null,
    };
  });
}

export default function Home() {
  const preview = previewFirms();
  const liveSections = sections.filter((s) => s.status === "live");
  const upcomingSections = sections.filter((s) => s.status !== "live");

  return (
    <>
      <section className="hero-intro grid gap-10 pb-12 pt-2 sm:pb-16 sm:pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
        <div>
          <h1 className="title-rule page-title max-w-xl sm:text-5xl lg:text-6xl">
            Compare trading products side by side, honestly
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            {SITE_NAME} puts real prop firm, course, broker and tool pricing
            next to each other — so you can see the facts and decide for
            yourself, instead of trusting one provider&apos;s own pitch.
          </p>
          <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="eyebrow">{stat.label}</dt>
                <dd className="figure-lg text-accent">{stat.count}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* A real snapshot of the comparison, not a mockup of one. */}
        <div
          aria-label="Example prop firm comparison"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
        >
          <p className="eyebrow">Funded accounts, from real pricing pages</p>
          <ul className="mt-3 space-y-2">
            {preview.map(({ firm, priceLabel, splitLabel }) => (
              <li
                key={firm.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3"
              >
                <FirmBadge name={firm.name} logo={firm.logo} logoBg={firm.logoBg} />
                <span className="min-w-0 flex-1 truncate font-semibold">{firm.name}</span>
                <span className="shrink-0 text-right">
                  <span className="figure block text-accent">{priceLabel ?? "—"}</span>
                  {splitLabel != null && (
                    <span className="meta block">up to {splitLabel}% split</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/funded-accounts"
            className="btn btn-outline mt-4 w-full"
          >
            See all {propFirms.length} prop firms
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="what-we-are"
        className="panel-accent rounded-xl border border-border bg-surface p-6"
      >
        <h2 id="what-we-are" className="section-title">
          Discovery, not verification
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
          <li>We are a directory and comparison site.</li>
          <li>
            We are not a broker, not a signal provider and not a financial
            adviser.
          </li>
          <li>
            We do not verify or rank anyone&apos;s trading performance, accuracy
            or win rate.
          </li>
          <li>
            We earn money through affiliate links and clearly labelled sponsored
            listings.
          </li>
        </ul>
      </section>

      <section aria-labelledby="sections-heading" className="pt-14">
        <h2 id="sections-heading" className="section-title">
          What you&apos;ll find here
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveSections.map((section) => (
            <li key={section.slug}>
              <Link
                href={`/${section.slug}`}
                className="lift-card flex h-full flex-col rounded-xl border border-border bg-surface p-5"
              >
                <span className="badge badge-success self-start">Browse now</span>
                <span className="mt-3 text-lg font-semibold">
                  {section.title}
                </span>
                <span className="meta mt-1.5 flex-1">{section.summary}</span>
              </Link>
            </li>
          ))}
        </ul>

        {upcomingSections.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-3">
            {upcomingSections.map((section) => (
              <li key={section.slug}>
                <Link
                  href={`/${section.slug}`}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground"
                >
                  <span className="pill">
                    {section.status === "next-up" ? "Next up" : "Coming soon"}
                  </span>
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
