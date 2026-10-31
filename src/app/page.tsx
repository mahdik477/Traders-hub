import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";
import { propFirms } from "@/lib/propfirms";
import { courses } from "@/lib/courses";
import { providers } from "@/lib/providers";
import { brokers } from "@/lib/brokers";
import { tools } from "@/lib/tools";
import { toolPriceLabel } from "@/lib/tool-types";
import { signalGroups } from "@/lib/signal-groups";
import { strategies, strategiesInDisplayOrder } from "@/lib/strategies";
import { STRATEGY_TIER_LABELS, STRATEGY_CATEGORY_LABELS } from "@/lib/strategy-types";
import { allAccounts } from "@/lib/propfirm-filters";
import { BROKER_MARKET_LABELS } from "@/lib/broker-types";
import FirmBadge from "@/components/FirmBadge";
import MovingAverageSimulator from "@/components/MovingAverageSimulator";
import ScrollReveal from "@/components/ScrollReveal";
import CountUpStat from "@/components/CountUpStat";
import FaqAccordion from "@/components/FaqAccordion";
import {
  BuildingIcon,
  BookIcon,
  SignalIcon,
  MonitorIcon,
  WaveStructureIcon,
  ShieldIcon,
  UsersIcon,
  TagIcon,
  LinkIcon,
  CheckIcon,
  PlayIcon,
} from "@/components/icons";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** One row of a section card's snapshot list — a logo (or lettermark), a
 *  name, and up to two short facts. Shared shape so the eye reads every
 *  card's preview the same way even though the underlying data differs. */
type SnapshotItem = {
  href: string | null;
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
  // VT Markets stays first and keeps the Our choice label. PU Prime is second.
  const ids = ["vt-markets", "pu-prime"];
  const picked = ids.map((id) => brokers.find((b) => b.id === id)).filter((b) => b != null);
  return picked.map((b) => ({
    href: `/brokers/${b.id}`,
    name: b.name,
    logo: b.logo,
    logoBg: b.logoBg,
    primary: b.minDeposit != null ? `${money(b.minDeposit, b.currency)} min deposit` : null,
    secondary: b.ourChoice
      ? "Our choice"
      : b.markets.length > 0
        ? b.markets.slice(0, 2).map((m) => BROKER_MARKET_LABELS[m]).join(", ")
        : null,
  }));
}

function toolsSnapshot(): SnapshotItem[] {
  // The loader already puts the tools we earn from first. Every listing has
  // an affiliate link, so the homepage examples stay inside that set.
  const picked = tools.slice(0, 3);
  return picked.map((t) => ({
    href: `/tools/${t.slug}`,
    name: t.name,
    logo: t.logo,
    logoBg: "white" as const,
    primary: toolPriceLabel(t),
    secondary: null,
  }));
}

