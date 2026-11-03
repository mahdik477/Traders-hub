// A featured-listing mark. The words are the label. The icon is only a
// marker, so the badge is not identified by colour alone. It is not a
// score of trading results.

export default function OurChoiceBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "our-choice-badge our-choice-prominent" : "our-choice-badge"}>
      {compact ? <StarMark /> : <BookmarkMark />}
      <span>Our choice</span>
      <span className="sr-only">. Featured listing on Tradox, not a score of trading results.</span>
    </span>
  );
}

function BookmarkMark() {
  return (
    <svg viewBox="0 0 12 12" className="our-choice-mark" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 1.25h6a.75.75 0 0 1 .75.75v8.15a.4.4 0 0 1-.63.33L6 8.55 2.88 10.48a.4.4 0 0 1-.63-.33V2A.75.75 0 0 1 3 1.25Z"
      />
    </svg>
  );
}

function StarMark() {
  return (
    <svg viewBox="0 0 12 12" className="our-choice-mark" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 1.05 7.38 4.08l3.32.28-2.52 2.18.78 3.26L6 8.12 3.04 9.8l.78-3.26L1.3 4.36l3.32-.28L6 1.05Z"
      />
    </svg>
  );
}
