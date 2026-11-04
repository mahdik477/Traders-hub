import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { LEARN_TOPICS, learnTopicIndex, type LearnTopic } from "@/lib/learn-topics";

// The shared shell every /learn/<slug> page wraps its content in — hero,
// an in-page jump nav, and a prev/next footer through the 9-part course.
// Mirrors InteractiveStrategyPage.tsx's job for the strategies section:
// one shell, not nine near-identical headers.
export default function LearnPageShell({
  topic,
  toc,
  children,
}: {
  topic: LearnTopic;
  toc: { id: string; label: string }[];
  children: ReactNode;
}) {
  const index = learnTopicIndex(topic.slug);
  const prev = index > 0 ? LEARN_TOPICS[index - 1] : null;
  const next = index < LEARN_TOPICS.length - 1 ? LEARN_TOPICS[index + 1] : null;
  const Icon = topic.icon;

  return (
    <div>
      <Link href="/learn" className="back-link">
        <ChevronLeftIcon className="size-4" />
        Back to Learn
      </Link>

      <header className="detail-hero mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">
              Part {index + 1} of {LEARN_TOPICS.length}
            </span>
            <span className="pill">{topic.readMinutes} min read</span>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <Icon className="size-7" />
            </span>
            <div className="min-w-0">
              <h1 className="page-title">{topic.title}</h1>
              <p className="mt-2 max-w-2xl text-lg leading-relaxed text-muted">{topic.summary}</p>
            </div>
          </div>
        </div>
      </header>

      {toc.length > 0 && (
        <nav aria-label="Jump to section" className="mt-6 -mx-1 flex flex-wrap gap-2.5 px-1 pb-1">
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition-all hover:border-accent hover:bg-accent/10 hover:text-accent hover:shadow-glow"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-10 max-w-3xl space-y-12">{children}</div>

      <p className="meta mt-12 max-w-3xl border-t border-border pt-6">
        This page explains general trading concepts for learning purposes only — it is not
        financial advice and not a recommendation to trade any particular market or instrument.
        See the full{" "}
        <Link href="/disclaimer" className="text-accent hover:underline">
          disclaimer
        </Link>
        .
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 border-t border-border pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/learn/${prev.slug}`}
            className="lift-card flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
          >
            <ChevronLeftIcon className="size-5 shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="meta block">Previous</span>
              <span className="block truncate font-semibold text-foreground">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.slug}`}
            className="lift-card flex items-center justify-end gap-3 rounded-xl border border-border bg-surface p-4 text-right transition-colors hover:border-accent/40"
          >
            <span className="min-w-0">
              <span className="meta block">Next</span>
              <span className="block truncate font-semibold text-foreground">{next.title}</span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-muted" />
          </Link>
        ) : (
          <Link
            href="/learn"
            className="lift-card flex items-center justify-end gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 text-right transition-colors hover:border-accent/50"
          >
            <span className="min-w-0">
              <span className="meta block">That&apos;s the whole course</span>
              <span className="block truncate font-semibold text-foreground">Back to Learn overview</span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-accent" />
          </Link>
        )}
      </div>
    </div>
  );
}
