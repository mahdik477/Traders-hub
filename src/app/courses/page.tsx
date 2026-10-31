import type { Metadata } from "next";
import Link from "next/link";
import CourseDirectory from "@/components/CourseDirectory";
import { courses } from "@/lib/courses";
import { providers } from "@/lib/providers";
import { parsePrice } from "@/lib/course-filters";
import { getSection } from "@/lib/sections";
import CountUpStat from "@/components/CountUpStat";
import { BookIcon } from "@/components/icons";

const section = getSection("courses");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

export default function CoursesPage() {
  const freeTierCount = courses.filter((c) => c.pricing.some((p) => parsePrice(p.price) === 0)).length;
  const ratedCount = courses.filter((c) => c.trustpilot || c.whop).length;

  return (
    <>
      <header className="detail-hero mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="p-5 sm:p-7">
          <p className="eyebrow">{section.title}</p>
          <h1 className="page-title mt-2">Find a course that actually fits how you trade</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
            What each course covers, how it&apos;s delivered and what it costs — plus independent
            Trustpilot ratings, not just the provider&apos;s own claims. We don&apos;t verify
            trading performance or results.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="#browse" className="btn btn-primary">
              <BookIcon className="size-4" />
              Browse all courses
            </a>
            <Link href="/strategies" className="btn btn-outline">
              Prefer to learn for free? Try a strategy
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <HeroStat label="Courses" value={courses.length + providers.length} />
          <HeroStat label="With a free tier" value={freeTierCount} />
          <HeroStat label="Independently rated" value={ratedCount} />
        </dl>
      </header>

      <div id="browse" className="mt-10 scroll-mt-20">
        <CourseDirectory courses={courses} providers={providers} />
      </div>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
      <div className="eyebrow">{label}</div>
      <div className="figure-lg mt-1 text-foreground sm:text-xl">
        <CountUpStat value={value} />
      </div>
    </div>
  );
}
