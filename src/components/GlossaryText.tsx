import { Fragment } from "react";
import { matchGlossaryTerms } from "@/lib/glossary";
import GlossaryTerm from "@/components/GlossaryTerm";

// Wraps a block of strategy prose, turning any recognised technical term
// into a hoverable/tappable definition. Plain text in, plain text + a few
// GlossaryTerm spans out — safe to drop in anywhere InteractiveStrategyPage
// currently renders a strategy's own words.
export default function GlossaryText({ text }: { text: string }) {
  const segments = matchGlossaryTerms(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.entry ? (
          <GlossaryTerm key={i} term={seg.entry.term} definition={seg.entry.definition}>
            {seg.text}
          </GlossaryTerm>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}
