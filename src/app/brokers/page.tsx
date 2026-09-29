import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSection } from "@/lib/sections";

const section = getSection("brokers");

export const metadata: Metadata = { title: section.title };

export default function BrokersPage() {
  return <ComingSoon section={section} />;
}
