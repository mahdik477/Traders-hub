import type { JSX, ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import StrategyBackLink from "@/components/StrategyBackLink";
import { ShieldIcon, InfoIcon, BookIcon, LayersIcon, TagIcon, LinkIcon, MonitorIcon, QuoteIcon } from "@/components/icons";
import {
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_DIFFICULTY_LABELS,
  STRATEGY_EVIDENCE_LABELS,
  STRATEGY_EXECUTION_LABELS,
  STRATEGY_MARKET_LABELS,
  STRATEGY_TIER_LABELS,
  STRATEGY_TIMEFRAME_LABELS,
} from "@/lib/strategy-types";
import { getStrategy, strategies } from "@/lib/strategies";

export const dynamicParams = false;

export function generateStaticParams() {
  return strategies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/strategies/[slug]">): Promise<Metadata> {
  const s = getStrategy((await params).slug);
  if (!s) return {};
  return { title: s.name, description: s.summaryOneLine };
}

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="section-title flex items-center gap-2.5 scroll-mt-24">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
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

const EVIDENCE_BADGE_CLASS: Record<string, string> = {
  strong: "badge-success",
  mixed: "badge-warning",
  weak: "badge-danger",
  little: "badge-danger",
};

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
            {s.tier !== "free" && (
              <span className="badge badge-promo inline-flex items-center gap-1">
                <LinkIcon className="size-3" />
                Premium library
              </span>
            )}
            <span className={`badge ${EVIDENCE_BADGE_CLASS[s.evidence.rating]}`}>
              {STRATEGY_EVIDENCE_LABELS[s.evidence.rating]} evidence
            </span>
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

        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          <Stat label="Style" value={STRATEGY_CATEGORY_LABELS[s.category]} />
          <Stat label="Difficulty" value={STRATEGY_DIFFICULTY_LABELS[s.difficulty]} />
          <Stat label="Execution" value={STRATEGY_EXECUTION_LABELS[s.executionType]} />
          <Stat label="Evidence" value={STRATEGY_EVIDENCE_LABELS[s.evidence.rating]} />
        </dl>
      </header>

      {s.controversyFlag && (
        <p className="badge-warning mt-6 flex items-start gap-2 rounded-lg px-4 py-3 text-sm leading-relaxed max-w-3xl">
          <ShieldIcon className="mt-0.5 size-4 shrink-0" />
          This is one of the more debated methods on the site. It&apos;s widely taught and widely
          marketed, but independent testing is thin or non-existent — see Independent evidence
          below before treating it as proven.
        </p>
      )}

      {s.image && (
        <figure className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
          <Image
            src={s.image.src}
            alt={s.image.caption}
            width={1200}
            height={675}
            className="w-full"
            priority
          />
          <figcaption className="meta border-t border-border px-4 py-3">
            {s.image.caption}
            {s.image.kind === "synthetic" && (
              <span className="block text-xs text-subtle">
                Illustrative chart generated from synthetic data to show the setup — not a real
                historical trade.
              </span>
            )}
          </figcaption>
        </figure>
      )}

      <section aria-labelledby="concept-heading" className="mt-10 max-w-3xl">
        <SectionHeading id="concept-heading" icon={InfoIcon}>
          Core concept
        </SectionHeading>
        <p className="mt-3 leading-relaxed text-muted">{s.coreConcept}</p>
        {s.toolsAndDefaults && (
          <p className="mt-3 leading-relaxed text-muted">
            <strong className="font-semibold text-foreground">Tools &amp; defaults: </strong>
            {s.toolsAndDefaults}
          </p>
        )}
      </section>

      <section aria-labelledby="rules-heading" className="mt-10">
        <SectionHeading id="rules-heading" icon={BookIcon}>
          Rules as traditionally taught
        </SectionHeading>
        {s.rules.kind === "structured" ? (
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <dt className="eyebrow">Entry</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{s.rules.entry}</dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <dt className="eyebrow">Exit</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{s.rules.exit}</dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <dt className="eyebrow">Stop</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{s.rules.stop}</dd>
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
      </section>

      {Object.keys(s.assetClassNotes).length > 0 && (
        <section aria-labelledby="markets-heading" className="mt-10">
          <SectionHeading id="markets-heading" icon={LayersIcon}>
            How it plays out by market
          </SectionHeading>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(s.assetClassNotes).map(([market, note]) => (
              <li key={market} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {STRATEGY_MARKET_LABELS[market as keyof typeof STRATEGY_MARKET_LABELS] ?? market}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="conditions-heading" className="mt-10 max-w-3xl">
        <SectionHeading id="conditions-heading" icon={InfoIcon}>
          Market conditions
        </SectionHeading>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-sm font-semibold text-success">Works best</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{s.marketConditions.worksBest}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-warning">Struggles</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{s.marketConditions.struggles}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-danger">Common failure mode</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{s.marketConditions.failureModes}</dd>
          </div>
        </dl>
        {s.commonPitfalls.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-semibold text-foreground">Common pitfalls</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
              {s.commonPitfalls.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="evidence-heading" className="mt-10 max-w-3xl">
        <SectionHeading id="evidence-heading" icon={ShieldIcon}>
          Independent evidence
        </SectionHeading>
        <p className="mt-3">
          <span className={`badge ${EVIDENCE_BADGE_CLASS[s.evidence.rating]}`}>
            {STRATEGY_EVIDENCE_LABELS[s.evidence.rating]}
          </span>
        </p>
        <p className="mt-3 leading-relaxed text-muted">{s.evidence.summary}</p>
        <div className="mt-4 rounded-xl border border-border-strong bg-surface-2 p-4">
          <h3 className="text-sm font-semibold text-foreground">On winning and losing trades</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.winRateNote}</p>
        </div>
      </section>

      <section aria-labelledby="practical-heading" className="mt-10">
        <SectionHeading id="practical-heading" icon={MonitorIcon}>
          Testing this yourself
        </SectionHeading>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="eyebrow">Platform / testability</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">{s.platformTestability}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="eyebrow">Data needed</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">{s.dataRequirement}</dd>
          </div>
        </dl>
      </section>

      {s.sources.length > 0 && (
        <section aria-labelledby="sources-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="sources-heading" icon={QuoteIcon}>
            Sources
          </SectionHeading>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
            {s.sources.map((src) => (
              <li key={src.label}>{src.label}</li>
            ))}
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
        This page describes how {s.name} is traditionally defined and taught, and what independent
        research has or has not found about it. It is not a recommendation to use it, not
        financial advice, and not a claim that it will make you money. Markets involve real risk of
        loss. See the full{" "}
        <a href="/disclaimer" className="text-accent hover:underline">
          disclaimer
        </a>
        .
      </p>
    </>
  );
}
