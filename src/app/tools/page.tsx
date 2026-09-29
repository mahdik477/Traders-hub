import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSection } from "@/lib/sections";

const section = getSection("tools");

export const metadata: Metadata = { title: section.title };

export default function ToolsPage() {
  return <ComingSoon section={section} />;
}
