import Image from "next/image";
import Link from "next/link";
import type { CourseView } from "@/lib/course-types";
import TrustpilotStars from "@/components/TrustpilotStars";

// Grid of course cards — the "browse options" view. One card today, built to
// take more without changes once there's more than one course.
export default function CourseDirectory({ courses }: { courses: CourseView[] }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const fromPrice = course.pricing[0];
        return (
          <li
            key={course.id}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:border-accent/50 hover:shadow-glow motion-safe:hover:-translate-y-0.5"
          >
            <div className="h-1 w-full bg-gradient-to-r from-accent to-accent-strong" />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-3">
                {course.logo ? (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white p-2">
                    <Image
                      src={course.logo}
                      alt={`${course.name} logo`}
                      width={56}
                      height={56}
                      className="h-auto max-h-9 w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg font-bold text-accent">
                    {course.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{course.name}</h2>
                  {course.trustpilot && (
                    <div className="mt-1 text-xs">
                      <TrustpilotStars rating={course.trustpilot} size="sm" />
                    </div>
                  )}
                </div>
              </div>

              {course.tagline && <p className="mt-4 text-sm text-muted">{course.tagline}</p>}

              {fromPrice && (
                <div className="mt-5">
                  <div className="eyebrow">From</div>
                  <div className="figure-lg mt-1 text-accent">{fromPrice.price}</div>
                </div>
              )}

              <Link
                href={`/courses/${course.id}`}
                className="btn btn-primary mt-5 w-full after:absolute after:inset-0"
              >
                View course
                <span className="sr-only"> — {course.name}</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
