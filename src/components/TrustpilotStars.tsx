import type { TrustpilotRating } from "@/lib/course-types";
import { StarIcon } from "@/components/icons";

// Fallback only, for an older data file that hasn't got a stored label yet —
// Trustpilot's real banding doesn't line up neatly with the number (e.g.
// we've seen 2.9 shown as "Average" and 2.7 shown as "Poor"), so this is
// an approximation, not a source of truth.
function approximateTrustpilotLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Great";
  if (rating >= 2.5) return "Average";
  if (rating >= 2) return "Poor";
  return "Bad";
}

// Five stars, proportionally filled (e.g. 2.9/5 fills exactly 58% of the row
// — not rounded to the nearest whole star). Each star is placed at an
// explicit pixel offset (no flexbox) so there's no shrink/gap ambiguity for
// the browser to resolve — the gold row is a plain overflow-hidden box
// clipped to an exact pixel width, sitting over an identical grey row.
export function StarRow({ rating, iconPx = 16 }: { rating: number; iconPx?: number }) {
  const gapPx = 2;
  const step = iconPx + gapPx;
  const totalPx = 5 * iconPx + 4 * gapPx;
  const pct = Math.max(0, Math.min(100, rating / 5));
  const fillPx = pct * totalPx;

  function stars(colorClass: string, keyPrefix: string) {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={`${keyPrefix}${i}`}
        className={`absolute top-0 ${colorClass}`}
        style={{ left: i * step, width: iconPx, height: iconPx }}
      />
    ));
  }

  return (
    <span
      className="relative inline-block"
      style={{ width: totalPx, height: iconPx }}
      aria-hidden="true"
    >
      {stars("text-border-strong", "bg")}
      <span className="absolute left-0 top-0 overflow-hidden" style={{ width: fillPx, height: iconPx }}>
        {stars("text-warning", "fg")}
      </span>
    </span>
  );
}

// "4.0 ★★★★☆ Great · 3 reviews on Trustpilot" — links out to the source when
// we have a URL. Rating is whatever the data file states — we don't verify
// it ourselves, we just display it with its source named. Also used for
// Whop ratings (same shape, different platform) — pass `platform="Whop"`.
export default function TrustpilotRatingDisplay({
  rating,
  size = "md",
  platform = "Trustpilot",
}: {
  rating: TrustpilotRating;
  size?: "sm" | "md";
  /** Which review platform this rating is from — only Trustpilot gets the
   *  approximate Excellent/Great/Average/Poor/Bad label as a fallback, since
   *  that's Trustpilot's own banding, not a universal scale. */
  platform?: string;
}) {
  const label = rating.label ?? (platform === "Trustpilot" ? approximateTrustpilotLabel(rating.rating) : null);
  const content = (
    <>
      <span className={`font-bold text-warning ${size === "md" ? "text-lg" : "text-sm"}`}>
        {rating.rating.toFixed(1)}/5
      </span>
      <StarRow rating={rating.rating} iconPx={size === "md" ? 16 : 14} />
      <span className="meta">
        {label}
        {rating.reviewCount != null &&
          `${label ? " · " : ""}${rating.reviewCount.toLocaleString("en-US")} review${rating.reviewCount === 1 ? "" : "s"} on ${platform}`}
      </span>
    </>
  );

  if (!rating.url) {
    return <div className="flex flex-wrap items-center gap-2">{content}</div>;
  }

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
