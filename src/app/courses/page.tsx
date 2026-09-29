import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSection } from "@/lib/sections";

const section = getSection("courses");

export const metadata: Metadata = { title: section.title };

export default function CoursesPage() {
  return <ComingSoon section={section} />;
}
