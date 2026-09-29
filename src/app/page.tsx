import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4">
      <section className="py-16 sm:py-24">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Discover and compare trading products in one place
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          {SITE_NAME} helps traders find and compare prop firms, brokers,
          courses, tools and signal groups side by side, so you can see the
          facts and decide for yourself.
        </p>
      </section>

      <section
        aria-labelledby="what-we-are"
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2 id="what-we-are" className="text-lg font-semibold">
          Discovery, not verification
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>We are a directory and comparison site.</li>
          <li>
            We are not a broker, not a signal provider and not a financial
            adviser.
          </li>
          <li>
            We do not verify or rank anyone&apos;s trading performance, accuracy
            or win rate.
          </li>
          <li>
            We earn money through affiliate links and clearly labelled sponsored
            listings.
          </li>
        </ul>
      </section>

      <section aria-labelledby="sections-heading" className="py-16">
        <h2 id="sections-heading" className="text-2xl font-semibold">
          What you&apos;ll find here
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <li key={section.slug}>
              <Link
                href={`/${section.slug}`}
                className="flex h-full flex-col rounded-lg border border-border p-5 transition-colors hover:border-accent"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-accent">
                  {section.status === "next-up" ? "Next up" : "Coming soon"}
                </span>
                <span className="mt-2 text-lg font-semibold">
                  {section.title}
                </span>
                <span className="mt-2 text-sm text-muted">
                  {section.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
