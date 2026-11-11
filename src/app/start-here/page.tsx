import type { Metadata } from "next";
import Link from "next/link";
import StartHerePath from "@/components/StartHerePath";
import { START_HERE_PATH } from "@/lib/start-here";

export const metadata: Metadata = {
  title: "New to trading? Start here",
  description:
    "A guided path for beginners: learn the basics, practise three free strategies on live simulators, then understand funded-account rules before paying a fee.",
};

export default function StartHerePage() {
  const steps = START_HERE_PATH.reduce((n, s) => n + s.steps.length, 0);
  return (
    <>
      <p className="eyebrow">Guided path</p>
      <h1 className="page-title mt-2">New to trading? Start here.</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {steps} steps in a sensible order: the basics first, then practice on a chart, then — only then —
        how funded accounts work. Skip anything you already know. Nothing here is advice, and nothing here
        promises you&apos;ll make money; it&apos;s the order we&apos;d want to have learned things in.
      </p>
      <StartHerePath />
      <p className="meta mt-10 max-w-2xl">
        Finished? Browse the full{" "}
        <Link href="/strategies" className="text-accent underline">
          strategy library
        </Link>{" "}
        or compare{" "}
        <Link href="/funded-accounts/compare" className="text-accent underline">
          prop firm plans
        </Link>
        . Markets involve real risk of loss; see the{" "}
        <Link href="/disclaimer" className="text-accent underline">
          disclaimer
        </Link>
        .
      </p>
    </>
  );
}
