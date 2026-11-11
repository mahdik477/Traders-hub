import type { Metadata } from "next";
import Link from "next/link";
import { getSection } from "@/lib/sections";
import { LEARN_TOPICS } from "@/lib/learn-topics";
import TerminalStatPanel from "@/components/TerminalStatPanel";
import IconPatternBackdrop from "@/components/IconPatternBackdrop";
import { BookIcon, ChevronRightIcon } from "@/components/icons";
import { DoneTick, ProgressSummary } from "@/components/ProgressBits";
import PageIntro from "@/components/PageIntro";

const section = getSection("learn");
const totalMinutes = LEARN_TOPICS.reduce((sum, t) => sum + t.readMinutes, 0);

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

export default function LearnPage() {
  return (
    <div>
      <PageIntro
        size="lg"
        eyebrow={section.title}
        title={
          <>Start here if you&apos;re{" "}
            <span className="brand-wordmark" style={{ fontFamily: "var(--font-heading)" }}>
              new
            </span>{" "}
            to trading</>
        }
        lede={<>A 9-part walkthrough of everything a beginner actually needs: what you can trade, how
            orders work, reading a chart, timeframes, analysis, risk, psychology and costs. No
            account, no email, free. Go in order or jump straight to what you need.</>}
        aside={
          <TerminalStatPanel
          caption="The course, at a glance"
          backdrop={<IconPatternBackdrop icons={LEARN_TOPICS.map((t) => t.icon)} />}
          stats={[
            { label: "Parts", value: LEARN_TOPICS.length },
            { label: "Minutes, start to finish", value: totalMinutes },
            { label: "Quick-check quizzes", value: LEARN_TOPICS.length },
            { label: "Account needed", value: 0 },
          ]}
          footnote="Every part is free and open — no signup wall, no paid tier."
        />
        }
      >
        <div className="flex flex-wrap items-center gap-3">
            <Link href={`/learn/${LEARN_TOPICS[0].slug}`} className="btn btn-primary">
              <BookIcon className="size-4" />
              Start with part 1
            </Link>
            <Link href="/strategies" className="btn btn-outline">
              Already know the basics? Try a strategy
            </Link>
          </div>
      </PageIntro>

      <div className="mt-6 border-t border-border pt-10">
        <h2 className="section-title text-2xl sm:text-3xl">The 9 parts</h2>
        <ProgressSummary kind="learn" ids={LEARN_TOPICS.map((t) => t.slug)} noun="parts" className="mt-4 max-w-xl" />
        <p className="mt-2 max-w-xl text-muted">Built to go in order, but every part stands on its own if you already know the earlier ones.</p>

        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LEARN_TOPICS.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <li key={topic.slug}>
                <Link
                  href={`/learn/${topic.slug}`}
                  className="lift-card group relative flex h-full gap-4 overflow-hidden rounded-xl border border-border bg-surface p-5"
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-3xl font-bold text-border-strong sm:text-4xl"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                      <Icon className="size-4.5" />
                    </span>
                    <h3 className="mt-2.5 flex flex-wrap items-center gap-2 text-lg font-bold text-foreground group-hover:text-accent">
                      {topic.title}
                      <DoneTick kind="learn" id={topic.slug} />
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{topic.summary}</p>
                    <span className="meta mt-3 flex items-center gap-1 text-accent">
                      {topic.readMinutes} min
                      <ChevronRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
