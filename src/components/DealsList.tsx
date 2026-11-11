"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Deal } from "@/lib/deals";
import { daysSince } from "@/lib/deals";
import { money, sizeLabel } from "@/lib/format-money";
import { MARKET_LABELS } from "@/components/PropFirmPricing";
import CopyButton from "@/components/CopyButton";
import FirmBadge from "@/components/FirmBadge";
import { formatDate } from "@/components/PropFirmReviews";

// The Deals page body: filter chips (market, code vs automatic), then one
// card per deal with the code, the discount, an example price and the date
// we last checked. Dates older than a month get a "re-check" nudge, since
// promo codes expire quietly.

const STALE_DAYS = 30;

export default function DealsList({ deals }: { deals: Deal[] }) {
  const [market, setMarket] = useState<"" | "forex" | "futures">("");
  const [onlyCodes, setOnlyCodes] = useState(false);

  const shown = useMemo(
    () => deals.filter((d) => (!market || d.market === market) && (!onlyCodes || d.code != null)),
    [deals, market, onlyCodes],
  );

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["", "All markets"],
            ["forex", "Forex"],
            ["futures", "Futures"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={market === v}
            onClick={() => setMarket(v)}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
              market === v
                ? "border-accent bg-accent/12 text-foreground"
                : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <label className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={onlyCodes}
            onChange={(e) => setOnlyCodes(e.target.checked)}
            className="size-4 accent-[var(--color-gold-fill)]"
          />
          Only deals with a code
        </label>
      </div>

      <p aria-live="polite" className="meta mt-3">
        <span className="font-semibold text-foreground">{shown.length}</span> of {deals.length} active deals.
        Listed with codes first, then A to Z — not by size of discount.
      </p>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center text-muted">
          No deals match these filters.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {shown.map((d, i) => (
            <DealCard key={`${d.firmId}-${d.market}`} deal={d} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DealCard({ deal: d, index }: { deal: Deal; index: number }) {
  // Worked out in the browser only: the page is built once, so computing
  // "N days ago" at build time would disagree with the visitor's clock.
  const [age, setAge] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAge(daysSince(d.lastVerified));
  }, [d.lastVerified]);
  const stale = age != null && age > STALE_DAYS;
  const pct = d.minDiscountPct === d.maxDiscountPct ? `${d.maxDiscountPct}%` : `${d.minDiscountPct}–${d.maxDiscountPct}%`;
  const period = d.example?.monthly ? "/month" : "";

  return (
    <li
      className="deal-card lift-card relative flex flex-col rounded-xl border border-border bg-surface p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <FirmBadge name={d.firmName} logo={d.logo} logoBg={d.logoBg} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">
            <Link href={`/funded-accounts/${d.firmId}?market=${d.market}`} className="hover:text-accent">
              {d.firmName}
            </Link>
          </h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="pill">{MARKET_LABELS[d.market]}</span>
            <span className="badge badge-promo">{pct} off</span>
            {d.hasReviewAlert && <span className="badge badge-warning whitespace-normal">Payout complaints in recent reviews</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3">
        {d.code ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Promo code</p>
              <p className="deal-code mt-0.5 font-mono text-xl font-bold tracking-wider text-accent">{d.code}</p>
            </div>
            <CopyButton value={d.code} label={`Copy code ${d.code}`} variant="primary">
              Copy code
            </CopyButton>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="eyebrow">No code needed</p>
            <p className="mt-0.5 text-sm text-foreground">The discount shows on the firm&apos;s pricing page automatically.</p>
          </div>
        )}
      </div>

      {d.example && (
        <p className="mt-4 text-sm text-foreground/90">
          <span className="font-semibold">Example: </span>
          {d.example.plan}, {sizeLabel(d.example.size, d.currency)} — {money(d.example.promo, d.currency)}
          {period} <span className="text-subtle line-through">{money(d.example.standard, d.currency)}{period}</span>
          {d.discountedAccounts > 1 && (
            <span className="text-muted">
              {" "}
              · {d.discountedAccounts} account sizes discounted
            </span>
          )}
        </p>
      )}

      <p className={`meta mt-3 ${stale ? "text-warning" : ""}`}>
        {d.lastVerified ? (
          <>
            Verified on the firm&apos;s pricing page {formatDate(d.lastVerified)}
            {age != null && ` (${age === 0 ? "today" : `${age} day${age === 1 ? "" : "s"} ago`})`}.
            {stale && " Over a month old — the code may have ended, so check before you rely on it."}
          </>
        ) : (
          "Verification date not recorded for this firm."
        )}
      </p>

      <Link href={`/funded-accounts/${d.firmId}?market=${d.market}`} className="btn btn-outline mt-4 w-full">
        See full pricing
        <span className="sr-only"> for {d.firmName}</span>
      </Link>
    </li>
  );
}
