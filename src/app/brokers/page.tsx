import type { Metadata } from "next";
import BrokersBrowse from "@/components/BrokersBrowse";
import { getSection } from "@/lib/sections";

const section = getSection("brokers");

export const metadata: Metadata = {
  title: section.title,
  description: section.summary,
};

export default function BrokersPage() {
  return <BrokersBrowse category="cfd" />;
}
