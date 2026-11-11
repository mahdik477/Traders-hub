import type { Metadata } from "next";
import CourseCompare from "@/components/CourseCompare";
import { courses } from "@/lib/courses";
import { providers } from "@/lib/providers";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Compare courses",
  description: "Compare trading courses side by side: pricing, markets, platforms and ratings.",
};

export default function CompareCoursesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Courses"
        back={{ href: "/courses", label: "All courses" }}
        title={<>Compare courses</>}
        lede={<>Side by side on pricing, markets, platforms and what&apos;s actually included. We don&apos;t
        verify trading performance or results — ratings shown are from Trustpilot/Whop, not us.</>}
      />
      <CourseCompare courses={courses} providers={providers} />
    </>
  );
}
