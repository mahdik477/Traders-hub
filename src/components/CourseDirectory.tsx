import Image from "next/image";
import Link from "next/link";
import type { CourseView } from "@/lib/course-types";
import type { ProviderView } from "@/lib/provider-types";
import TrustpilotStars from "@/components/TrustpilotStars";

type Entry = {
  id: string;
  name: string;
  logo: string | null;
  tagline: string | null;
  trustpilot: CourseView["trustpilot"];
  fromPrice: string | null;
  href: string;
  /** Set only for a multi-course provider, e.g. "6 courses". */
  courseCountLabel: string | null;
};

// Grid of cards — the "browse options" view. Takes both standalone courses
// (one card, one page) and multi-course providers like Sharper Trades (one
// card, linking to a hub page that lists its several courses).
export default function CourseDirectory({
  courses,
  providers = [],
}: {
  courses: CourseView[];
  providers?: ProviderView[];
}) {
  const entries: Entry[] = [
    ...courses.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo,
      tagline: c.tagline,
      trustpilot: c.trustpilot,
      fromPrice: c.pricing[0]?.price ?? null,
      href: `/courses/${c.id}`,
      courseCountLabel: null,
    })),
    ...providers.map((p) => {
      const prices = p.courses.flatMap((c) => c.pricing[0]?.price ?? []);
      return {
        id: p.id,
        name: p.name,
        logo: p.logo,
        tagline: p.tagline,
        trustpilot: p.trustpilot,
        fromPrice: prices[0] ?? null,
        href: `/courses/${p.id}`,
        courseCountLabel: `${p.courses.length} courses`,
      };
    }),
  ];

  return (
    <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:border-accent/50 hover:shadow-glow motion-safe:hover:-translate-y-0.5"
        >
          <div className="h-1 w-full bg-gradient-to-r from-accent to-accent-strong" />
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center gap-3">
              {entry.logo ? (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white p-2">
                  <Image
                    src={entry.logo}
                    alt={`${entry.name} logo`}
                    width={56}
                    height={56}
                    className="h-auto max-h-9 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg font-bold text-accent">
                  {entry.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{entry.name}</h2>
                {entry.trustpilot && (
                  <div className="mt-1 text-xs">
                    <TrustpilotStars rating={entry.trustpilot} size="sm" />
                  </div>
                )}
              </div>
            </div>

            {entry.tagline && <p className="mt-4 text-sm text-muted">{entry.tagline}</p>}

            <div className="mt-5 flex items-end justify-between gap-3">
              {entry.fromPrice && (
                <div>
                  <div className="eyebrow">From</div>
                  <div className="figure-lg mt-1 text-accent">{entry.fromPrice}</div>
                </div>
              )}
              {entry.courseCountLabel && <span className="pill">{entry.courseCountLabel}</span>}
            </div>

            <Link
              href={entry.href}
              className="btn btn-primary mt-5 w-full after:absolute after:inset-0"
            >
              {entry.courseCountLabel ? "View courses" : "View course"}
              <span className="sr-only"> — {entry.name}</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
