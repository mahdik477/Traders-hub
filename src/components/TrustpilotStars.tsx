import type { TrustpilotRating } from "@/lib/course-types";

// Trustpilot's own published scale for the word under the star rating.
function trustpilotLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Great";
  if (rating >= 2.5) return "Average";
  if (rating >= 2) return "Poor";
  return "Bad";
}

// "★★★★☆ 4.0 · Great · 3 reviews" — links out to Trustpilot when we have a
// URL. Rating is whatever the data file states — we don't verify it
// ourselves, we just display it with its source named.
export default function TrustpilotStars({
  rating,
  size = "md",
}: {
  rating: TrustpilotRating;
  size?: "sm" | "md";
}) {
  const stars = "★".repeat(Math.round(rating.rating)) + "☆".repeat(5 - Math.round(rating.rating));
  const content = (
    <>
      <span aria-hidden="true" className={`tracking-tight text-warning ${size === "md" ? "text-base" : ""}`}>
        {stars}
      </span>
      <span className="font-semibold text-foreground">{rating.rating.toFixed(1)}</span>
      <span className="meta">· {trustpilotLabel(rating.rating)}</span>
      {rating.reviewCount != null && (
        <span className="meta">
          · {rating.reviewCount} review{rating.reviewCount === 1 ? "" : "s"} on Trustpilot
        </span>
      )}
    </>
  );

  if (!rating.url) {
    return <div className="flex flex-wrap items-center gap-1.5">{content}</div>;
  }

  return (
    <a
      href={rating.url}
      target="_blank"
      rel="noopener"
      className="flex flex-wrap items-center gap-1.5 hover:underline"
    >
      {content}
    </a>
  );
}
