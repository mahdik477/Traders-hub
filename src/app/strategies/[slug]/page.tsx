import type { JSX, ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import StrategyBackLink from "@/components/StrategyBackLink";
import StrategyWalkthrough from "@/components/StrategyWalkthrough";
import {
  ShieldIcon,
  InfoIcon,
  BookIcon,
  LayersIcon,
  TagIcon,
  LinkIcon,
  MonitorIcon,
  PlayIcon,
  CheckIcon,
} from "@/components/icons";
import {
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_DIFFICULTY_LABELS,
  STRATEGY_EXECUTION_LABELS,
  STRATEGY_MARKET_LABELS,
  STRATEGY_TIER_LABELS,
  STRATEGY_TIMEFRAME_LABELS,
  youtubeThumbnail,
} from "@/lib/strategy-types";
import { getStrategy, strategies } from "@/lib/strategies";

export const dynamicParams = false;

// Every free- and intermediate-tier strategy now has its own literal
// route (a one-off interactive page with a live simulator + a quiz, see
// e.g. src/app/strategies/moving-average-crossover/page.tsx) which
// Next.js resolves ahead of this dynamic one for that exact path —
// excluded here too so there's only ever one static page generated for
// each of these slugs.
const INTERACTIVE_SLUGS = [
  // Free tier
  "moving-average-crossover",
  "support-and-resistance",
  "trendline-trading",
  "rsi-overbought-oversold",
  "macd-signal-line-crossover",
  "bollinger-band-basics",
  "range-breakout",
  "candlestick-reversal-basics",
  "fibonacci-retracement-basics",
  "basic-chart-patterns",
  // Intermediate tier
  "rsi-divergence",
  "macd-divergence",
  "stochastic-oscillator",
  "cci-strategies",
  "williams-percent-r",
  "momentum-rate-of-change",
  "relative-strength-rotation",
  "on-balance-volume",
  "adx-dmi-trend-strength",
  "supertrend",
  "parabolic-sar",
  "heikin-ashi-trend",
  "atr-volatility-breakout",
  "keltner-channel-pullback",
  "ma-pullback-continuation",
  "pivot-points",
  "vwap-reversion-trend",
  "opening-range-breakout",
  "gap-fill-gap-and-go",
  "inside-bar-nr7",
  "dow-theory",
  "supply-and-demand-zones",
  "head-and-shoulders",
  "flags-pennants-wedges",
  "cup-and-handle",
  "multi-timeframe-analysis",
  "trading-styles-scalp-day-swing-position",
  // Advanced tier
  "wyckoff-method",
  "volume-spread-analysis",
  "market-profile",
  "volume-profile",
  "order-flow-footprint-charts",
  "anchored-vwap",
  "ict-smart-money-concepts",
  "elliott-wave-theory",
  "harmonic-patterns",
  "gann-methods",
  "fibonacci-confluence",
  "cycle-analysis",
  "ichimoku-advanced",
  "renko-kagi-point-figure",
  "turtle-trading-donchian",
  "time-series-momentum",
  "connors-rsi-2",
  "elder-triple-screen",
  "ttm-squeeze",
  "pairs-trading-stat-arb",
  "intermarket-analysis",
];

export function generateStaticParams() {
  return strategies.filter((s) => !INTERACTIVE_SLUGS.includes(s.slug)).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/strategies/[slug]">): Promise<Metadata> {
  const s = getStrategy((await params).slug);
  if (!s) return {};
  return { title: s.name, description: s.summaryOneLine };
}

const TONE_CLASS = {
  accent: "bg-accent/12 text-accent",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
} as const;

// Text colour for the heading itself, not just its icon chip — the colour
// is part of what makes each section feel like its own moment rather than
// the same dark-grey heading repeated with a different icon.
const TONE_TEXT_CLASS = {
  accent: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

function SectionHeading({
  id,
  icon: Icon,
  tone = "accent",
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  tone?: keyof typeof TONE_CLASS;
  children: ReactNode;
}) {
  return (
    <h2
      id={id}
      className={`flex items-center gap-3 scroll-mt-24 text-2xl font-bold tracking-tight sm:text-3xl ${TONE_TEXT_CLASS[tone]}`}
      style={{ fontFamily: "var(--font-heading)" }}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}>
        <Icon className="size-5" />
      </span>
      {children}
    </h2>
  );
}

// Quick-jump pills — these pages have gotten long with the deeper content, so
// a short nav at the top lets a visitor skip straight to what they want.
function QuickNav({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Jump to section" className="mt-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-border-strong bg-surface px-3.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{value}</div>
    </div>
  );
}

export default async function StrategyPage({ params }: PageProps<"/strategies/[slug]">) {
  const s = getStrategy((await params).slug);
  if (!s) notFound();

  // Paywall UI isn't wired up yet — Stripe isn't set up (see CLAUDE.md). Every tier is fully
  // readable for now; the tier badge below previews what will eventually gate the non-free ones.

  return (
    <>
      <StrategyBackLink />

      <header className="detail-hero mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{STRATEGY_TIER_LABELS[s.tier]}</span>
            {s.stepByStep.length > 0 && (
              <span className="badge badge-success inline-flex items-center gap-1">
                <PlayIcon className="size-3" />
                In-depth guide
              </span>
            )}
            {s.tier !== "free" && (
              <span className="badge badge-promo inline-flex items-center gap-1">
                <LinkIcon className="size-3" />
                Premium library
              </span>
            )}
            {s.controversyFlag && (
              <span className="badge badge-warning inline-flex items-center gap-1">
                <ShieldIcon className="size-3" />
                Debated among traders
              </span>
            )}
          </div>
          <p className="meta mt-3">{s.refId}</p>
          <h1 className="page-title mt-1">{s.name}</h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{s.publicTeaser}</p>
        </div>

        <dl className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <Stat label="Style" value={STRATEGY_CATEGORY_LABELS[s.category]} />
          <Stat label="Difficulty" value={STRATEGY_DIFFICULTY_LABELS[s.difficulty]} />
          <Stat label="Execution" value={STRATEGY_EXECUTION_LABELS[s.executionType]} />
        </dl>
      </header>

      <QuickNav
        items={[
          { href: "#concept-heading", label: "Core concept" },
          { href: "#rules-heading", label: "Rules" },
          ...(s.stepByStep.length > 0 ? [{ href: "#walkthrough-heading", label: "Step by step" }] : []),
          { href: "#conditions-heading", label: "Market conditions" },
          ...(s.videos.length > 0 ? [{ href: "#videos-heading", label: "Videos" }] : []),
        ]}
      />

      {s.controversyFlag && (
        <p className="badge-warning mt-6 flex items-start gap-2 rounded-lg px-4 py-3 text-base font-medium leading-relaxed max-w-3xl">
          <ShieldIcon className="mt-0.5 size-5 shrink-0" />
          This is one of the more debated methods on the site. It&apos;s widely taught and widely
          marketed — read Market conditions and Common pitfalls below with extra scepticism before
          treating it as proven.
        </p>
      )}

      {s.image && (
        <figure className="mt-8 overflow-hidden rounded-xl border border-accent/30 bg-surface shadow-glow">
          <Image
            src={s.image.src}
            alt={s.image.caption}
            width={1200}
            height={675}
            className="w-full"
            priority
          />
          <figcaption className="border-t border-border bg-surface-2 px-4 py-3">
            <span className="meta font-medium text-foreground">{s.image.caption}</span>
            {s.image.kind === "synthetic" && (
              <span className="block text-xs text-subtle">
                Illustrative chart generated from synthetic data to show the setup — not a real
                historical trade.
              </span>
            )}
          </figcaption>
        </figure>
      )}

      {/* Core concept — a pull-quote, not another icon-heading-plus-grey-
          paragraph block. The one idea worth reading first gets the one
          moment of genuinely large type on the page. */}
      <section aria-labelledby="concept-heading" className="mt-10 max-w-3xl">
        <h2
          id="concept-heading"
          className="text-sm font-bold uppercase tracking-wider text-accent scroll-mt-24"
        >
          Core concept
        </h2>
        <blockquote
          className="mt-3 border-l-4 border-accent pl-5 text-2xl font-medium italic leading-snug text-foreground sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {s.coreConcept}
        </blockquote>
        {s.toolsAndDefaults && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
            <strong className="font-semibold text-foreground">Tools &amp; defaults: </strong>
            {s.toolsAndDefaults}
          </p>
        )}
      </section>

      {/* Rules — three lettered, tinted cards instead of three identical
          plain boxes, so entry/exit/stop read as three different kinds of
          decision rather than three copies of the same card. */}
      <section aria-labelledby="rules-heading" className="mt-10">
        <SectionHeading id="rules-heading" icon={BookIcon}>
          Rules as traditionally taught
        </SectionHeading>
        {s.rules.kind === "structured" ? (
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-gold-ink">
                  E
                </span>
                <dt className="text-lg font-bold text-foreground">Entry</dt>
              </div>
              <dd className="mt-3 text-base leading-relaxed text-foreground/90">{s.rules.entry}</dd>
            </div>
            <div className="rounded-xl border border-border-strong bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base font-bold text-foreground">
                  X
                </span>
                <dt className="text-lg font-bold text-foreground">Exit</dt>
              </div>
              <dd className="mt-3 text-base leading-relaxed text-foreground/90">{s.rules.exit}</dd>
            </div>
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger text-base font-bold text-white">
                  S
                </span>
                <dt className="text-lg font-bold text-foreground">Stop</dt>
              </div>
              <dd className="mt-3 text-base leading-relaxed text-foreground/90">{s.rules.stop}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{s.rules.text}</p>
        )}
        {s.typicalTimeframes.length > 0 && (
          <p className="meta mt-4">
            Typical timeframes:{" "}
            {s.typicalTimeframes.map((t) => STRATEGY_TIMEFRAME_LABELS[t]).join(", ")}
          </p>
        )}
        {s.stepByStep.length > 0 && (
          <a
            href="#walkthrough-heading"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-success hover:underline"
          >
            <PlayIcon className="size-3.5" />
            That&apos;s the quick version — see the full step-by-step walkthrough below
          </a>
        )}
      </section>

      {s.stepByStep.length > 0 && (
        <section aria-labelledby="walkthrough-heading" className="mt-10">
          <SectionHeading id="walkthrough-heading" icon={PlayIcon} tone="success">
            Step by step: how to actually trade this
          </SectionHeading>
          <p className="meta mt-2 max-w-2xl">
            The full process, broken into {s.stepByStep.length} steps — click one to open it, and
            check it off once you&apos;ve got it down.
          </p>
          <div className="mt-4">
            <StrategyWalkthrough slug={s.slug} steps={s.stepByStep} />
          </div>
        </section>
      )}

      {Object.keys(s.assetClassNotes).length > 0 && (
        <section aria-labelledby="markets-heading" className="mt-10">
          <SectionHeading id="markets-heading" icon={LayersIcon}>
            How it plays out by market
          </SectionHeading>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(s.assetClassNotes).map(([market, note]) => (
              <li key={market} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-lg font-bold text-foreground">
                  {STRATEGY_MARKET_LABELS[market as keyof typeof STRATEGY_MARKET_LABELS] ?? market}
                </h3>
                <p className="mt-1.5 text-base leading-relaxed text-foreground/90">{note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Market conditions — three tinted panels instead of three lines of
          coloured inline text. The colour now carries a background and an
          icon, not just a word, so each state is readable as its own block
          at a glance rather than three paragraphs that only differ by hue. */}
      <section aria-labelledby="conditions-heading" className="mt-10">
        <SectionHeading id="conditions-heading" icon={InfoIcon} tone="warning">
          Market conditions
        </SectionHeading>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-success/30 bg-success/8 p-4">
            <dt className="flex items-center gap-2 text-lg font-bold text-success">
              <CheckIcon className="size-5" />
              Works best
            </dt>
            <dd className="mt-2.5 text-base leading-relaxed text-foreground/90">
              {s.marketConditions.worksBest}
            </dd>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/8 p-4">
            <dt className="flex items-center gap-2 text-lg font-bold text-warning">
              <InfoIcon className="size-5" />
              Struggles
            </dt>
            <dd className="mt-2.5 text-base leading-relaxed text-foreground/90">
              {s.marketConditions.struggles}
            </dd>
          </div>
          <div className="rounded-xl border border-danger/30 bg-danger/8 p-4">
            <dt className="flex items-center gap-2 text-lg font-bold text-danger">
              <ShieldIcon className="size-5" />
              Common failure mode
            </dt>
            <dd className="mt-2.5 text-base leading-relaxed text-foreground/90">
              {s.marketConditions.failureModes}
            </dd>
          </div>
        </dl>
        {s.commonPitfalls.length > 0 && (
          <div className="mt-5 rounded-xl border border-warning/30 bg-warning/5 p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <InfoIcon className="size-5 text-warning" />
              Common pitfalls
            </h3>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-foreground/90">
              {s.commonPitfalls.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <span aria-hidden="true" className="font-bold text-warning">
                    —
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="practical-heading" className="mt-10">
        <SectionHeading id="practical-heading" icon={MonitorIcon}>
          Testing this yourself
        </SectionHeading>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="text-lg font-bold text-foreground">Platform / testability</dt>
            <dd className="mt-1.5 text-base leading-relaxed text-foreground/90">{s.platformTestability}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="text-lg font-bold text-foreground">Data needed</dt>
            <dd className="mt-1.5 text-base leading-relaxed text-foreground/90">{s.dataRequirement}</dd>
          </div>
        </dl>
      </section>

      {s.videos.length > 0 && (
        <section aria-labelledby="videos-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="videos-heading" icon={PlayIcon} tone="danger">
            Watch and learn
          </SectionHeading>
          <p className="meta mt-2">
            Videos we found genuinely useful for this strategy — from outside creators we don&apos;t
            control, so we haven&apos;t fact-checked every claim made in them. Judge the content on
            its own merits.
          </p>
          <ul className="mt-4 space-y-4">
            {s.videos.map((v) => {
              const thumbnail = youtubeThumbnail(v.url);
              return (
                <li key={v.url} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-lg font-bold text-foreground">{v.title}</p>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener"
                    className="group relative mt-3 block aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface-2"
                  >
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={`Thumbnail for ${v.title}`}
                        fill
                        sizes="(min-width: 640px) 24rem, 100vw"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-muted">
                        Watch on YouTube
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
                      <span className="flex size-12 items-center justify-center rounded-full bg-danger/90 text-white shadow-glow">
                        <PlayIcon className="size-5" />
                      </span>
                    </span>
                  </a>
                  {v.note && <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">{v.note}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {s.markets.length > 0 && (
        <section aria-labelledby="tags-heading" className="mt-10">
          <SectionHeading id="tags-heading" icon={TagIcon}>
            Markets
          </SectionHeading>
          <ul className="mt-4 flex flex-wrap gap-2">
            {s.markets.map((m) => (
              <li key={m} className="pill">
                {STRATEGY_MARKET_LABELS[m]}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="meta mt-10 max-w-3xl">
        This page describes how {s.name} is traditionally defined and taught. It is not a
        recommendation to use it, not financial advice, and not a claim that it will make you
        money. Markets involve real risk of loss. See the full{" "}
        <a href="/disclaimer" className="text-accent hover:underline">
          disclaimer
        </a>
        .
      </p>
    </>
  );
}
