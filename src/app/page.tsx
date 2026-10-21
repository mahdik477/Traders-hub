import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";
import { propFirms } from "@/lib/propfirms";
import { courses } from "@/lib/courses";
import { brokers } from "@/lib/brokers";
import { tools } from "@/lib/tools";
import { toolPriceLabel } from "@/lib/tool-types";
import { strategies, strategiesInDisplayOrder } from "@/lib/strategies";
import { STRATEGY_TIER_LABELS, STRATEGY_CATEGORY_LABELS } from "@/lib/strategy-types";
import { allAccounts } from "@/lib/propfirm-filters";
import { BROKER_MARKET_LABELS } from "@/lib/broker-types";
import FirmBadge from "@/components/FirmBadge";
import { LinkIcon, ShieldIcon, TagIcon, UsersIcon } from "@/components/icons";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** One row of the snapshot list on a showcase row's "examples" side — a
 *  logo (or lettermark), a name, and up to two short facts. Shared shape
 *  across all five sections below so the eye reads them the same way even
 *  though the underlying data is different for each. */
type SnapshotItem = {
  href: string;
  name: string;
  logo: string | null;
  logoBg: "white" | "dark";
  primary: string | null;
  secondary: string | null;
};

function fundedAccountsSnapshot(): SnapshotItem[] {
  const ids = ["ftmo", "alpha-funded", "topstep"];
  const chosen = ids.map((id) => propFirms.find((f) => f.id === id)).filter((f) => f != null);
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
      href: `/funded-accounts/${firm.id}`,
      name: firm.name,
      logo: firm.logo,
      logoBg: firm.logoBg,
      primary: cheapest ? money(cheapest.lowestPrice!, firm.currency) + (cheapest.monthly ? "/mo" : "") : null,
      secondary: splits.length > 0 ? `up to ${Math.max(...splits)}% split` : null,
    };
  });
}

function coursesSnapshot(): SnapshotItem[] {
  // Courses we actually earn from — the same ones that sort first and carry
  // the Our choice badge on /courses (see CourseDirectory.tsx).
  const affiliateCourses = courses.filter((c) => c.affiliateLink != null).slice(0, 3);
  const chosen = affiliateCourses.length >= 3 ? affiliateCourses : courses.slice(0, 3);
  return chosen.map((c) => ({
    href: `/courses/${c.id}`,
    name: c.name,
    logo: c.logo,
    logoBg: c.logoBg,
    primary: c.pricing[0]?.price ?? null,
    secondary: c.affiliateLink != null ? "Our choice" : null,
  }));
}

function brokersSnapshot(): SnapshotItem[] {
  const ids = ["interactive-brokers", "oanda", "cmc-markets"];
  const chosen = ids.map((id) => brokers.find((b) => b.id === id)).filter((b) => b != null);
  const picked = chosen.length >= 3 ? chosen : [...chosen, ...brokers].slice(0, 3);
  return picked.map((b) => ({
    href: `/brokers/${b.id}`,
    name: b.name,
    logo: b.logo,
    logoBg: b.logoBg,
    primary: b.minDeposit != null ? `${money(b.minDeposit, b.currency)} min deposit` : null,
    secondary: b.markets.length > 0 ? b.markets.slice(0, 2).map((m) => BROKER_MARKET_LABELS[m]).join(", ") : null,
  }));
}

function toolsSnapshot(): SnapshotItem[] {
  const ids = ["tradingview", "luxalgo", "fx-replay"];
  const chosen = ids.map((id) => tools.find((t) => t.slug === id)).filter((t) => t != null);
  const picked = chosen.length >= 3 ? chosen : [...chosen, ...tools].slice(0, 3);
  return picked.map((t) => ({
    href: `/tools/${t.slug}`,
    name: t.name,
    logo: t.logo,
    logoBg: "white" as const,
    primary: toolPriceLabel(t),
    secondary: null,
  }));
}

function strategiesSnapshot() {
  return strategiesInDisplayOrder.slice(0, 3).map((s) => ({
    href: `/strategies/${s.slug}`,
    name: s.name,
    tier: STRATEGY_TIER_LABELS[s.tier],
    category: STRATEGY_CATEGORY_LABELS[s.category],
  }));
}

