"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="back-link">
      <ChevronLeftIcon className="size-4" />
      Back to strategies
    </Link>
  );
}

function BackFromQuery() {
  const params = useSearchParams();
  const qs = params.toString();
  return <BackLink href={qs ? `/strategies?${qs}` : "/strategies"} />;
}

export default function StrategyBackLink() {
  return (
    <Suspense fallback={<BackLink href="/strategies" />}>
      <BackFromQuery />
    </Suspense>
  );
}
