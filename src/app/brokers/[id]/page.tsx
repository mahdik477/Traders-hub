import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrokerProfile from "@/components/BrokerProfile";
import { brokers, getBroker } from "@/lib/brokers";

export const dynamicParams = false;

export function generateStaticParams() {
  return brokers.map((broker) => ({ id: broker.id }));
}

export async function generateMetadata({ params }: PageProps<"/brokers/[id]">): Promise<Metadata> {
  const broker = getBroker((await params).id);
  if (!broker) return {};
  return {
    title: broker.name,
    description: broker.tagline ?? undefined,
  };
}

export default async function BrokerPage({ params }: PageProps<"/brokers/[id]">) {
  const broker = getBroker((await params).id);
  if (!broker) notFound();
  return <BrokerProfile broker={broker} />;
}