const TRUST_POINTS = [
  {
    icon: ShieldIcon,
    text: "We're a directory, not a verifier — we never score anyone's performance or win rate.",
  },
  {
    icon: UsersIcon,
    text: "Not a broker, not a signal provider, not a financial adviser. Nothing here is advice.",
  },
  {
    icon: TagIcon,
    text: "Sponsored listings are always labelled “Sponsored” — in our own words, not copied pitches.",
  },
  {
    icon: LinkIcon,
    text: "We earn through affiliate commissions and clearly disclosed sponsored placements.",
  },
];

const FAQ = [
  {
    q: "How does Tradox make money?",
    a: "Mainly affiliate commissions when you sign up with a firm, course or tool through our links, plus clearly labelled sponsored placements. It costs you nothing extra — most of these are the same prices you'd get going direct.",
  },
  {
    q: "Do you verify trading performance or win rates?",
    a: "No. We list what each provider publishes — pricing, rules, terms — and we never display or imply a performance, accuracy or win-rate score for any firm, course, strategy or signal group. “Discovery, not verification” is the whole model.",
  },
  {
    q: "Is anything on this site financial advice?",
    a: "No. We're a comparison and discovery platform for informational purposes only. Nothing here is a recommendation to use any specific firm, course or strategy — see the full disclaimer for the details.",
  },
  {
    q: "Why do some firms or courses show an “Our choice” badge?",
    a: "It means we have a real, tracked affiliate relationship with them — not a performance ranking. It's there so you know exactly where our incentive sits, not to imply they're objectively “best.”",
  },
];

