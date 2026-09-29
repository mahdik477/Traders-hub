import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSection } from "@/lib/sections";

const section = getSection("signal-groups");

export const metadata: Metadata = { title: section.title };

export default function SignalGroupsPage() {
  return <ComingSoon section={section} />;
}
