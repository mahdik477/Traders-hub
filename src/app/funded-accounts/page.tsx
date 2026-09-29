import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";
import { getSection } from "@/lib/sections";

const section = getSection("funded-accounts");

export const metadata: Metadata = { title: section.title };

export default function FundedAccountsPage() {
  return <ComingSoon section={section} />;
}
