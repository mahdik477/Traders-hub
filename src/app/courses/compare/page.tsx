import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import CourseCompare from "@/components/CourseCompare";
import { courses } from "@/lib/courses";
import { providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Compare courses",
  description: "Compare trading courses side by side: pricing, markets, platforms and ratings.",
};

export default function CompareCoursesPage() {
  return (
    <>
      <Link href="/courses" className="back-link">
        <ChevronLeftIcon className="size-4" />
        All courses
      </Link>
      <h1 className="page-title mt-5">Compare courses</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Side by side on pricing, markets, platforms and what&apos;s actually included. We don&apos;t
        verify trading performance or results — ratings shown are from Trustpilot/Whop, not us.
      </p>
      <CourseCompare courses={courses} providers={providers} />
    </>
  );
}
