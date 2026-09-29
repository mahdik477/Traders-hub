import Link from "next/link";
import type { Section } from "@/lib/sections";

export default function ComingSoon({ section }: { section: Section }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">
        {section.status === "next-up" ? "Next up" : "Coming soon"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {section.title}
      </h1>
      <p className="mt-4 text-lg text-muted">{section.summary}</p>
      <p className="mt-8 text-muted">
        We&apos;re still building this section.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm underline hover:text-accent"
      >
        ← Back to home
      </Link>
    </main>
  );
}
