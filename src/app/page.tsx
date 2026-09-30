import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";

export default function Home() {
  return (
    <>
      <section className="pb-12 pt-4 sm:pb-16 sm:pt-8">
        <h1 className="page-title max-w-3xl sm:text-5xl">
          Discover and compare trading products in one place
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          {SITE_NAME} helps traders find and compare prop firms, brokers,
          courses, tools and signal groups side by side, so you can see the
          facts and decide for yourself.
        </p>
      </section>

      <section
        aria-labelledby="what-we-are"
        className="rounded-xl border border-border bg-surface p-6"
      >
        <h2 id="what-we-are" className="section-title">
          Discovery, not verification
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-subtle">
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

      <section aria-labelledby="sections-heading" className="pt-14">
        <h2 id="sections-heading" className="section-title">
          What you&apos;ll find here
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <li key={section.slug}>
              <Link
                href={`/${section.slug}`}
                className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong hover:bg-surface-2"
              >
                <span
                  className={
                    section.status === "live" ? "badge badge-success self-start" : "pill self-start"
                  }
                >
                  {section.status === "live"
                    ? "Browse now"
                    : section.status === "next-up"
                      ? "Next up"
                      : "Coming soon"}
                </span>
                <span className="mt-3 text-lg font-semibold">
                  {section.title}
                </span>
                <span className="meta mt-1.5">{section.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
