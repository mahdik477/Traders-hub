import type { Metadata } from "next";
import CourseDirectory from "@/components/CourseDirectory";
import { courses } from "@/lib/courses";
import { getSection } from "@/lib/sections";

const section = getSection("courses");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

export default function CoursesPage() {
  return (
    <>
      <h1 className="page-title">{section.title}</h1>
      <p className="mt-3 text-lg text-muted">
        Compare trading courses side by side: what they cover, how they&apos;re delivered, pricing
        and independent Trustpilot ratings.
      </p>
      <p className="meta mt-3 max-w-2xl">
        We don&apos;t verify trading performance or results — see each course&apos;s page for
        where its testimonials and ratings come from.
      </p>

      <CourseDirectory courses={courses} />
    </>
  );
}
