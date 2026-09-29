import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSection } from "@/lib/sections";

const section = getSection("strategies");

export const metadata: Metadata = { title: section.title };

export default function StrategiesPage() {
  return <ComingSoon section={section} />;
}
