import type { Metadata } from "next";
import type { JSX, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourse } from "@/lib/courses";
import { getSection } from "@/lib/sections";
import TrustpilotStars from "@/components/TrustpilotStars";
import VisitSiteLink from "@/components/VisitSiteLink";
import { BookIcon, InfoIcon, LayersIcon, MonitorIcon, QuoteIcon, TagIcon, formatIcon } from "@/components/icons";

// One page per course data file, e.g. /courses/six-figure-capital. Built
// ahead of time; any other address shows "not found".
export const dynamicParams = false;

export function generateStaticParams() {
  return courses.map((c) => ({ course: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[course]">): Promise<Metadata> {
  const course = getCourse((await params).course);
  if (!course) return {};
  return {
    title: `${course.name} — ${getSection("courses").title}`,
    description: course.tagline ?? undefined,
  };
}

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="section-title flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  );
}

export default async function CoursePage({ params }: PageProps<"/courses/[course]">) {
  const course = getCourse((await params).course);
  if (!course) notFound();

  const visitHref = course.affiliateLink ?? course.website;
  const totalLessons = course.curriculum.reduce((n, m) => n + (m.moduleCount ?? m.topics.length), 0);

  return (
    <>
      <Link href="/courses" className="text-sm text-muted hover:text-foreground">
        ← Back to courses
      </Link>

      {/* Hero */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-glow sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {course.logo && (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-white p-3 shadow-sm sm:size-24">
              <Image
                src={course.logo}
                alt={`${course.name} logo`}
                width={96}
                height={96}
                className="h-auto max-h-14 w-full object-contain sm:max-h-16"
                priority
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="page-title">{course.name}</h1>
            {course.tagline && (
              <p className="mt-2 max-w-2xl text-base text-muted">{course.tagline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {course.trustpilot && <TrustpilotStars rating={course.trustpilot} />}
              {course.instructor && (
                <span className="meta">
                  Instructor:{" "}
                  {course.instructor.link ? (
                    <a
                      href={course.instructor.link}
                      target="_blank"
                      rel="noopener"
                      className="text-accent hover:underline"
                    >
                      {course.instructor.name}
                    </a>
                  ) : (
                    course.instructor.name
                  )}
                </span>
              )}
            </div>
          </div>
          {visitHref && (
            <VisitSiteLink href={visitHref} firmName={course.name} className="shrink-0 sm:self-start" />
          )}
        </div>

        {/* Quick stats */}
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-4">
          {course.pricing[0] && (
            <Stat label="Starts from" value={course.pricing[0].price} />
          )}
          {totalLessons > 0 && <Stat label="Lessons" value={`${totalLessons}+`} />}
          {course.trustpilot && <Stat label="Trustpilot" value={course.trustpilot.rating.toFixed(1)} />}
          {course.platforms.length > 0 && (
            <Stat label="Platforms" value={String(course.platforms.length)} />
          )}
        </div>
      </div>

      {course.about && (
        <section aria-labelledby="about-heading" className="mt-10 max-w-3xl">
          <SectionHeading id="about-heading" icon={InfoIcon}>
            About
          </SectionHeading>
          <p className="mt-3 text-muted">{course.about}</p>
        </section>
      )}

      {course.pricing.length > 0 && (
        <section aria-labelledby="pricing-heading" className="mt-10">
          <SectionHeading id="pricing-heading" icon={TagIcon}>
            Pricing
          </SectionHeading>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {course.pricing.map((tier) => (
              <li
                key={tier.name}
                className={`relative rounded-xl border p-5 transition hover:-translate-y-0.5 ${
                  tier.highlight
                    ? "border-accent bg-accent/6 shadow-glow"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                {tier.highlight && (
                  <span className="badge badge-success absolute -top-2.5 left-4">
                    {tier.highlight}
                  </span>
                )}
                <div className="eyebrow">{tier.name}</div>
                <div className="figure-lg mt-1">{tier.price}</div>
                {tier.billingNote && <p className="meta mt-2">{tier.billingNote}</p>}
              </li>
            ))}
          </ul>
          <p className="meta mt-3">
            Prices and terms change often. Always check the provider&apos;s own website before
            buying.
          </p>
        </section>
      )}

      {course.formats.length > 0 && (
        <section aria-labelledby="formats-heading" className="mt-10">
          <SectionHeading id="formats-heading" icon={LayersIcon}>
            What&apos;s included
          </SectionHeading>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {course.formats.map((format) => {
              const Icon = formatIcon(format.label);
              return (
                <li
                  key={format.label}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong hover:bg-surface-2"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{format.label}</h3>
                    <p className="mt-1 text-sm text-muted">{format.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {course.platforms.length > 0 && (
        <section aria-labelledby="platforms-heading" className="mt-10">
          <SectionHeading id="platforms-heading" icon={MonitorIcon}>
            Platforms
          </SectionHeading>
          <ul className="mt-4 flex flex-wrap gap-2">
            {course.platforms.map((p) => (
              <li key={p} className="pill">
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {course.curriculum.length > 0 && (
        <section aria-labelledby="curriculum-heading" className="mt-10">
          <SectionHeading id="curriculum-heading" icon={BookIcon}>
            What you&apos;ll learn
          </SectionHeading>
          <div className="mt-4 space-y-3">
            {course.curriculum.map((module, i) => (
              <details
                key={module.title}
                open={i === 0}
                className="group rounded-xl border border-border bg-surface"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-foreground">{module.title}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {module.moduleCount != null && (
                      <span className="pill">{module.moduleCount} lessons</span>
                    )}
                    <span
                      aria-hidden="true"
                      className="text-muted transition-transform group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <ul className="meta space-y-2 border-t border-border px-5 py-4 pl-[3.25rem]">
                  {module.topics.map((topic) => (
                    <li key={topic} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}

      {course.testimonials.length > 0 && (
        <section aria-labelledby="testimonials-heading" className="mt-10">
          <SectionHeading id="testimonials-heading" icon={QuoteIcon}>
            Testimonials
          </SectionHeading>
          <p className="meta mt-2 max-w-2xl italic">{course.testimonialsNote}</p>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {course.testimonials.map((t, i) => (
              <li
                key={i}
                className="flex flex-col rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
              >
                <QuoteIcon className="size-6 text-accent/50" />
                <p className="mt-2 flex-1 text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="meta mt-4 border-t border-border pt-3">
                  <span className="font-medium text-foreground">{t.author}</span>
                  {t.source && <span className="block text-subtle">{t.source}</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visitHref && (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-accent/30 bg-accent/6 p-8 text-center">
          <h2 className="text-xl font-semibold">Ready to take a closer look?</h2>
          <p className="max-w-md text-sm text-muted">
            Visit {course.name}&apos;s own site for full terms, current pricing and to sign up.
          </p>
          <VisitSiteLink href={visitHref} firmName={course.name} className="mt-1" />
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-xl font-bold text-accent">{value}</div>
    </div>
  );
}
