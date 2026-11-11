import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Plain-English definitions of the trading terms used across the site.",
};

// Every term in the strategies glossary on one page, so a search hit on a
// term has somewhere to land (the same definitions power the hover tooltips
// on strategy pages — see GlossaryTerm.tsx). Sorted A–Z; each term has its
// own anchor so /glossary#rsi links straight to it.
function glossaryAnchor(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function GlossaryPage() {
  const entries = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  const letters = [...new Set(entries.map((e) => e.term[0].toUpperCase()))];

  return (
    <div className="max-w-3xl">
      <h1 className="title-rule page-title">Glossary</h1>
      <p className="mt-3 text-lg text-muted">
        {entries.length} trading terms, each explained in a sentence or two. These are the same
        definitions that pop up when you hover a term on a{" "}
        <Link href="/strategies" className="text-accent hover:underline">
          strategy page
        </Link>
        .
      </p>

      <nav aria-label="Jump to letter" className="mt-6 flex flex-wrap gap-1.5">
        {letters.map((l) => (
          <a
            key={l}
            href={`#letter-${l}`}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {l}
          </a>
        ))}
      </nav>

      <dl className="mt-8 space-y-3">
        {entries.map((e, i) => {
          const letter = e.term[0].toUpperCase();
          const firstOfLetter = i === 0 || entries[i - 1].term[0].toUpperCase() !== letter;
          const id = glossaryAnchor(e.term);
          return (
            <div key={e.term}>
              {firstOfLetter && (
                <h2
                  id={`letter-${letter}`}
                  className="section-title mb-3 mt-8 scroll-mt-28 text-accent first:mt-0"
                >
                  {letter}
                </h2>
              )}
              <div
                id={id}
                className="scroll-mt-28 rounded-xl border border-border bg-surface p-4 target:border-accent target:shadow-glow"
              >
                <dt className="font-semibold text-foreground">{e.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{e.definition}</dd>
              </div>
            </div>
          );
        })}
      </dl>

      <p className="meta mt-10">
        Definitions are general explanations for learning, not advice and not a recommendation to
        trade anything.
      </p>
    </div>
  );
}
