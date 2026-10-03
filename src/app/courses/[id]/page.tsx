import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourse } from "@/lib/courses";
import { providers, getProvider } from "@/lib/providers";
import { getSection } from "@/lib/sections";
import CourseDetail from "@/components/CourseDetail";
import TrustpilotStars from "@/components/TrustpilotStars";
import { ChevronLeftIcon } from "@/components/icons";

// This one route serves two kinds of page, both addressed as /courses/<id>:
// a standalone course (from courses-data-*.json) renders the full course
// detail body directly; a multi-course provider (from providers-data-*.json,
// e.g. Sharper Trades) renders a hub listing its courses, each of which gets
// its own page at /courses/<id>/<course slug> (see the nested route).
export const dynamicParams = false;

export function generateStaticParams() {
  return [...courses.map((c) => ({ id: c.id })), ...providers.map((p) => ({ id: p.id }))];
}

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);
  if (course) {
    return {
      title: `${course.name} — ${getSection("courses").title}`,
      description: course.tagline ?? undefined,
    };
  }
  const provider = getProvider(id);
  if (provider) {
    return {
      title: `${provider.name} — ${getSection("courses").title}`,
      description: provider.tagline ?? undefined,
    };
  }
  return {};
}

export default async function CourseOrProviderPage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;

  const course = getCourse(id);
  if (course) {
    return (
      <CourseDetail
        name={course.name}
        logo={course.logo}
        tagline={course.tagline}
        about={course.about}
        instructors={course.instructor ? [course.instructor] : []}
        trustpilot={course.trustpilot}
        pricing={course.pricing}
        formats={course.formats}
        platforms={course.platforms}
        stats={course.stats}
        brokerPartnership={course.brokerPartnership}
        curriculum={course.curriculum}
        testimonials={course.testimonials}
        testimonialsNote={course.testimonialsNote}
        visitHref={course.affiliateLink ?? course.website}
        backHref="/courses"
        backLabel="Back to courses"
      />
    );
  }

  const provider = getProvider(id);
  if (!provider) notFound();

  return (
    <>
      <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeftIcon className="size-4" />
        Back to courses
      </Link>

      {/* Hero */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-glow sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {provider.logo && (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-white p-3 shadow-sm sm:size-24">
              <Image
                src={provider.logo}
                alt={`${provider.name} logo`}
                width={96}
                height={96}
                className="h-auto max-h-14 w-full object-contain sm:max-h-16"
                priority
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="page-title">{provider.name}</h1>
            {provider.tagline && <p className="mt-2 max-w-2xl text-base text-muted">{provider.tagline}</p>}
            {provider.trustpilot && (
              <div className="mt-3">
                <TrustpilotStars rating={provider.trustpilot} />
              </div>
            )}
          </div>
        </div>
      </div>

      {provider.about && <p className="mt-6 max-w-3xl text-muted">{provider.about}</p>}

      <section aria-labelledby="provider-courses-heading" className="mt-10">
        <h2 id="provider-courses-heading" className="section-title">
          {provider.name}&apos;s courses
        </h2>
        <p className="meta mt-2">
          {provider.name} sells these separately rather than as one course — pick whichever fits
          what you&apos;re after.
        </p>
        <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {provider.courses.map((course) => {
            const fromPrice = course.pricing[0];
            return (
              <li
                key={course.slug}
                className="group relative flex flex-col rounded-xl border border-border bg-surface p-5 transition duration-200 hover:border-accent/50 hover:shadow-glow motion-safe:hover:-translate-y-0.5"
              >
                <h3 className="text-lg font-semibold">{course.name}</h3>
                {course.bundleOf.length > 0 && (
                  <p className="meta mt-1">Bundle of {course.bundleOf.join(", ")}</p>
                )}
                {course.tagline && <p className="mt-2 text-sm text-muted">{course.tagline}</p>}
                {fromPrice && (
                  <div className="mt-4">
                    <div className="eyebrow">From</div>
                    <div className="figure-lg mt-1 text-accent">{fromPrice.price}</div>
                  </div>
                )}
                <Link
                  href={`/courses/${provider.id}/${course.slug}`}
                  className="btn btn-primary mt-5 w-full after:absolute after:inset-0"
                >
                  View course
                  <span className="sr-only"> — {course.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
