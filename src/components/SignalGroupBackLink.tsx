"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { signalGroupListingHref } from "@/lib/signal-group-links";

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="back-link">
      <ChevronLeft className="size-4" aria-hidden="true" />
      Back to signal groups
    </Link>
  );
}

function BackFromQuery() {
  const from = useSearchParams().get("from");
  return <BackLink href={signalGroupListingHref(from)} />;
}

// Read the query in the browser so the group page can stay a static file.
export default function SignalGroupBackLink() {
  return (
    <Suspense fallback={<BackLink href="/signal-groups" />}>
      <BackFromQuery />
    </Suspense>
  );
}
