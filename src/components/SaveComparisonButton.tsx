"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toggleComparison, useIsComparisonSaved, type ComparisonKind } from "@/lib/local-store";

// "Save this comparison" on the compare pages. Stores the page's own query
// string (the ?p=… or ?ids=… that defines the comparison) plus a title,
// browser-first, synced to the account when signed in. My Hub lists them.
export default function SaveComparisonButton({ kind, title }: { kind: ComparisonKind; title: string }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  useEffect(() => {
    // Only the browser knows the real address.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(window.location.search);
  }, [searchParams]);
  const saved = useIsComparisonSaved(kind, query);
  if (!query) return null;
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggleComparison(kind, query, title)}
      className={`btn ${saved ? "btn-primary" : "btn-outline"}`}
    >
      <Bookmark className="size-4" aria-hidden="true" fill={saved ? "currentColor" : "none"} />
      {saved ? "Comparison saved" : "Save this comparison"}
    </button>
  );
}
