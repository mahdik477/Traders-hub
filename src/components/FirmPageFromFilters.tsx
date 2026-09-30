"use client";

// Parts of a firm's page that depend on the filters the visitor chose on
// /funded-accounts (carried over in the web address, e.g. ?market=futures).
// Each firm page is built ahead of time without an address, so until the
// browser reads it we show the unfiltered version.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PropFirmPricing from "@/components/PropFirmPricing";
import {
  EMPTY_FILTERS,
  filtersFromQuery,
  filtersToQuery,
  firstMatch,
  selectionFor,
  type Filters,
} from "@/lib/propfirm-filters";
import type { FirmView } from "@/lib/propfirm-types";

/** The toggle table, starting on the market / challenge / tier that match the filters. */
export function FirmPricingFromFilters({ firm }: { firm: FirmView }) {
  return (
    <Suspense fallback={<FirmPricing firm={firm} filters={EMPTY_FILTERS} />}>
      <FirmPricingFromAddress firm={firm} />
    </Suspense>
  );
}

function FirmPricingFromAddress({ firm }: { firm: FirmView }) {
  const filters = filtersFromQuery(useSearchParams());
  return <FirmPricing firm={firm} filters={filters} />;
}

function FirmPricing({ firm, filters }: { firm: FirmView; filters: Filters }) {
  const [selection, setSelection] = useState(() => {
    const match = firstMatch(firm, filters);
    return match ? selectionFor(match) : {};
  });
  return <PropFirmPricing firm={firm} selection={selection} onSelect={setSelection} />;
}

/** "Back to all firms", keeping the visitor's filters. */
export function BackToFirmsLink() {
  return (
    <Suspense fallback={<BackLink query="" />}>
      <BackLinkFromAddress />
    </Suspense>
  );
}

function BackLinkFromAddress() {
  return <BackLink query={filtersToQuery(filtersFromQuery(useSearchParams()))} />;
}

function BackLink({ query }: { query: string }) {
  return (
    <Link href={`/funded-accounts${query}`} className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground">
      ← Back to all firms
    </Link>
  );
}