function signalGroupsSnapshot(): SnapshotItem[] {
  // No individual detail pages for these yet — Join goes straight to
  // Telegram from the directory — so these rows are a preview only, not a
  // link each; the card's one CTA button is what actually goes anywhere.
  return signalGroups.slice(0, 3).map((g) => ({
    href: null,
    name: g.name,
    logo: null,
    logoBg: "white" as const,
    primary: g.priceLabel,
    secondary: g.memberCount,
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

// One entry per live section on the homepage's "Explore everything" grid —
// icon, a couple of plain-English sentences, and a data-driven snapshot.
// Order matches the header nav / sections.ts.
const EXPLORE_META: Record<
  string,
  { icon: (p: { className?: string }) => ReactNode; blurb: string }
> = {
  "funded-accounts": {
    icon: ShieldIcon,
    blurb: "Evaluation fees, account sizes, drawdown rules and profit splits — pulled from each firm's own pricing page, not a sales call.",
  },
  courses: {
    icon: BookIcon,
    blurb: "What each course actually covers, how it's delivered, and independent Trustpilot ratings alongside the price.",
  },
  "signal-groups": {
    icon: SignalIcon,
    blurb: "Telegram groups filtered by market and style. No guaranteed-return pitches get listed — a free tier or trial is required.",
  },
  brokers: {
    icon: BuildingIcon,
    blurb: "Retail brokers for trading your own money — regulation, minimum deposits and supported platforms, side by side.",
  },
  tools: {
    icon: MonitorIcon,
    blurb: "Charting, scanners, automation and VPS hosting, with prices confirmed from each tool's own site wherever we could.",
  },
  strategies: {
    icon: WaveStructureIcon,
    blurb: "58 strategies explained in plain English — each with a live chart you can play with and a quiz to test what stuck.",
  },
};

const WHY_POINTS = [
  {
    icon: ShieldIcon,
    title: "We don't score anyone",
    text: "No performance ratings, no win-rate claims, no \"best firm\" rankings. We show what each provider actually publishes and let you judge it.",
  },
  {
    icon: UsersIcon,
    title: "Not advice, not a broker",
    text: "We're not a broker, a signal provider or a financial adviser. Nothing on this site tells you what to trade — it's here so you can decide for yourself.",
  },
  {
    icon: TagIcon,
    title: "Sponsored is always labelled",
    text: "If a placement is sponsored, it says so — visibly, every time. Written in our own words, never a copied pitch.",
  },
  {
    icon: LinkIcon,
    title: "How we actually make money",
    text: "Mainly affiliate commissions when you sign up through our links, plus clearly labelled sponsored spots. It costs you nothing extra.",
  },
];

const FAQ = [
  {
    q: "How does Tradox make money?",
    a: "Mainly affiliate commissions when you sign up with a firm, course or tool through our links, plus clearly labelled sponsored placements. It costs you nothing extra — most of these are the same prices you'd get going direct.",
  },
  {
    q: "Do you verify trading performance or win rates?",
    a: "No. We list what each provider publishes — pricing, rules, terms — and we never display or imply a performance, accuracy or win-rate score for any firm, course, strategy or signal group.",
  },
  {
    q: "Is anything on this site financial advice?",
    a: "No. We're a discovery platform for informational purposes only. Nothing here is a recommendation to use any specific firm, course or strategy — see the full disclaimer for the details.",
  },
  {
    q: "Why do some firms or courses show an \"Our choice\" badge?",
    a: "It means we have a real, tracked affiliate relationship with them — not a performance ranking. It's there so you know exactly where our incentive sits, not to imply they're objectively \"best.\"",
  },
  {
    q: "Can I actually practice a strategy here, or is it just descriptions?",
    a: "Both. Every strategy page has a live, click-to-test simulator built from made-up (clearly labelled synthetic) price data, plus a short quiz — so you can see a setup happen and then prove to yourself you'd actually spot it.",
  },
];

const TOTAL_LISTINGS =
  propFirms.length + courses.length + providers.length + brokers.length + tools.length + strategies.length + signalGroups.length;

export default function Home() {
  const liveSections = sections.filter((s) => s.status === "live");
  const featuredStrategyImage = strategies.find((s) => s.slug === "moving-average-crossover")?.image ?? null;

  const sectionCounts: Record<string, number> = {
    "funded-accounts": propFirms.length,
    courses: courses.length + providers.length,
    "signal-groups": signalGroups.length,
    brokers: brokers.length,
    tools: tools.length,
    strategies: strategies.length,
  };

  const sectionSnapshots: Record<string, ReactNode> = {
    "funded-accounts": <SnapshotList items={fundedAccountsSnapshot()} />,
    courses: <SnapshotList items={coursesSnapshot()} />,
    "signal-groups": <SnapshotList items={signalGroupsSnapshot()} />,
    brokers: <SnapshotList items={brokersSnapshot()} />,
    tools: <SnapshotList items={toolsSnapshot()} />,
    strategies: <StrategySnapshotList items={strategiesSnapshot()} />,
  };

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="hero-intro relative overflow-hidden pb-10 pt-6 sm:pb-14 sm:pt-10">
        <HeroChartDecoration />

        <p className="eyebrow">Built for traders who are just starting out</p>
        <h1 className="page-title mt-3 max-w-3xl text-[2.6rem] leading-[1.08] sm:text-6xl lg:text-[4.5rem]">
          Trading has a lot of moving parts.{" "}
          <span className="text-accent">We put them in one place.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Prop firms, courses, signal groups, brokers, tools and strategies — real pricing and
          real rules pulled straight from each provider, plus live strategy simulators you can
          actually practice on. No performance scores, no sales pitches.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/funded-accounts" className="btn btn-primary">
            Start exploring
          </Link>
          <a href="#explore" className="btn btn-outline">
            See everything we offer
          </a>
        </div>

        {/* Quick-access tiles — also the "what's actually in here" answer,
            right up top instead of buried further down the page. */}
        <ul className="mt-9 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {liveSections.map((s) => {
            const meta = EXPLORE_META[s.slug];
            const Icon = meta?.icon ?? WaveStructureIcon;
            return (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}`}
                  className="hero-tile group flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-accent/50 hover:bg-surface-2"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent transition-transform group-hover:scale-105">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-sm font-semibold leading-tight text-foreground">{s.title}</span>
                  <span className="meta">{sectionCounts[s.slug] ?? 0} listed</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Big combined number — one confident stat, not a repeat of the    */}
      {/* per-section counts above.                                        */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section aria-labelledby="scale-heading" className="border-y border-border py-10 text-center">
          <h2 id="scale-heading" className="sr-only">
            Everything in one place
          </h2>
          <p className="figure-lg text-5xl text-accent sm:text-6xl">
            <CountUpStat value={TOTAL_LISTINGS} suffix="+" />
          </p>
          <p className="mt-2 text-base text-muted">
            real listings across every section below — not one of them scored, ranked by
            performance, or written as a sales pitch.
          </p>
        </section>
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      {/* See it in action — an actual live simulator, not another         */}
      {/* screenshot or paragraph describing one.                          */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section aria-labelledby="demo-heading" className="py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Not just a list — try it yourself</p>
              <h2 id="demo-heading" className="section-title mt-2 text-3xl sm:text-4xl">
                This is a real, live strategy simulator
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                Every one of our 58 strategies has one of these built in. Drag the sliders,
                shuffle the chart, and watch the signals happen in front of you — made-up price
                data, real mechanics.
              </p>
            </div>
            <Link href="/strategies" className="btn btn-outline shrink-0">
              Browse all 58 strategies
            </Link>
          </div>
          <div className="mt-6">
            <MovingAverageSimulator />
          </div>
        </section>
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      {/* Explore everything — the full 6-up grid, each card data-driven.  */}
      {/* ---------------------------------------------------------------- */}
      <section id="explore" aria-labelledby="explore-heading" className="scroll-mt-20 border-t border-border py-14">
        <h2 id="explore-heading" className="section-title text-3xl sm:text-4xl">
          Everything we offer
        </h2>
        <p className="mt-2 max-w-xl text-muted">One site, six ways to get your bearings — pick wherever you want to start.</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {liveSections.map((s, i) => {
            const meta = EXPLORE_META[s.slug];
            const Icon = meta?.icon ?? WaveStructureIcon;
            const isStrategies = s.slug === "strategies";
            return (
              <ScrollReveal key={s.slug} delay={(i % 3) * 60}>
                <div className="lift-card group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
                  <div className="h-1 w-full bg-gradient-to-r from-gold-deep to-gold-bright" />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                        <Icon className="size-5.5" />
                      </span>
                      <span className="pill shrink-0">{sectionCounts[s.slug] ?? 0} listed</span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold">
                      <Link href={`/${s.slug}`} className="hover:text-accent">
                        {s.title}
                      </Link>
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{meta?.blurb ?? s.summary}</p>

                    {isStrategies && featuredStrategyImage && (
                      <Link
                        href="/strategies/moving-average-crossover"
                        className="mt-4 block overflow-hidden rounded-lg border border-border"
                      >
                        <Image
                          src={featuredStrategyImage.src}
                          alt={featuredStrategyImage.caption}
                          width={600}
                          height={338}
                          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </Link>
                    )}

                    <div className="mt-4 flex-1">{sectionSnapshots[s.slug]}</div>

                    <Link href={`/${s.slug}`} className="btn btn-outline mt-5 w-full">
                      Browse {s.title.toLowerCase()}
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why Tradox — the trust facts, presented as a real section        */}
      {/* instead of a thin strip of text.                                  */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section aria-labelledby="why-heading" className="border-t border-border py-14">
          <h2 id="why-heading" className="section-title text-3xl sm:text-4xl">
            Why Tradox
          </h2>
          <p className="mt-2 max-w-xl text-muted">The short version of how this site works and why we built it this way.</p>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {WHY_POINTS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ — now an accordion instead of a flat wall of Q&As.            */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section aria-labelledby="faq-heading" className="border-t border-border py-14">
          <h2 id="faq-heading" className="section-title text-3xl sm:text-4xl">
            Questions people actually ask
          </h2>
          <div className="mt-6 max-w-2xl">
            <FaqAccordion items={FAQ} />
          </div>
          <p className="meta mt-6">
            More detail in the{" "}
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
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      {/* Closing CTA band                                                  */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-8 text-center shadow-glow sm:p-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-fill/15 via-transparent to-transparent"
          />
          <PlayIcon className="mx-auto size-9 text-accent" />
          <h2 className="section-title mt-4 text-2xl sm:text-3xl">Not sure where to start?</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Try a free strategy first — it&apos;s the fastest way to see what {SITE_NAME} actually
            is before you dig into firms, courses or anything else.
          </p>
          <Link href="/strategies" className="btn btn-primary mt-6 inline-flex">
            <CheckIcon className="size-4" />
            Start with a free strategy
          </Link>
        </section>
      </ScrollReveal>
    </>
  );
}

// A faint, decorative "price chart" line behind the hero headline — purely
// visual, aria-hidden, never presented as real market data (see the
// synthetic-chart convention used everywhere else on the site).
function HeroChartDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 260"
      preserveAspectRatio="none"
      className="hero-chart-deco pointer-events-none absolute inset-x-0 top-0 -z-10 h-full w-full opacity-[0.07]"
    >
      <path
        d="M0 190 L60 170 L110 200 L170 120 L230 150 L290 70 L350 110 L410 40 L470 90 L540 30 L600 75 L660 20 L720 60 L800 10"
        fill="none"
        stroke="var(--color-gold-bright)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SnapshotList({ items }: { items: SnapshotItem[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((item) => {
        const row = (
          <>
            <FirmBadge name={item.name} logo={item.logo} logoBg={item.logoBg} />
            <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
            {(item.primary || item.secondary) && (
              <span className="shrink-0 text-right">
                {item.primary && <span className="figure block text-accent">{item.primary}</span>}
                {item.secondary && <span className="meta block">{item.secondary}</span>}
              </span>
            )}
          </>
        );
        return (
          <li key={item.name}>
            {item.href ? (
              <Link href={item.href} className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-3 p-3">{row}</div>
            )}
          </li>
        );
      })}
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
          <Link href={item.href} className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
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
