"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

const linkClass = "back-link";

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className={linkClass}>
      <ChevronLeftIcon className="size-4" />
      Back to tools
    </Link>
  );
}

function safeListingHref(back: string | null): string {
  if (!back) return "/tools";
  const params = new URLSearchParams(back);
  const next = new URLSearchParams();
  const category = params.get("category");
  const q = params.get("q");
  if (category) next.set("category", category);
  if (q) next.set("q", q);
  const qs = next.toString();
  return qs ? `/tools?${qs}` : "/tools";
}

function BackFromQuery() {
  const back = useSearchParams().get("back");
  return <BackLink href={safeListingHref(back)} />;
}

export default function ToolBackLink() {
  return (
    <Suspense fallback={<BackLink href="/tools" />}>
      <BackFromQuery />
    </Suspense>
  );
}
