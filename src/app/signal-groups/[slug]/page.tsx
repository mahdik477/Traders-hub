import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SignalGroupDetail from "@/components/SignalGroupDetail";
import { getSignalGroup, signalGroups } from "@/lib/signal-groups";
import { signalGroupSummary } from "@/lib/signal-group-summary";
import { getSection } from "@/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return signalGroups.map((group) => ({ slug: group.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/signal-groups/[slug]">): Promise<Metadata> {
  const group = getSignalGroup((await params).slug);
  if (!group) return {};
  return {
    title: `${group.name} — ${getSection("signal-groups").title}`,
    description: signalGroupSummary(group).text,
  };
}

export default async function SignalGroupPage({ params }: PageProps<"/signal-groups/[slug]">) {
  const group = getSignalGroup((await params).slug);
  if (!group) notFound();
  return <SignalGroupDetail group={group} />;
}