export default function Home() {
  const liveSections = sections.filter((s) => s.status === "live");
  const upcomingSections = sections.filter((s) => s.status !== "live");
  const featuredStrategyImage = strategies.find((s) => s.slug === "moving-average-crossover")?.image ?? null;

  return (
    <>
      {/* Hero — one confident statement, real numbers woven into the copy
          rather than parked in a separate stat row, one clear way in. */}
      <section className="hero-intro pb-12 pt-4 sm:pb-16 sm:pt-8">
        <p className="eyebrow">{SITE_NAME} — discovery, not verification</p>
        <h1 className="page-title mt-3 max-w-3xl text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl">
          Compare trading products side by side.{" "}
          <span className="text-accent">Honestly.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          <span className="figure text-foreground">{propFirms.length}</span> prop firms,{" "}
          <span className="figure text-foreground">{courses.length}</span> courses,{" "}
          <span className="figure text-foreground">{strategies.length}</span> strategies,{" "}
          <span className="figure text-foreground">{brokers.length}</span> brokers and{" "}
          <span className="figure text-foreground">{tools.length}</span> tools, with real pricing
          pulled straight from each provider&apos;s own pages — so you see the facts and decide
          for yourself, instead of trusting one provider&apos;s own pitch.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/funded-accounts" className="btn btn-primary">
            Start comparing
          </Link>
          <div className="flex flex-wrap gap-2">
            {liveSections.map((s) => (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className="pill transition-colors hover:border-accent/50 hover:text-foreground"
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip — a thin banner, not a boxed card, so it reads like a
          masthead statement rather than another panel in a stack of panels. */}
      <section aria-labelledby="what-we-are" className="border-y border-border py-7">
        <h2 id="what-we-are" className="sr-only">
          Discovery, not verification
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                <Icon className="size-4" />
              </span>
              <span className="meta leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Editorial section list — numbered like a contents page, full-width,
          alternating sides, real data throughout. Replaces the card grid. */}
      <section aria-labelledby="sections-heading" className="py-2">
        <h2 id="sections-heading" className="sr-only">
          What you&apos;ll find here
        </h2>

        <div className="flex flex-col divide-y divide-border">
          <SectionShowcase
            index={1}
            section={liveSections.find((s) => s.slug === "funded-accounts")}
            totalCount={propFirms.length}
            reverse={false}
          >
            <SnapshotList items={fundedAccountsSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            index={2}
            section={liveSections.find((s) => s.slug === "courses")}
            totalCount={courses.length}
            reverse={true}
          >
            <SnapshotList items={coursesSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            index={3}
            section={liveSections.find((s) => s.slug === "brokers")}
            totalCount={brokers.length}
            reverse={false}
          >
            <SnapshotList items={brokersSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            index={4}
            section={liveSections.find((s) => s.slug === "tools")}
            totalCount={tools.length}
            reverse={true}
          >
            <SnapshotList items={toolsSnapshot()} />
          </SectionShowcase>

          <SectionShowcase
            index={5}
            section={liveSections.find((s) => s.slug === "strategies")}
            totalCount={strategiesInDisplayOrder.length}
            reverse={false}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {featuredStrategyImage && (
                <Link
                  href="/strategies/moving-average-crossover"
                  className="lift-card hidden overflow-hidden rounded-xl border border-border bg-surface sm:block"
                >
                  <Image
                    src={featuredStrategyImage.src}
                    alt={featuredStrategyImage.caption}
                    width={600}
                    height={338}
                    className="aspect-video w-full object-cover"
                  />
                  <span className="meta block px-3 py-2">Moving Average Crossover</span>
                </Link>
              )}
              <StrategySnapshotList items={strategiesSnapshot()} />
            </div>
          </SectionShowcase>
        </div>

        {upcomingSections.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-3 border-t border-border pt-8">
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

      {/* FAQ — answers the questions a first-time visitor actually has,
          grounded in the same facts as the disclaimer, not sales copy. */}
      <section aria-labelledby="faq-heading" className="mt-6 border-t border-border py-14">
        <h2 id="faq-heading" className="section-title">
          Questions people actually ask
        </h2>
        <dl className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt className="text-base font-semibold">{q}</dt>
              <dd className="mt-2 leading-relaxed text-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="meta mt-8">
          More detail on all of this in the{" "}
          <Link href="/disclaimer" className="text-accent hover:underline">
            full disclaimer
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </section>
    </>
  );
}

// A full-width row: a faint running number, the section's name and summary
// on one side, a real snapshot of its listings on the other. Alternates
// which side the text sits on so a long stack of these doesn't read as one
// repeating template.
function SectionShowcase({
  index,
  section,
  totalCount,
  reverse,
  children,
}: {
  index: number;
  section: { slug: string; title: string; summary: string } | undefined;
  totalCount: number;
  reverse: boolean;
  children: ReactNode;
}) {
  if (!section) return null;
  return (
    <div className="grid gap-6 py-12 first:pt-0 last:pb-0 lg:grid-cols-[auto_1fr_1fr] lg:items-center lg:gap-10">
      <span
        aria-hidden="true"
        className="hidden text-6xl font-bold text-border-strong lg:block"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <div className={reverse ? "lg:order-3" : undefined}>
        <span className="eyebrow lg:hidden">{String(index).padStart(2, "0")} — {totalCount} listed</span>
        <span className="eyebrow hidden lg:inline">{totalCount} listed</span>
        <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">
          <Link href={`/${section.slug}`} className="hover:text-accent">
            {section.title}
          </Link>
        </h3>
        <p className="mt-2 max-w-md text-muted">{section.summary}</p>
        <Link href={`/${section.slug}`} className="btn btn-outline mt-5">
          Browse {section.title.toLowerCase()}
        </Link>
      </div>
      <div className={reverse ? "lg:order-2" : undefined}>{children}</div>
    </div>
  );
}

function SnapshotList({ items }: { items: SnapshotItem[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center gap-3 p-3.5 transition-colors hover:bg-surface-2"
          >
            <FirmBadge name={item.name} logo={item.logo} logoBg={item.logoBg} />
            <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
            {(item.primary || item.secondary) && (
              <span className="shrink-0 text-right">
                {item.primary && <span className="figure block text-accent">{item.primary}</span>}
                {item.secondary && <span className="meta block">{item.secondary}</span>}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Strategies have no logo or price — the honest snapshot for them is the
// name plus what they are (difficulty tier, trading style), not a number.
function StrategySnapshotList({
  items,
}: {
  items: { href: string; name: string; tier: string; category: string }[];
}) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center gap-3 p-3.5 transition-colors hover:bg-surface-2"
          >
            <span className="flex-1">
              <span className="block font-semibold">{item.name}</span>
              <span className="meta mt-0.5 block">{item.category}</span>
            </span>
            <span className="pill shrink-0">{item.tier}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
