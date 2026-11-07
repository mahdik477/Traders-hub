import type { ReactNode, JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";
import { propFirms } from "@/lib/propfirms";
import { courses } from "@/lib/courses";
import { providers } from "@/lib/providers";
import { brokers } from "@/lib/brokers";
import { tools } from "@/lib/tools";
import { toolPriceLabel, TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER } from "@/lib/tool-types";
import { signalGroups } from "@/lib/signal-groups";
import { strategies, strategiesInDisplayOrder } from "@/lib/strategies";
import { STRATEGY_TIER_LABELS, STRATEGY_CATEGORY_LABELS } from "@/lib/strategy-types";
import { LEARN_TOPICS } from "@/lib/learn-topics";
import { allAccounts } from "@/lib/propfirm-filters";
import { BROKER_CATEGORY_ITEM_LABELS } from "@/lib/broker-types";
import { sortBrokers } from "@/lib/broker-filters";
import FirmBadge from "@/components/FirmBadge";
import ScrollReveal from "@/components/ScrollReveal";
import FaqAccordion from "@/components/FaqAccordion";
import CinematicHero from "@/components/hero/CinematicHero";
import StaticHeroBackdrop from "@/components/hero/StaticHeroBackdrop";
import CountUpStat from "@/components/CountUpStat";
import SpotlightRow from "@/components/explore/SpotlightRow";
import MiniCurriculumPath from "@/components/explore/MiniCurriculumPath";
import MiniBarCompare, { type BarItem } from "@/components/explore/MiniBarCompare";
import MiniDotPlot from "@/components/explore/MiniDotPlot";
import MiniPulseFeed from "@/components/explore/MiniPulseFeed";
import MiniIconCluster from "@/components/explore/MiniIconCluster";
import MiniCandlePreview from "@/components/explore/MiniCandlePreview";
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
  SearchIcon,
  CompassIcon,
  ChevronRightIcon,
  VolumeBarsIcon,
  RevertIcon,
  BoltIcon,
  GridIcon,
} from "@/components/icons";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Pulls the first dollar figure out of a price string like "$199/month" or
// "≈ $1,580/year" — null for anything that doesn't have one ("Free", or a
// price we don't carry in USD), which the dot plot then just leaves out
// rather than guessing a number.
function firstDollarAmount(priceText: string): number | null {
  const match = priceText.match(/\$\s?([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
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
  // CFD is the only tab with listings. Our choice (VT Markets) stays first.
  const picked = sortBrokers(
    brokers.filter((b) => b.category === "cfd"),
    "name",
  );
  return picked.map((b) => ({
    href: `/brokers/${b.id}`,
    name: b.name,
    logo: b.logo,
    logoBg: b.logoBg,
    primary: b.minDeposit != null ? `${money(b.minDeposit, b.currency)} min deposit` : null,
    secondary: b.ourChoice ? "Our choice" : BROKER_CATEGORY_ITEM_LABELS[b.category],
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

// The small interactive chart on each "Everything we offer" row — real
// figures, never a ranking. Same curated firms as fundedAccountsSnapshot,
// so the two parts of the row stay consistent with each other.
function fundedAccountsSplitChart(): BarItem[] {
  const ids = ["ftmo", "alpha-funded", "topstep", "fundingpips"];
  const chosen = ids.map((id) => propFirms.find((f) => f.id === id)).filter((f) => f != null);
  return chosen
    .map((firm) => {
      const splits = allAccounts(firm)
        .map((a) => a.profitSplit)
        .filter((s): s is number => s != null);
      if (splits.length === 0) return null;
      const max = Math.max(...splits);
      return { name: firm.name, value: max, display: `${max}%` };
    })
    .filter((x): x is BarItem => x != null);
}

function brokersDepositChart(): BarItem[] {
  const picked = sortBrokers(brokers.filter((b) => b.category === "cfd" && b.minDeposit != null), "name").slice(0, 4);
  return picked.map((b) => ({
    name: b.name,
    // Lower is "better" for a minimum deposit, so the bar reflects how
    // accessible it is (smaller deposit = shorter bar), not just the raw
    // number — still the real published figure, just inverted for the
    // bar's own logic.
    value: 1 / Math.max(b.minDeposit!, 1),
    display: money(b.minDeposit!, b.currency),
  }));
}

function coursesPriceDots() {
  return courses
    .map((c) => {
      const priceText = c.pricing[0]?.price;
      if (!priceText) return null;
      const amount = firstDollarAmount(priceText);
      if (amount == null) return null;
      return { name: c.name, price: amount, display: `$${amount}` };
    })
    .filter((x): x is { name: string; price: number; display: string } => x != null)
    .slice(0, 8);
}

function signalGroupsFeed() {
  return signalGroups.slice(0, 3).map((g) => ({ name: g.name, priceLabel: g.priceLabel, memberCount: g.memberCount }));
}

const TOOL_CATEGORY_ICONS: Record<string, (p: { className?: string }) => JSX.Element> = {
  charting: WaveStructureIcon,
  indicators: VolumeBarsIcon,
  backtesting: RevertIcon,
  journals: BookIcon,
  automation: BoltIcon,
  vps: MonitorIcon,
  "market-data": GridIcon,
  copiers: LinkIcon,
};

function toolCategoryCluster() {
  return TOOL_CATEGORY_ORDER.slice(0, 8).map((cat) => ({
    label: TOOL_CATEGORY_LABELS[cat],
    icon: TOOL_CATEGORY_ICONS[cat] ?? MonitorIcon,
  }));
}

// One entry per live section on the homepage's "Explore everything" grid —
// icon, a couple of plain-English sentences, and a data-driven snapshot.
// Order matches the header nav / sections.ts.
const EXPLORE_META: Record<
  string,
  { icon: (p: { className?: string }) => ReactNode; blurb: string }
> = {
  learn: {
    icon: CompassIcon,
    blurb: "A free, 9-part intro to trading from zero — markets, orders, candlesticks, risk, psychology and more, each with something to click on.",
  },
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

const HOW_IT_WORKS = [
  {
    icon: SearchIcon,
    title: "Browse",
    text: "Seven sections, real data pulled from each provider's own pages — not sales copy.",
  },
  {
    icon: PlayIcon,
    title: "Practice",
    text: "Every strategy has a live simulator and a quiz. Learn by doing, not just reading.",
  },
  {
    icon: CheckIcon,
    title: "Decide",
    text: "No scores, no rankings, no pressure to pick anything. You see the facts and choose.",
  },
];

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

  const sectionCounts: Record<string, number> = {
    learn: LEARN_TOPICS.length,
    "funded-accounts": propFirms.length,
    courses: courses.length + providers.length,
    "signal-groups": signalGroups.length,
    brokers: brokers.length,
    tools: tools.length,
    strategies: strategies.length,
  };

  const sectionSnapshots: Record<string, ReactNode> = {
    learn: <LearnSnapshotList />,
    "funded-accounts": <SnapshotList items={fundedAccountsSnapshot()} />,
    courses: <SnapshotList items={coursesSnapshot()} />,
    "signal-groups": <SnapshotList items={signalGroupsSnapshot()} />,
    brokers: <SnapshotList items={brokersSnapshot()} />,
    tools: <SnapshotList items={toolsSnapshot()} />,
    strategies: <StrategySnapshotList items={strategiesSnapshot()} />,
  };

  // The small interactive chart for each row — a different, genuinely
  // data-driven visual per section rather than one widget reused seven
  // times. See src/components/explore/ for each one.
  const sectionCharts: Record<string, ReactNode> = {
    learn: <MiniCurriculumPath topics={LEARN_TOPICS} />,
    "funded-accounts": <MiniBarCompare items={fundedAccountsSplitChart()} label="Profit split, by firm" />,
    courses: <MiniDotPlot items={coursesPriceDots()} />,
    "signal-groups": <MiniPulseFeed items={signalGroupsFeed()} />,
    brokers: <MiniBarCompare items={brokersDepositChart()} label="Minimum deposit, by broker" />,
    tools: <MiniIconCluster items={toolCategoryCluster()} />,
    strategies: <MiniCandlePreview />,
  };

  const tickerItems = liveSections.map((s) => `${sectionCounts[s.slug] ?? 0} ${s.title}`.toUpperCase());

  return (
    <div
      className="homepage-v3"
      style={{ "--font-heading": "var(--font-display)" } as React.CSSProperties}
    >
      {/* A continuous line of live counts right under the header — purely
          decorative (the real, accessible numbers are in the panel below
          and on the explore cards further down), but it's the first thing
          that moves on the page, and it says "this is a live data site"
          before a single word of copy does. */}
      <div className="ticker-strip -mx-4 sm:-mx-6 lg:-mx-8" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((rep) =>
            tickerItems.map((item, i) => (
              <span key={`${rep}-${i}`} className="inline-flex items-center gap-2.5 font-mono text-xs tracking-wider text-muted">
                {item}
                <span className="text-gold-bright">·</span>
              </span>
            )),
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Hero — a full-bleed WebGL terrain (its ridges built from a       */}
      {/* synthetic price walk, same convention as every other decorative  */}
      {/* chart on the site) standing in for "Trading, decoded." as an     */}
      {/* actual visual event rather than only a tagline. Pinned while you */}
      {/* scroll through it: the camera moves forward and the fog closes   */}
      {/* in, so the hero recedes into the next section instead of just    */}
      {/* scrolling away. Real HTML text on top throughout — nothing here  */}
      {/* is baked into the canvas. See CinematicHero.tsx for the render-  */}
      {/* mode/accessibility handling.                                     */}
      {/* ---------------------------------------------------------------- */}
      <CinematicHero>
        <div className="-mx-4 flex w-full flex-col items-center px-4 text-center sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/tradox-td.png"
              alt=""
              width={56}
              height={56}
              className="size-8 shrink-0 rounded-lg sm:size-10"
              priority
            />
            <p className="eyebrow text-left">UAE · Trading, simplified for everyone</p>
          </div>
          <h1 className="mt-[clamp(0.5rem,2.5vh,1rem)] leading-[0.92]">
            <span
              className="brand-wordmark block text-[clamp(2.75rem,11vw,6.5rem)] font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {SITE_NAME}
            </span>
            <span
              className="mt-2 block text-[clamp(1.25rem,3.6vw,2.25rem)] font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Trading, decoded.
            </span>
          </h1>
          <p className="mt-[clamp(0.5rem,2vh,1.25rem)] max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Prop firms, courses, signal groups, brokers, tools and strategies — real pricing,
            real rules, and live simulators you can actually practice on before you spend a
            cent.
          </p>
          <div className="mt-[clamp(0.75rem,2.5vh,1.5rem)] flex flex-wrap items-center justify-center gap-3">
            <Link href="/funded-accounts" className="btn btn-primary">
              Start exploring
            </Link>
            <a href="#explore" className="btn btn-outline">
              See everything we offer
            </a>
          </div>

          <div className="mt-[clamp(0.75rem,3vh,2rem)] w-full max-w-md rounded-2xl border border-border-strong/60 bg-background/35 px-4 py-3 shadow-glow backdrop-blur-md sm:max-w-none sm:px-7 sm:py-3.5">
            <span className="flex items-center justify-center gap-2 pb-2 sm:hidden">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted">Live</span>
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-[auto_repeat(4,1fr)] sm:items-center sm:gap-x-8 sm:gap-y-0">
              <span className="relative hidden items-center gap-2 pr-3 sm:flex">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">Live</span>
              </span>
              {[
                { label: "Prop firms", value: propFirms.length },
                { label: "Courses", value: courses.length + providers.length },
                { label: "Strategies", value: strategies.length },
                { label: "Signal groups", value: signalGroups.length },
              ].map((s) => (
                <div key={s.label} className="text-left">
                  <dd className="figure-lg font-mono text-lg text-foreground sm:text-2xl">
                    <CountUpStat value={s.value} />
                  </dd>
                  <dt className="eyebrow mt-0.5 text-[0.55rem] sm:text-[0.6rem]">{s.label}</dt>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 hidden font-mono text-[0.7rem] text-subtle sm:block">
            {TOTAL_LISTINGS}+ listings total — zero performance scores, zero rankings.
          </p>
        </div>
      </CinematicHero>

      {/* ---------------------------------------------------------------- */}
      {/* How it works — three steps, added so the hero isn't carrying the */}
      {/* entire first impression on its own.                              */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section aria-labelledby="how-heading" className="border-y border-border py-12">
          <h2 id="how-heading" className="sr-only">
            How {SITE_NAME} works
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="relative pl-0 sm:border-t-2 sm:border-gold-fill/30 sm:pt-6">
                <span
                  aria-hidden="true"
                  className="block text-5xl font-bold text-border-strong sm:text-6xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-2 flex size-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      {/* Everything we offer — one full-width, roomy row per section, each */}
      {/* with its own real, hover-interactive chart (not a copy of the    */}
      {/* hero's terrain — a different, data-driven little chart per       */}
      {/* section: profit splits, a price scale, a live-feel feed, the     */}
      {/* actual tool categories, a candle preview). Alternates left/right */}
      {/* for rhythm on wide screens; always stacks the same reading order */}
      {/* on a phone. This replaced the old compact card grid and the      */}
      {/* separate "try the simulator" section — the candle preview below  */}
      {/* now carries that job for Strategies specifically.                */}
      {/* ---------------------------------------------------------------- */}
      <section id="explore" aria-labelledby="explore-heading" className="scroll-mt-20 border-t border-border py-14">
        <h2 id="explore-heading" className="section-title text-3xl sm:text-4xl">
          Everything we offer
        </h2>
        <p className="mt-2 max-w-xl text-muted">One site, seven ways to get your bearings — pick wherever you want to start.</p>

        <div className="mt-8 flex flex-col gap-5">
          {liveSections.map((s, i) => {
            const meta = EXPLORE_META[s.slug];
            const Icon = meta?.icon ?? WaveStructureIcon;
            const chartFirst = i % 2 === 1;
            return (
              <ScrollReveal key={s.slug} delay={Math.min(i, 3) * 60}>
                <SpotlightRow>
                  <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch">
                    <div className={`flex flex-col justify-center p-6 sm:p-8 ${chartFirst ? "lg:order-last" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                          <Icon className="size-5.5" />
                        </span>
                        <span className="pill shrink-0">{sectionCounts[s.slug] ?? 0} listed</span>
                      </div>
                      <h3 className="mt-4 text-2xl font-bold">
                        <Link href={`/${s.slug}`} className="card-stretch rounded-xl hover:text-accent">
                          {s.title}
                        </Link>
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{meta?.blurb ?? s.summary}</p>

                      <div className="mt-5 max-w-md">{sectionSnapshots[s.slug]}</div>

                      <Link href={`/${s.slug}`} className="btn btn-outline relative z-10 mt-5 w-fit">
                        {s.slug === "learn" ? "Start learning" : `Browse ${s.title.toLowerCase()}`}
                      </Link>
                    </div>

                    <div
                      className={`flex items-stretch border-t border-border bg-surface-2/40 p-6 sm:p-8 lg:border-t-0 ${
                        chartFirst ? "lg:border-r" : "lg:border-l"
                      }`}
                    >
                      <div className="min-h-[220px] w-full">{sectionCharts[s.slug]}</div>
                    </div>
                  </div>
                </SpotlightRow>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why Tradox — a manifesto, not a card grid: big statements, one    */}
      {/* per line, each revealing on scroll. This is the trust section,   */}
      {/* so it gets the boldest type on the page outside the hero itself. */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="why-heading" className="border-t border-border py-16">
        <ScrollReveal>
          <p className="eyebrow">The short version</p>
          <h2 id="why-heading" className="section-title mt-2 text-3xl sm:text-4xl">
            Why Tradox
          </h2>
        </ScrollReveal>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {WHY_POINTS.map(({ icon: Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={i * 90}>
              <div className="flex flex-col gap-3 py-7 sm:flex-row sm:items-baseline sm:gap-8">
                <span
                  aria-hidden="true"
                  className="shrink-0 font-mono text-sm text-border-strong sm:w-10"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="flex items-center gap-3 text-2xl font-bold leading-tight text-foreground sm:text-[2.1rem]">
                    <Icon className="hidden size-6 shrink-0 text-accent sm:inline-flex" />
                    {title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-muted sm:text-lg">{text}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ — a clean animated accordion, split with the surrounding     */}
      {/* copy on wide screens instead of floating centred on its own.     */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section aria-labelledby="faq-heading" className="border-t border-border py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className="eyebrow">Still deciding</p>
              <h2 id="faq-heading" className="section-title mt-2 text-3xl sm:text-4xl">
                Questions people actually ask
              </h2>
              <p className="mt-3 max-w-sm text-muted">
                The short answers. For the complete legal wording, read the full disclaimer.
              </p>
              <p className="meta mt-5">
                <Link href="/disclaimer" className="text-accent hover:underline">
                  Full disclaimer
                </Link>{" "}
                ·{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  Privacy policy
                </Link>
              </p>
            </div>
            <FaqAccordion items={FAQ} />
          </div>
        </section>
      </ScrollReveal>

      {/* ---------------------------------------------------------------- */}
      {/* Closing CTA band — a smaller, quieter echo of the hero's visual  */}
      {/* language (the same static gold-horizon image, not a second live  */}
      {/* WebGL scene — one terrain on the page is enough) as the site's   */}
      {/* last word before the footer.                                     */}
      {/* ---------------------------------------------------------------- */}
      <ScrollReveal>
        <section className="hero-force-dark relative overflow-hidden rounded-2xl border border-gold-fill/30 p-10 text-center shadow-glow sm:p-16">
          <div className="absolute inset-0 -z-10">
            <StaticHeroBackdrop />
          </div>
          <p className="eyebrow justify-center text-gold-bright/80">Ready when you are</p>
          <h2
            className="mx-auto mt-3 max-w-xl text-3xl font-bold leading-tight text-foreground sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Not sure where to start?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted sm:text-lg">
            Try a free strategy first — it&apos;s the fastest way to see what {SITE_NAME} actually
            is before you dig into firms, courses or anything else.
          </p>
          <Link href="/strategies" className="btn btn-primary mt-8 inline-flex">
            <CheckIcon className="size-4" />
            Start with a free strategy
          </Link>
        </section>
      </ScrollReveal>
    </div>
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

// The Learn course's first few parts — same list shape as the others, but
// numbered instead of priced, since it's a fixed curriculum, not listings.
function LearnSnapshotList() {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {LEARN_TOPICS.slice(0, 3).map((topic, i) => (
        <li key={topic.slug}>
          <Link href={`/learn/${topic.slug}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
            <span
              aria-hidden="true"
              className="figure shrink-0 text-border-strong"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{topic.shortTitle}</span>
            <span className="meta shrink-0 flex items-center gap-1">
              {topic.readMinutes} min
              <ChevronRightIcon className="size-3.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
