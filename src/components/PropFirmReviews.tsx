import { QuoteIcon } from "@/components/icons";
import TrustpilotStars, { StarRow } from "@/components/TrustpilotStars";
import type { FirmReviews, ReviewRating } from "@/lib/propfirm-types";

// The "Reviews" box on a firm page: the firm's Trustpilot and Google ratings
// as published on those sites. We don't verify them — the box names each
// source and the date it was checked. When a site shows no rating, the data
// file's note explains why instead.
export default function PropFirmReviews({ reviews }: { reviews: FirmReviews }) {
  const checked = [reviews.checked, reviews.trustpilot?.checked, reviews.google?.checked]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-8 max-w-3xl rounded-xl border border-border bg-surface p-5"
    >
      <h2 id="reviews-heading" className="section-title">
        Reviews
      </h2>
      <dl className="mt-4 space-y-5">
        <div>
          <dt className="eyebrow">Trustpilot</dt>
          <dd className="mt-1.5">
            {reviews.trustpilot && <TrustpilotStars rating={reviews.trustpilot} />}
            <Note text={reviews.trustpilotNote} hasRating={!!reviews.trustpilot} />
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Google</dt>
          <dd className="mt-1.5">
            {reviews.google && <GoogleRating rating={reviews.google} />}
            <Note text={reviews.googleNote} hasRating={!!reviews.google} />
          </dd>
        </div>
      </dl>

      {reviews.trustpilotQuotes.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="eyebrow">What reviewers say on Trustpilot</h3>
          <p className="meta mt-1.5 italic">
            Short excerpts from recent Trustpilot reviews, picked to show a range of opinions.
            They&apos;re written by Trustpilot users and haven&apos;t been verified by us.
          </p>
          <ul className="mt-4 space-y-3">
            {reviews.trustpilotQuotes.map((q, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="flex items-start gap-3">
                  <QuoteIcon className="size-5 shrink-0 text-accent/50" />
                  <p className="text-sm text-foreground">&ldquo;{q.quote}&rdquo;</p>
                </div>
                <p className="meta mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 pl-8">
                  <span className="font-medium text-foreground">{q.author}</span>
                  {q.stars != null && (
                    <span className="flex items-center gap-1.5">
                      <StarRow rating={q.stars} iconPx={12} />
                      <span className="sr-only">{q.stars} out of 5 stars</span>
                    </span>
                  )}
                  {q.date && <span>{formatDate(q.date)}</span>}
                  {q.url && (
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center underline hover:text-foreground"
                    >
                      Read on Trustpilot
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 text-xs italic text-subtle">
        Ratings as shown on Trustpilot and Google{checked && ` on ${formatDate(checked)}`}.
        Reviews are written by the sites&apos; users and are not verified by us.
      </p>
    </section>
  );
}

function Note({ text, hasRating }: { text: string | null; hasRating: boolean }) {
  if (text) return <p className={`meta ${hasRating ? "mt-1.5" : ""}`}>{text}</p>;
  if (!hasRating) return <p className="meta">Not checked yet.</p>;
  return null;
}

// "4.8/5 ★★★★★ · 1,234 reviews on Google" — same layout as the Trustpilot
// rating, without Trustpilot's word labels (Google doesn't use them).
function GoogleRating({ rating }: { rating: ReviewRating }) {
  const content = (
    <>
      <span className="text-lg font-bold text-warning">{rating.rating.toFixed(1)}/5</span>
      <StarRow rating={rating.rating} />
      {rating.reviewCount != null && (
        <span className="meta">
          {rating.reviewCount.toLocaleString("en-US")} review{rating.reviewCount === 1 ? "" : "s"} on
          Google
        </span>
      )}
    </>
  );

  if (!rating.url) return <div className="flex flex-wrap items-center gap-2">{content}</div>;
  return (
    <a
      href={rating.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-wrap items-center gap-2 hover:underline"
    >
      {content}
    </a>
  );
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}
