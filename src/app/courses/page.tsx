import type { Metadata } from "next";
import Link from "next/link";
import CourseDirectory from "@/components/CourseDirectory";
import { courses } from "@/lib/courses";
import { providers } from "@/lib/providers";
import { parsePrice } from "@/lib/course-filters";
import { getSection } from "@/lib/sections";
import TerminalStatPanel from "@/components/TerminalStatPanel";
import IconPatternBackdrop from "@/components/IconPatternBackdrop";
import { BookIcon, CheckIcon, StarIcon } from "@/components/icons";
import PageIntro from "@/components/PageIntro";

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
      <PageIntro
        size="lg"
        eyebrow={section.title}
        title={
          <>Find a course that{" "}
            <span className="brand-wordmark" style={{ fontFamily: "var(--font-heading)" }}>
              actually fits
            </span>{" "}
            how you trade</>
        }
        lede={<>What each course covers, how it&apos;s delivered and what it costs — plus independent
            Trustpilot ratings, not just the provider&apos;s own claims. We don&apos;t verify
            trading performance or results.</>}
        aside={
          <TerminalStatPanel
          caption="The directory, at a glance"
          backdrop={<IconPatternBackdrop icons={[BookIcon, StarIcon, CheckIcon]} />}
          stats={[
            { label: "Courses & providers", value: courses.length + providers.length },
            { label: "With a free tier", value: freeTierCount },
            { label: "Independently rated", value: ratedCount },
            { label: "Performance scores shown", value: 0 },
          ]}
          footnote="Ratings come from Trustpilot or Whop, sourced and linked on every course page — never our own score."
        />
        }
      >
        <div className="flex flex-wrap items-center gap-3">
            <a href="#browse" className="btn btn-primary">
              <BookIcon className="size-4" />
              Browse all courses
            </a>
            <Link href="/strategies" className="btn btn-outline">
              Prefer to learn for free? Try a strategy
            </Link>
          </div>
      </PageIntro>

      <div id="browse" className="mt-6 scroll-mt-20 border-t border-border pt-10">
        <CourseDirectory courses={courses} providers={providers} />
      </div>
    </>
  );
}
