// Warning box on a firm's page when many recent public reviews describe the
// same problem (e.g. refused payouts). We list the firm anyway, so visitors
// can see everything — but they should see this first.
import { formatDate } from "@/components/PropFirmReviews";
import type { ReviewAlert } from "@/lib/propfirm-types";

// TEAM REMINDER (2026-10-11): UAE defamation law can treat negative statements
// about a company as a criminal matter, even if true. Get UAE legal advice on
// publishing these alerts before the site goes fully live, then set this to
// false (and delete the reminder from CLAUDE.md).
const SHOW_LEGAL_REMINDER = true;

export default function PropFirmReviewAlert({ alert }: { alert: ReviewAlert }) {
  return (
    <section
      aria-labelledby="review-alert-heading"
      className="mt-6 max-w-3xl rounded-xl border border-warning/40 bg-warning/10 p-5"
    >
      <h2 id="review-alert-heading" className="flex items-center gap-2 font-semibold text-warning">
        <span aria-hidden="true">⚠</span> Recent reviews
      </h2>
      <p className="mt-2 text-foreground">{alert.summary}</p>
      <p className="meta mt-3">
        Checked {formatDate(alert.checked)}. These are public reviews that we have not verified,
        and a firm may dispute them. Read the latest reviews yourself before buying
        {alert.url ? (
          <>
            {": "}
            <a href={alert.url} target="_blank" rel="noopener noreferrer" className="underline">
              recent reviews on Trustpilot
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </>
        ) : (
          "."
        )}
      </p>
      {SHOW_LEGAL_REMINDER && (
        <p className="mt-3 rounded-lg border border-dashed border-danger/60 px-3 py-2 text-xs text-danger">
          Team reminder (remove before launch): get UAE legal advice on publishing review
          warnings like this one before the site goes fully live. UAE defamation rules can apply
          even when statements are true.
        </p>
      )}
    </section>
  );
}
