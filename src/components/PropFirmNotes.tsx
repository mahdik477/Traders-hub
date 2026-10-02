// "How to read this page" — the notes shown above the prop firm listings and
// pricing tables, collapsed until clicked.
export default function PropFirmNotes({
  currencies,
  filterNote = false,
}: {
  /** Shown as a "prices aren't converted" note when there's more than one. */
  currencies: string[];
  filterNote?: boolean;
}) {
  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center rounded-full border border-border-strong text-xs text-muted"
          >
            i
          </span>
          How to read this page
        </span>
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <ul className="meta list-disc space-y-1.5 border-t border-border px-4 py-4 pl-9 marker:text-subtle">
        <li>
          <strong className="font-semibold text-foreground">Rules:</strong> forex
          rules are shown as a percentage of the account size; futures rules are
          fixed US dollar amounts.
        </li>
        {currencies.length > 1 ? (
          <li>
            Prices are shown in each firm&apos;s own currency ({currencies.join(", ")})
            and are not converted.
          </li>
        ) : (
          <li>Prices are shown in {currencies[0]}.</li>
        )}
        {filterNote && (
          <li>
            The max price filter and the &ldquo;From&rdquo; price on each firm
            card use the discounted price where there is one. Monthly
            subscriptions are compared using one month&apos;s fee.
          </li>
        )}
        <li>
          Prices, promotions and rules change often. Always check the firm&apos;s
          own website before buying. A dash (—) means we haven&apos;t confirmed
          that detail from the firm&apos;s own pages yet. &ldquo;None&rdquo; means
          the firm says there is no such limit. We do not verify trading
          performance.
        </li>
      </ul>
    </details>
  );
}
